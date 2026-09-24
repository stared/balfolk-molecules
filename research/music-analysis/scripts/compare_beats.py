"""Compare model predictions and measure accents conditional on inferred bars.

No musical bar labels are asserted as ground truth. Measurements distinguish
linear and log spectral flux, frequency bands, and three matching tolerances.
"""
import json
from pathlib import Path
import numpy as np
from scipy.ndimage import maximum_filter1d

BASE=Path('/tmp/balfolk-deep')
BANDS=['bass','lowmid','mid','high','broad']

def agreement(a,b,tolerance=.07):
    i=j=matched=0;deltas=[]
    while i<len(a) and j<len(b):
        d=a[i]-b[j]
        if abs(d)<=tolerance:
            matched+=1;deltas.append(d);i+=1;j+=1
        elif d<0:i+=1
        else:j+=1
    return dict(f1=2*matched/(len(a)+len(b)) if len(a)+len(b) else 0,
                matches=matched,median_abs_delta=float(np.median(np.abs(deltas))) if deltas else None)

def summarize_profiles(rows):
    x=np.array([r['values'] for r in rows]);times=np.array([r['start'] for r in rows])
    if len(x)<6:return None
    normalized=x/(x.mean(axis=1,keepdims=True)+1e-12)
    profile=normalized.mean(axis=0)
    # Choose an accent in the first chronological half; test it in the second.
    train=normalized[:len(x)//2].mean(axis=0);test=normalized[len(x)//2:].mean(axis=0)
    hi=int(np.argmax(train));lo=int(np.argmin(train))
    blocks=[]
    for i in range(0,len(x)-3,8):
        p=normalized[i:i+8].mean(axis=0)
        blocks.append(dict(start=float(times[i]),profile=p.tolist(),dominant=int(np.argmax(p))+1,
                           contrast=float(max(p)/(min(p)+1e-12))))
    return dict(bars=len(x),profile=profile.tolist(),pooled_profile=(x.mean(axis=0)/(x.mean()+1e-12)).tolist(),
                contrast=float(max(profile)/(min(profile)+1e-12)),
                train_strong_phase=hi+1,heldout_effect=float(test[hi]-test[lo]),
                dominant_phase=int(np.argmax(profile))+1,
                dominant_phase_bar_fraction=float(np.mean(np.argmax(normalized,axis=1)==np.argmax(profile))),
                blocks=blocks)

def analyze(t,model='final0'):
    path=BASE/f'neural-{model}'/f"{t['id']}.json"
    if not path.exists():return None
    n=json.load(open(path));b=np.array(n['beats']);d=np.array(n['downbeats'])
    z=np.load(BASE/'features'/f"{t['id']}.npz");fps=float(z['sr'])/float(z['hop']);origin=float(z['fft'])/(2*float(z['sr']))
    r=dict(id=t['id'],name=t['name'],labels=t['labels'],label_status=t['label_status'],collection=t['collection'],
           seconds=t['seconds'],raw_neural_bpm=n['median_bpm'],bar_count_histogram=n['bar_count_histogram'],
           tempo_windows=n['tempo_windows'],inferred_meters={},subdivisions={})
    p2=BASE/f"neural-{'small0' if model=='final0' else 'final0'}"/f"{t['id']}.json"
    if p2.exists():
        nn=json.load(open(p2));r['model_agreement']={str(ms):agreement(b,nn['beats'],ms/1000) for ms in [40,70,100]}
        r['downbeat_agreement']=agreement(d,nn['downbeats'])
        r['small_model_bpm']=nn['median_bpm']
    # Retain only regular intervals whose count and duration agree locally.
    bars={k:[] for k in [2,3,4,6]}
    for a,e in zip(d[:-1],d[1:]):
        bb=b[(b>=a-.04)&(b<e-.04)];k=len(bb)
        if k not in bars or len(bb)<2:continue
        ibis=np.diff(np.r_[bb,e]);med=float(np.median(ibis))
        if med<.2 or med>1.4 or np.max(np.abs(ibis/med-1))>.24:continue
        if abs(bb[0]-a)>.06:continue
        bars[k].append((a,e,bb))
    r['regular_bar_count']=sum(len(v) for v in bars.values())
    r['regular_bar_duration_fraction']=sum(e-a for rs in bars.values() for a,e,_ in rs)/t['seconds']
    for method,key in [('linear','linear'),('log','logged')]:
        env=z[key]
        for tolerance in [.025,.045,.075]:
            peak=maximum_filter1d(env,size=2*round(tolerance*fps)+1,axis=0,mode='nearest')
            def sample(times):return peak[np.clip(np.round((np.array(times)-origin)*fps).astype(int),0,len(peak)-1)]
            for k,rs in bars.items():
                if len(rs)<6:continue
                dest=r['inferred_meters'].setdefault(str(k),{})
                for band,name in enumerate(BANDS):
                    values=[dict(start=float(a),values=sample(bb)[:,band].tolist()) for a,e,bb in rs]
                    dest[f'{name}_{method}_{round(tolerance*1000)}ms']=summarize_profiles(values)
            if tolerance==.045 and len(b)>10:
                ibis=np.diff(b);valid=(ibis>.25)&(ibis<1.)
                start=b[:-1][valid];interval=ibis[valid]
                hits=sample(start)
                for band,name in enumerate(BANDS):
                    mean=float(hits[:,band].mean())+1e-12
                    r['subdivisions'][f'{name}_{method}']={str(f):float(sample(start+interval*f)[:,band].mean()/mean) for f in [1/3,.5,2/3]}
    return r

def main():
    out=BASE/'beat-comparison';out.mkdir(exist_ok=True)
    ts=json.load(open(BASE/'reviewed-manifest.json'))
    for i,t in enumerate(ts):
        r=analyze(t)
        if r:(out/f"{t['id']}.json").write_text(json.dumps(r,ensure_ascii=False,separators=(',',':')))
        if i%25==0:print(i,len(ts),flush=True)
    print('done',flush=True)

if __name__=='__main__':main()
