"""Re-run the schottische accent conclusion using the other model's grid."""
import json
from pathlib import Path
import numpy as np
from compare_beats import analyze
BASE=Path('/tmp/balfolk-deep')

def metrics(r):
    meters=r['inferred_meters'];k=max(meters,key=lambda k:meters[k]['bass_linear_45ms']['bars'],default=None)
    if k is None or int(k)%2:return None
    m=meters[k];out={}
    for method in ['linear','log']:
        for tolerance in [25,45,75]:
            vals=[]
            for band in ['bass','high']:
                p=np.array(m[f'{band}_{method}_{tolerance}ms']['profile']);vals.append(float(p[::2].mean()-p[1::2].mean()))
            out[f'{method}_{tolerance}ms']=dict(bass_parity=vals[0],high_parity=vals[1],opposed=vals[0]*vals[1]<0 and min(abs(v) for v in vals)>.2)
    return dict(group=k,conditions=out)

def main():
    rows=[]
    for t in json.load(open(BASE/'reviewed-manifest.json')):
        if t['collection']!='balfolk' or t['labels']!=['schottische'] or t['label_status']!='tagged':continue
        main=json.load(open(BASE/'beat-comparison'/f"{t['id']}.json"));other=analyze(t,'small0')
        a=metrics(main);b=metrics(other);rows.append(dict(id=t['id'],name=t['name'],final0=a,small0=b));print(t['name'],a['conditions']['linear_45ms']['opposed'],b['conditions']['linear_45ms']['opposed'] if b else None,flush=True)
    (BASE/'model-sensitivity.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
