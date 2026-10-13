import os
import numpy as np,json
from pathlib import Path
base=Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync'))
results={}
for name,bpm,start,n in [('yfk',95,41.95081,400),('jopelloise',130,1.715415,512),('synek',110,20.61,288),('burning',132,.298,448),('zabili',95,6.98,540)]:
 t=start+np.arange(n+1)*60/bpm;f=np.load(base/(name+'-features.npz'));fps=float(f['fps']);b=np.array(json.loads((base/(name+'-final0.json')).read_text())['beats']);s=np.array(json.loads((base/(name+'-small0.json')).read_text())['beats']);print(name,'end',t[-1])
 results[name]=[]
 # Compare each main beat against both neural models and peak spectral flux within 60 ms.
 for lo in np.arange(start,t[-1],45):
  tt=t[(t>=lo)&(t<lo+45)];err=np.minimum(np.min(abs(tt[:,None]-b),axis=1),np.min(abs(tt[:,None]-s),axis=1));near=[]
  for a in tt:
   ix=round(a*fps);r=round(.065*fps);q=f['logflux'][max(0,ix-r):ix+r+1];near.append((np.argmax(q)-r)/fps)
  results[name].append({'from':float(lo),'beats':len(tt),'modelWithin60ms':float(np.mean(err<.06)),'modelP90Ms':float(np.percentile(err,90)*1000),'fluxMedianAbsMs':float(np.median(abs(np.array(near)))*1000)})
  print(round(lo,1), 'model within60',round(np.mean(err<.06),3),'model p90 ms',round(np.percentile(err,90)*1000,1),'flux median abs ms',round(np.median(abs(np.array(near)))*1000,1))

(Path(__file__).with_name('grid-windows.json')).write_text(json.dumps(results,indent=2)+'\n')
