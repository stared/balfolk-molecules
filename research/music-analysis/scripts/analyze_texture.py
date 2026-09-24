"""Relate sustained/transient texture proxies to the inferred beat patterns."""
import json
from pathlib import Path
import numpy as np
from scipy.ndimage import maximum_filter1d
from compare_beats import summarize_profiles
BASE=Path('/tmp/balfolk-deep')

def main():
    out=[]
    for t in json.load(open(BASE/'reviewed-manifest.json')):
        path=BASE/'texture'/f"{t['id']}.npz";npath=BASE/'neural-final0'/f"{t['id']}.json"
        if not path.exists() or not npath.exists():continue
        z=np.load(path);n=json.load(open(npath));b=np.array(n['beats']);d=np.array(n['downbeats'])
        fps=float(z['sr'])/float(z['hop']);origin=float(z['fft'])/(2*float(z['sr']))
        bars={k:[] for k in [2,3,4,6]}
        for a,e in zip(d[:-1],d[1:]):
            bb=b[(b>=a-.04)&(b<e-.04)];k=len(bb)
            if k not in bars or k<2:continue
            ibis=np.diff(np.r_[bb,e]);med=float(np.median(ibis))
            if med<.2 or med>1.4 or np.max(np.abs(ibis/med-1))>.24 or abs(bb[0]-a)>.06:continue
            bars[k].append((a,e,bb))
        meters={}
        for key in ['percussive_flux','harmonic_flux','percussive_logflux','harmonic_logflux']:
            peak=maximum_filter1d(z[key],size=5,axis=0)
            for k,rs in bars.items():
                if len(rs)<6:continue
                for band,name in [(0,'bass'),(3,'high'),(4,'broad')]:
                    rows=[dict(start=a,values=peak[np.clip(np.round((bb-origin)*fps).astype(int),0,len(peak)-1),band].tolist()) for a,e,bb in rs]
                    meters.setdefault(str(k),{})[key+'_'+name]=summarize_profiles(rows)
        windows=[]
        for sec in range(0,int(t['seconds'])-7,16):
            sl=slice(round(sec*fps),round((sec+16)*fps));den=z['total_energy'][sl,4].sum()+1e-12
            windows.append(dict(start=sec,percussive_energy_fraction=float(z['percussive_energy'][sl,4].sum()/den),
                                strict_percussive_fraction=float(z['strict_percussive_energy'][sl,4].sum()/den),
                                strict_harmonic_fraction=float(z['strict_harmonic_energy'][sl,4].sum()/den)))
        out.append(dict(id=t['id'],name=t['name'],inferred_meters=meters,windows=windows))
    (BASE/'texture-analysis.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
    print('done',len(out))

if __name__=='__main__':main()
