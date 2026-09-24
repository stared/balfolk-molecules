"""Within-pulse attack distributions. These are not dancer microtiming estimates."""
import json
from pathlib import Path
import numpy as np
from scipy.signal import find_peaks
BASE=Path('/tmp/balfolk-deep')

def main():
    out=[];phase=np.linspace(0,1,101)
    for t in json.load(open(BASE/'reviewed-manifest.json')):
        if not set(t['labels'])&{'schottische','mazurka','drumul','hanter-dro'}:continue
        p=BASE/'neural-final0'/f"{t['id']}.json"
        if not p.exists():continue
        n=json.load(open(p));b=np.array(n['beats']);z=np.load(BASE/'features'/f"{t['id']}.npz")
        fps=float(z['sr'])/float(z['hop']);origin=float(z['fft'])/(2*float(z['sr']));time=origin+np.arange(len(z['linear']))/fps
        ibis=np.diff(b);med=np.median(ibis[(ibis>.25)&(ibis<1.2)]) if np.any((ibis>.25)&(ibis<1.2)) else 0
        use=(ibis>med*.85)&(ibis<med*1.15)&(ibis>.25)&(ibis<1.2)
        if sum(use)<12:continue
        band_results={}
        for band,name in [(0,'bass'),(3,'high'),(4,'broad')]:
            a=np.array([np.interp(start+phase*duration,time,z['linear'][:,band]) for start,duration in zip(b[:-1][use],ibis[use])])
            a=a/(a.mean(axis=1,keepdims=True)+1e-12);fold=a.mean(axis=0)
            middle=fold[25:76];peaks,props=find_peaks(middle,prominence=.08)
            order=np.argsort(props['prominences'])[::-1]
            band_results[name]=dict(fold=fold.tolist(),offbeat_peaks=[dict(phase=float(phase[25+peaks[i]]),prominence=float(props['prominences'][i])) for i in order[:3]],
                half_window=float(fold[44:57].mean()),two_thirds_window=float(fold[61:74].mean()))
        out.append(dict(id=t['id'],name=t['name'],labels=t['labels'],pulse_bpm=60/med if med else None,intervals=int(sum(use)),bands=band_results))
    (BASE/'subdivisions.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
    for r in out:
        if 'schottische' in r['labels']:print(r['name'],round(r['pulse_bpm']),r['bands']['high']['offbeat_peaks'])

if __name__=='__main__':main()
