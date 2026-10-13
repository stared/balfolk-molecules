import os
os.environ['OMP_NUM_THREADS']='2';os.environ['OPENBLAS_NUM_THREADS']='2'
import numpy as np,scipy.signal as sig,librosa,json,subprocess,hashlib,time
from pathlib import Path
base=Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync'));ff=os.environ.get('FFMPEG_BINARY', 'ffmpeg')
for p in sorted((base/'audio').glob('*')):
 if p.suffix not in ['.webm','.m4a','.mp3']:continue
 out=base/(p.stem+'-features.npz')
 if out.exists():continue
 start=time.monotonic();sr=22050;hop=110
 y=np.frombuffer(subprocess.check_output([ff,'-v','error','-i',str(p),'-ac','1','-ar',str(sr),'-f','f32le','-']),dtype='<f4').copy()
 S=abs(librosa.stft(y,n_fft=2048,hop_length=hop));freq=librosa.fft_frequencies(sr=sr,n_fft=2048)
 flux=np.maximum(np.diff(S,axis=1,prepend=S[:,:1]),0)
 bands=np.array([flux[(freq>=lo)&(freq<hi)].sum(axis=0) for lo,hi in [(40,250),(250,2000),(2000,10000),(40,10000)]])
 logflux=np.maximum(np.diff(np.log1p(S*10),axis=1,prepend=np.log1p(S[:,:1]*10)),0).sum(axis=0)
 ch=librosa.feature.chroma_stft(S=S**2,sr=sr,n_fft=2048,hop_length=hop)
 onset=librosa.onset.onset_strength(y=y,sr=sr,hop_length=hop)
 tempo,beat=librosa.beat.beat_track(onset_envelope=onset,sr=sr,hop_length=hop,trim=False)
 np.savez_compressed(out,bands=bands,chroma=ch[:,::4],chroma_fps=sr/hop/4,logflux=logflux,rms=np.sqrt(np.mean(S*S,axis=0)),fps=sr/hop,librosa_beats=beat*hop/sr,seconds=len(y)/sr)
 print(p.stem,'independent BPM',float(np.asarray(tempo).ravel()[0]),'seconds',round(time.monotonic()-start,1),flush=True)
