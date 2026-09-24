"""Complete-recording features, with all frame times tied to decoded audio time.

Temporary audio/features stay outside the repository. No model claims to hear audio.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
os.environ.setdefault('OMP_NUM_THREADS','1')
import concurrent.futures
import hashlib
import json
import subprocess
import time
from pathlib import Path
import numpy as np
from scipy import signal

BASE=Path('/tmp/balfolk-deep')
SR=22050
HOP=256
FFT=2048
FF='/Users/pmigdal/.cache/uv/archive-v0/ezK7oLJgpX1oqaOC/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
BANDS=[(40,180),(180,500),(500,2000),(2000,8000),(40,8000)]

def extract(t):
    dest=BASE/'features'/f"{t['id']}.npz"
    if dest.exists():return dict(id=t['id'],status='cached')
    started=time.monotonic()
    try:
        p=subprocess.run([FF,'-v','error','-i',t['path'],'-map','0:a:0','-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,timeout=180)
        if p.returncode:raise RuntimeError(p.stderr.decode(errors='replace')[:400])
        y=np.frombuffer(p.stdout,dtype='<f4')
        if len(y)<FFT:raise ValueError('Recording too short')
        linear=[];logged=[];energy=[];chroma=[];rms=[];centroid=[]
        freq=np.fft.rfftfreq(FFT,1/SR)
        masks=[(freq>=lo)&(freq<hi) for lo,hi in BANDS]
        bins=np.flatnonzero((freq>=65)&(freq<2000))
        pitch=np.round(69+12*np.log2(freq[bins]/440)).astype(int)%12
        prev=None;prevlog=None
        # Frame-aligned chunks: every complete STFT frame appears exactly once.
        frames_per_chunk=1024
        nframes=1+(len(y)-FFT)//HOP
        for first in range(0,nframes,frames_per_chunk):
            count=min(frames_per_chunk,nframes-first)
            block=y[first*HOP:(first+count-1)*HOP+FFT]
            _,_,z=signal.stft(block,fs=SR,window='hann',nperseg=FFT,noverlap=FFT-HOP,boundary=None,padded=False)
            s=np.abs(z).astype(np.float32)
            log=np.log1p(s*1000)
            diff=np.maximum(0,np.diff(s,axis=1,prepend=s[:,:1] if prev is None else prev))
            dlog=np.maximum(0,np.diff(log,axis=1,prepend=log[:,:1] if prevlog is None else prevlog))
            linear.append(np.stack([diff[m].sum(axis=0) for m in masks],axis=1))
            logged.append(np.stack([dlog[m].mean(axis=0) for m in masks],axis=1))
            energy.append(np.stack([(s[m]**2).sum(axis=0) for m in masks],axis=1))
            ch=np.stack([(s[bins[pitch==pc]]**2).sum(axis=0) for pc in range(12)],axis=1)
            chroma.append(ch/(ch.sum(axis=1,keepdims=True)+1e-12))
            centroid.append((freq[:,None]*s).sum(axis=0)/(s.sum(axis=0)+1e-12))
            rms.append(np.sqrt((s*s).sum(axis=0)))
            prev=s[:,-1:];prevlog=log[:,-1:]
        dest.parent.mkdir(exist_ok=True)
        np.savez_compressed(dest,linear=np.concatenate(linear),logged=np.concatenate(logged),energy=np.concatenate(energy),chroma=np.concatenate(chroma),rms=np.concatenate(rms),centroid=np.concatenate(centroid).astype(np.float32),duration=len(y)/SR,sr=SR,hop=HOP,fft=FFT)
        return dict(id=t['id'],name=t['name'],status='ok',duration=len(y)/SR,frames=nframes,decoded_hash=hashlib.sha256(p.stdout).hexdigest(),seconds=round(time.monotonic()-started,2))
    except Exception as e:return dict(id=t['id'],name=t['name'],status='error',error=str(e))

def main():
    tracks=json.load(open(BASE/'manifest.json'))
    if (BASE/'public-manifest.json').exists():tracks+=json.load(open(BASE/'public-manifest.json'))
    with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool, open(BASE/'extraction-log.jsonl','a') as log:
        for i,r in enumerate(pool.map(extract,tracks)):
            log.write(json.dumps(r,ensure_ascii=False)+'\n');log.flush()
            print(i+1,len(tracks),r.get('name',r['id']),r['status'],r.get('seconds',''),flush=True)

if __name__=='__main__':main()
