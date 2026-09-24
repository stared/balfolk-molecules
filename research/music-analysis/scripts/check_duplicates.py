"""Find likely duplicate recordings across codecs/tags, without deleting files."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import json
from pathlib import Path
import numpy as np
from scipy import signal,ndimage
BASE=Path('/tmp/balfolk-deep')

def main():
    tracks=json.load(open(BASE/'manifest.json'))+[t for t in json.load(open(BASE/'public-manifest.json')) if t['collection']=='public-full']
    vec=[];features=[]
    for t in tracks:
        z=np.load(BASE/'features'/f"{t['id']}.npz")
        # Time-varying chroma and spectral envelopes survive lossy transcoding.
        ch=z['chroma'].astype(float);env=np.log(z['energy'].astype(float)+1e-9)
        a=np.column_stack([ch,env]);a=ndimage.uniform_filter1d(a,size=43,axis=0)[::43]
        a=(a-a.mean(axis=0))/(a.std(axis=0)+1e-7)
        features.append(a)
        x=signal.resample(a,256,axis=0).reshape(-1);x=x/(np.linalg.norm(x)+1e-10);vec.append(x)
    sim=np.array(vec)@np.array(vec).T;out=[]
    for i,a in enumerate(tracks):
        for j in range(i+1,len(tracks)):
            b=tracks[j]
            if abs(a['seconds']-b['seconds'])>max(5,a['seconds']*.035):continue
            if sim[i,j]<.65:continue
            x=features[i];y=features[j]
            best=(-1,None)
            for shift in range(-8,9):
                xx=x[max(shift,0):];yy=y[max(-shift,0):];n=min(len(xx),len(yy));xx=xx[:n];yy=yy[:n]
                corr=float(np.sum(xx*yy)/np.sqrt(np.sum(xx*xx)*np.sum(yy*yy)))
                if corr>best[0]:best=(corr,shift*43*256/22050)
            out.append(dict(a=a['id'],b=b['id'],name_a=a['name'],name_b=b['name'],duration_a=a['seconds'],duration_b=b['seconds'],resampled_similarity=float(sim[i,j]),aligned_similarity=best[0],offset=best[1]))
    out.sort(key=lambda x:x['aligned_similarity'],reverse=True)
    (BASE/'near-duplicates.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
    print(json.dumps(out,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
