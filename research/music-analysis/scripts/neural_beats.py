"""Local Beat This! inference; retain predictions rather than claiming ground truth."""
import os
os.environ.setdefault('OMP_NUM_THREADS','3')
import argparse,json,time,subprocess,collections
from pathlib import Path
import numpy as np
import torch
from beat_this.inference import Audio2Frames
from beat_this.model.postprocessor import Postprocessor

BASE=Path('/tmp/balfolk-deep')
FF='/Users/pmigdal/.cache/uv/archive-v0/ezK7oLJgpX1oqaOC/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'

def main():
    p=argparse.ArgumentParser();p.add_argument('--model',default='final0');p.add_argument('--scope',default='all');args=p.parse_args()
    torch.set_num_threads(3)
    model=Audio2Frames(str(BASE/f'beat-this-{args.model}.ckpt'),device='cpu')
    post=Postprocessor(type='minimal')
    tracks=json.load(open(BASE/'manifest.json'))+json.load(open(BASE/'public-manifest.json'))
    if args.scope=='priority':tracks=[t for t in tracks if t['labels'] or 'Blowzabella' in t['name']]
    tracks.sort(key=lambda t:(not ('drumul' in t['labels'] or 'schottische' in t['labels'] or 'mazurka' in t['labels']),not bool(t['labels']),t['name']))
    dst=BASE/f'neural-{args.model}';dst.mkdir(exist_ok=True)
    for i,t in enumerate(tracks):
        target=dst/f"{t['id']}.json"
        if target.exists():continue
        start=time.monotonic()
        try:
            raw=subprocess.check_output([FF,'-v','error','-i',t['path'],'-ac','1','-ar','22050','-f','f32le','-'],timeout=120)
            y=np.frombuffer(raw,dtype='<f4')
            bl,dl=model(y,22050)
            beats,downbeats=post(bl,dl)
            beats=np.asarray(beats);downbeats=np.asarray(downbeats)
            bp=torch.sigmoid(bl).cpu().numpy();dp=torch.sigmoid(dl).cpu().numpy()
            counts=[int(np.sum((beats>=a-.04)&(beats<b-.04))) for a,b in zip(downbeats[:-1],downbeats[1:])]
            ibi=np.diff(beats);credible=ibi[(ibi>.18)&(ibi<2)]
            tempo=[]
            for sec in range(0,int(len(y)/22050),16):
                b=beats[(beats>=sec)&(beats<sec+16)]
                if len(b)>4:tempo.append(dict(start=sec,bpm=float(60/np.median(np.diff(b))),p10=float(np.percentile(60/np.diff(b),10)),p90=float(np.percentile(60/np.diff(b),90))))
            result=dict(id=t['id'],name=t['name'],model=args.model,duration=len(y)/22050,beats=beats.tolist(),downbeats=downbeats.tolist(),bar_beat_counts=counts,bar_count_histogram=dict(collections.Counter(counts)),median_bpm=float(60/np.median(credible)) if len(credible) else None,tempo_windows=tempo,beat_activation_at_predictions=float(np.median(bp[np.clip(np.round(beats*50).astype(int),0,len(bp)-1)])) if len(beats) else None,elapsed_seconds=time.monotonic()-start)
            target.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
            np.savez_compressed(dst/f"{t['id']}-activations.npz",beat=bp.astype(np.float16),downbeat=dp.astype(np.float16),fps=50)
            print(i+1,len(tracks),t['name'],round(result['elapsed_seconds'],1),result['median_bpm'],result['bar_count_histogram'],flush=True)
        except Exception as e:
            with open(dst/'errors.jsonl','a') as f:f.write(json.dumps(dict(id=t['id'],name=t['name'],error=repr(e)))+'\n')
            print('ERROR',t['name'],repr(e),flush=True)

if __name__=='__main__':main()
