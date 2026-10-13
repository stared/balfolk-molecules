import os
import numpy as np,json
from pathlib import Path
base=Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync'));maps=json.loads(Path(__file__).with_name('audit.json').read_text())
for name in ['starwars','branle','tzadik','jopelloise','yfk','synek','balsam-bourree']:
 if name in maps:tt=np.array(maps[name]['beats'])
 else:
  start,p,n={'jopelloise':(1.7154,60/130,512),'yfk':(1.52976,60/95,480),'synek':(20.61,60/110,320)}[name];tt=start+np.arange(n+1)*p
 f=np.load(base/(name+'-features.npz'));fps=float(f['chroma_fps']);ch=f['chroma'];x=[]
 for a,b in zip(tt[:-1],tt[1:]):
  # two chroma frames per musical count, preserving note sequence
  x.append(np.concatenate([ch[:,int(t*fps):int((t+(b-a)/2)*fps)].mean(axis=1) for t in [a,(a+b)/2]]))
 x=np.array(x);x/=np.linalg.norm(x,axis=1)[:,None]+1e-9
 np.savez_compressed(base/(name+'-structure.npz'),times=tt,chroma=x)
 print(name,'lag similarity',[(lag,round(float(np.mean(np.sum(x[:-lag]*x[lag:],axis=1))),3)) for lag in [8,16,24,32,48,64] if len(x)>lag])
 if name=='tzadik':
  for shift in [0,4,8,12,16,20,24,28,32,36,40,44]:
   cycles=[x[i:i+48] for i in range(shift,len(x)-47,48)];pairs=[np.mean(np.sum(c[16:32]*c[32:48],axis=1))-np.mean(np.sum(c[:16]*c[16:32],axis=1)) for c in cycles]
   print('A/BB shift',shift,round(float(np.mean(pairs)),3))
 print('first sixteen bar chroma distances',[round(float(np.linalg.norm(x[max(0,i-4):i].mean(axis=0)-x[i:i+4].mean(axis=0))),3) for i in range(4,65,4)])
