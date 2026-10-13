import os
os.environ['OMP_NUM_THREADS']='3'
import torch,numpy as np,json,subprocess,time
from pathlib import Path
from beat_this.inference import Audio2Frames
from beat_this.model.postprocessor import Postprocessor
base=Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync'));ff=os.environ.get('FFMPEG_BINARY', 'ffmpeg')
torch.set_num_threads(3)
for modelname in ['final0','small0']:
 model=Audio2Frames(str(base/(modelname+'.ckpt')),device='cpu');post=Postprocessor(type='minimal')
 for p in sorted((base/'audio').glob('*')):
  if p.suffix not in ['.webm','.m4a','.mp3']:continue
  out=base/(p.stem+'-'+modelname+'.json')
  if out.exists():continue
  start=time.monotonic();y=np.frombuffer(subprocess.check_output([ff,'-v','error','-i',str(p),'-ac','1','-ar','22050','-f','f32le','-']),dtype='<f4').copy()
  bl,dl=model(y,22050);b,d=post(bl,dl)
  out.write_text(json.dumps({'beats':np.asarray(b).tolist(),'downbeats':np.asarray(d).tolist(),'seconds':len(y)/22050}))
  np.savez_compressed(base/(p.stem+'-'+modelname+'.npz'),beat=torch.sigmoid(bl).numpy(),downbeat=torch.sigmoid(dl).numpy())
  print(p.stem,modelname,len(b),len(d),round(time.monotonic()-start,1),flush=True)
