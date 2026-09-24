"""Measure sound at the app's existing Drumul dance counts, including holds.

The app maps are a reference hypothesis, not newly established ground truth.
Their agreement with the public audio's predictions is checked before reuse.
"""
import json
from pathlib import Path
import numpy as np
from scipy.ndimage import maximum_filter1d
from scipy.spatial import cKDTree
BASE=Path('/tmp/balfolk-deep')
BANDS=['bass','lowmid','mid','high','broad']

def action(k):
    k%=64
    if k<32:
        return 'stamp' if k%8 in [5,6] else 'hold' if k%8==7 else 'transfer'
    return 'stamp' if (k-32)%16 in [12,13,14] else 'hold' if (k-32)%16==15 else 'transfer'

def main():
    maps=json.load(open(BASE/'app-recordings.json'))['drumul-dracului'];out=[]
    for m,id in zip(maps,['930ea8d366e7d765','401714cc08923dd5']):
        b=np.array(m['beats']);beats=b[:-1];offset=m.get('danceOffset',0);counts=np.arange(len(beats))+offset
        n=np.array(json.load(open(BASE/'neural-final0'/f'{id}.json'))['beats']);n=n[(n>=b[0])&(n<=b[-1])]
        errs=cKDTree(b[:,None]).query(n[:,None])[0]
        z=np.load(BASE/'features'/f'{id}.npz');fps=float(z['sr'])/float(z['hop']);origin=float(z['fft'])/(2*float(z['sr']))
        result=dict(id=id,artist=m['artist'],dance_offset=offset,start=b[0],end=b[-1],
                    neural_predictions_near_map_fraction=float(np.mean(errs<.06)),
                    median_nearest_error_seconds=float(np.median(errs)),methods={},counts=counts.tolist(),seconds=beats.tolist(),actions=[action(k) for k in counts])
        for method,key in [('linear','linear'),('log','logged')]:
            peak=maximum_filter1d(z[key],size=2*round(.045*fps)+1,axis=0)
            hits=peak[np.clip(np.round((beats-origin)*fps).astype(int),0,len(peak)-1)]
            # Normalize within each complete 16-count block to limit crescendo bias.
            blocks=hits.reshape(-1,16,5);norm=blocks/(blocks.mean(axis=1,keepdims=True)+1e-12);norm=norm.reshape(-1,5)
            bands={}
            for j,name in enumerate(BANDS):
                profile=[float(np.mean(norm[counts%16==k,j])) for k in range(16)]
                groups={a:float(np.mean(norm[[action(k)==a for k in counts],j])) for a in ['transfer','stamp','hold']}
                # Compare the strongest count in each 16-count musical/dance block.
                maxima=norm[:,j].reshape(-1,16).argmax(axis=1)
                strongest=[action(int(counts[i*16]+k)) for i,k in enumerate(maxima)]
                bands[name]=dict(profile16=profile,by_action=groups,strongest_count_action={a:strongest.count(a) for a in ['transfer','stamp','hold']},per_count=norm[:,j].tolist())
            result['methods'][method]=bands
        out.append(result)
    (BASE/'drumul-phases.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
    for r in out:
        print(r['artist'],r['neural_predictions_near_map_fraction'])
        for band in ['bass','high','broad']:print(band,r['methods']['linear'][band]['by_action'],r['methods']['linear'][band]['strongest_count_action'])

if __name__=='__main__':main()
