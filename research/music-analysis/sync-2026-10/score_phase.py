import os
# Test the notated opening motif against every candidate dance-count origin
# and all twelve transpositions; do not assume the upload's key.
import numpy as np,json
from pathlib import Path
p=Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync'));name=os.environ.get('TRACK', 'tzadik-dance');m=json.loads((Path(__file__).with_name('audit.json')).read_text());f=np.load(p/(name+'-features.npz'));fps=float(f['chroma_fps']);ch=f['chroma'];tt=np.array(m[name]['beats']);n=len(tt)-1
quarter=np.array([ch[:,int((a+k*(b-a)/2)*fps):int((a+(k+1)*(b-a)/2)*fps)].mean(axis=1) for a,b in zip(tt[:-1],tt[1:]) for k in [0,1]])
quarter=quarter/(np.linalg.norm(quarter,axis=1)[:,None]+1e-9)
# First four score bars, played twice: D D/E F D; C# C#/D E C#; D D/E F D; A held, then rest.
seq=[[2],[2,4],[5],[2],[1],[1,2],[4],[1],[2],[2,4],[5],[2],[9],[9],[],[]]*2
T=np.zeros((32,12))
for i,notes in enumerate(seq):
 for note in notes:T[i,note]=1/len(notes)
results=[]
for phase in range(48):
 for transpose in range(12):
  template=np.roll(T,transpose,axis=1);scores=[]
  for start in range(phase,n-16,48):scores.append(float(np.sum(quarter[start*2:start*2+32]*template)/np.sum(T)))
  results.append((np.mean(scores),phase,transpose,scores))
for s,phase,tr,parts in sorted(results,reverse=True)[:15]:print(round(s,3),'phase',phase,'time',tt[phase],'transpose',tr,'cycles',np.round(parts,3).tolist())

(Path(__file__).with_name(name+'-score-phase.json')).write_text(json.dumps([{'score':float(s),'countPhase':phase,'seconds':float(tt[phase]),'transpose':tr,'cycleScores':parts} for s,phase,tr,parts in sorted(results,reverse=True)[:15]],indent=2)+'\n')
