"""Harmonic/percussive median filtering: a texture proxy, not instrument stems.

Analyze complete labelled recordings, plus all Drumul/Scottish/mazurka controls.
All audio-derived arrays stay in /tmp. No audio is exported or distributed.
"""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
os.environ['OMP_NUM_THREADS']='1'
import concurrent.futures,json,subprocess,time
from pathlib import Path
import numpy as np
from scipy import signal,ndimage
BASE=Path('/tmp/balfolk-deep');SR=22050;FFT=2048;HOP=512
FF='/Users/pmigdal/.cache/uv/archive-v0/ezK7oLJgpX1oqaOC/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'

def analyze(t):
    target=BASE/'texture'/f"{t['id']}.npz"
    if target.exists():return dict(id=t['id'],status='cached')
    start=time.monotonic()
    try:
        raw=subprocess.check_output([FF,'-v','error','-i',t['path'],'-ac','1','-ar',str(SR),'-f','f32le','-'],timeout=120)
        y=np.frombuffer(raw,dtype='<f4')
        f,tt,z=signal.stft(y,fs=SR,nperseg=FFT,noverlap=FFT-HOP,boundary=None,padded=False)
        mag=np.abs(z).T.copy();del z,y,raw
        bands=[(40,180),(180,500),(500,2000),(2000,8000),(40,8000)]
        masks=[(f>=lo)&(f<hi) for lo,hi in bands]
        arrays={k:np.zeros((len(mag),5),np.float32) for k in ['percussive_flux','harmonic_flux','percussive_logflux','harmonic_logflux','percussive_energy','harmonic_energy','strict_percussive_energy','strict_harmonic_energy','total_energy']}
        previous={k:np.zeros(len(f),np.float32) for k in ['p','h']}
        for i in range(0,len(mag),1024):
            end=min(i+1024,len(mag));lo=max(0,i-15);hi=min(len(mag),end+15)
            m=mag[lo:hi]
            h=ndimage.median_filter(m,size=(31,1),mode='reflect')[i-lo:end-lo]
            p=ndimage.median_filter(m,size=(1,31),mode='reflect')[i-lo:end-lo]
            m=mag[i:end];h2=h*h;p2=p*p
            pm=p2/(p2+h2+1e-20);hm=1-pm
            ps=p2/(p2+9*h2+1e-20);hs=h2/(h2+9*p2+1e-20)
            for name,key,mask in [('percussive','p',pm),('harmonic','h',hm)]:
                a=m*mask;prev=np.vstack([previous[key][None,:],a[:-1]])
                flux=np.maximum(0,a-prev);logflux=np.maximum(0,np.log1p(a*1000)-np.log1p(prev*1000))
                previous[key]=a[-1].copy()
                for b,bm in enumerate(masks):
                    arrays[name+'_flux'][i:end,b]=flux[:,bm].sum(axis=1)
                    arrays[name+'_logflux'][i:end,b]=logflux[:,bm].mean(axis=1)
                    arrays[name+'_energy'][i:end,b]=(a[:,bm]**2).sum(axis=1)
            for b,bm in enumerate(masks):
                arrays['strict_percussive_energy'][i:end,b]=((m*ps)[:,bm]**2).sum(axis=1)
                arrays['strict_harmonic_energy'][i:end,b]=((m*hs)[:,bm]**2).sum(axis=1)
                arrays['total_energy'][i:end,b]=(m[:,bm]**2).sum(axis=1)
        np.savez_compressed(target,**arrays,sr=SR,fft=FFT,hop=HOP,duration=t['seconds'])
        return dict(id=t['id'],name=t['name'],status='ok',elapsed_seconds=time.monotonic()-start)
    except Exception as e:return dict(id=t['id'],name=t['name'],status='error',error=repr(e))

def main():
    (BASE/'texture').mkdir(exist_ok=True)
    tracks=[t for t in json.load(open(BASE/'reviewed-manifest.json')) if t['labels']]
    tracks.sort(key=lambda t:(not bool(set(t['labels'])&{'drumul','schottische','mazurka'}),t['name']))
    with concurrent.futures.ProcessPoolExecutor(max_workers=2) as pool,open(BASE/'texture-log.jsonl','a') as log:
        for i,r in enumerate(pool.map(analyze,tracks)):
            log.write(json.dumps(r,ensure_ascii=False)+'\n');log.flush();print(i+1,len(tracks),r,flush=True)

if __name__=='__main__':main()
