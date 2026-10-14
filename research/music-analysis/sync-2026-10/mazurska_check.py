import os
import numpy as np,json
from pathlib import Path
p=Path(os.environ.get('BALFOLK_SYNC_WORK','/tmp/balfolk-sync'));a=json.loads((p/'mazurska-final0.json').read_text());s=json.loads((p/'mazurska-small0.json').read_text());b=np.array(a['beats']);sm=np.array(s['beats']);x=np.r_[b,sm];x=x[(x>30)&(x<250)];periods=60/np.linspace(110,118,3201);scores=np.array([abs(np.mean(np.exp(2j*np.pi*x/q))) for q in periods]);i=np.argmax(scores);period=periods[i];phase=np.angle(np.mean(np.exp(2j*np.pi*x/period)))*period/(2*np.pi)%period;print('fit bpm',60/period,'phase',phase,'coherence',scores[i]);
# Quantize the tempo only after comparing held-out sections with the fitted rate.
period=60/114;phase=np.angle(np.mean(np.exp(2j*np.pi*x/period)))*period/(2*np.pi)%period;print('114 phase',phase)
for start in range(15,280,30):
 t=phase+np.arange(int(start/period),int((start+30)/period))*period;e=np.minimum(np.min(abs(t[:,None]-b),axis=1),np.min(abs(t[:,None]-sm),axis=1));print(start,'within60',round(float(np.mean(e<.06)),3),'p95',round(float(np.percentile(e,95))*1000,1),'max',round(float(max(e))*1000,1))
for model in [a,s]:
 db=np.array(model['downbeats']);ix=np.round((db-phase)/period).astype(int);ok=abs(db-phase-ix*period)<.06;print('DB phases3',np.bincount(ix[ok]%3,minlength=3).tolist(),'6',np.bincount(ix[ok]%6,minlength=6).tolist())
f=np.load(p/'mazurska-features.npz');fps=float(f['fps']);tt=phase+np.arange(10,120)*period;print('firstseconds,energy',[(round(float(t),2),round(float(f['rms'][int(t*fps):int((t+period)*fps)].mean()),2)) for t in tt[::3]])

selected=24.294303+np.arange(469)*60/114
err=np.minimum(np.min(abs(selected[:,None]-b),axis=1),np.min(abs(selected[:,None]-sm),axis=1))
report={'bpm':114,'start':float(selected[0]),'end':float(selected[-1]),'counts':468,'cycles':39,'within60ms':float(np.mean(err<.06)),'p95ms':float(np.percentile(err,95)*1000),'modelDisagreements':[]}
for t,e in zip(selected,err):
 if e<=.06:continue
 ix=round(t*fps);r=round(.10*fps);flux=f['logflux'][ix-r:ix+r+1]
 report['modelDisagreements'].append({'seconds':float(t),'nearestModelMs':float(e*1000),'strongestFluxOffsetMs':float((np.argmax(flux)-r)/fps*1000)})
Path(__file__).with_name('mazurska-validation.json').write_text(json.dumps(report,indent=2)+'\n')
