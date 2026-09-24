"""Publish measurements and provenance, without audio or private-library paths."""
import csv,json,collections,base64
from pathlib import Path
import numpy as np
BASE=Path('/tmp/balfolk-deep');OUT=Path(__file__).resolve().parents[1];DATA=OUT/'data'

def compact(x):
    if isinstance(x,float):return round(x,5) if np.isfinite(x) else None
    if isinstance(x,list):return [compact(v) for v in x]
    if isinstance(x,dict):return {k:compact(v) for k,v in x.items()}
    return x

def main():
    DATA.mkdir(exist_ok=True)
    ts=json.load(open(BASE/'reviewed-manifest.json'));rows=[];details=[];review=[]
    decode_audit=json.load(open(BASE/'decode-audit.json'))
    decode_errors={r['id']:r['decoder_messages'] for r in decode_audit['files_with_errors']}
    for i,t in enumerate(ts):
        n=json.load(open(BASE/'neural-final0'/f"{t['id']}.json"));sm=json.load(open(BASE/'neural-small0'/f"{t['id']}.json"))
        c=json.load(open(BASE/'beat-comparison'/f"{t['id']}.json"));a=json.load(open(BASE/'analysis'/f"{t['id']}.json"))['summary']
        name=t['name'] if t['collection']!='media-unknown' else f'Unidentified media-library control {i+1}'
        meters=c['inferred_meters'];best=max(meters,key=lambda k:meters[k]['bass_linear_45ms']['bars'],default=None)
        duration_note=''
        if t['id']=='eedea48c2578a76d':
            duration_note=' Decoder reports an invalid MP3 packet; only 50.08 seconds decode, versus 89.94 seconds in estimated metadata. Treat as a damaged/partial local source.'
        elif t['id']=='1d43e69cd64fc2ff':
            duration_note=' Bitrate-based metadata estimates 203.75 seconds; complete decoding yields 189.60 seconds without packet errors.'
        elif 'packet' in decode_errors.get(t['id'],''):
            duration_note=' Decoder reports invalid MP3 packets; analysis covers recovered audio only.'
        row=dict(id=t['id'],name=name,collection=t['collection'],seconds=round(n['duration'],3),metadata_seconds=round(t['seconds'],3),
                 labels=';'.join(t['labels']),label_status=t['label_status'],likely_duplicate_of=t.get('likely_duplicate_of',''),
                 source=t.get('source',t.get('label_source','local library')),database_tid=t.get('database_tid',''),database_bpm=t.get('database_bpm',''),
                 raw_final_model_bpm=round(n['median_bpm'],1) if n['median_bpm'] else '',raw_small_model_bpm=round(sm['median_bpm'],1) if sm['median_bpm'] else '',
                 beat_model_f1_70ms=round(c['model_agreement']['70']['f1'],3),downbeat_model_f1_70ms=round(c['downbeat_agreement']['f1'],3),
                 regular_bar_coverage=round(c['regular_bar_duration_fraction'],3),most_supported_inferred_group=best or '',
                 dsp_prior_ambiguity_fraction=round(a.get('prior_ambiguity_fraction',0),3),
                 label_note=t.get('label_note','Metadata label; not a verified dance-count annotation.')+duration_note)
        for band in ['bass','high','broad']:
            for method in ['linear','log']:
                m=meters[best][f'{band}_{method}_45ms'] if best else None
                row[f'{band}_{method}_profile']=';'.join(f'{x:.3f}' for x in m['profile']) if m else ''
                row[f'{band}_{method}_contrast']=round(m['contrast'],3) if m else ''
                row[f'{band}_{method}_heldout_effect']=round(m['heldout_effect'],3) if m else ''
        rows.append(row)
        saved_meters={k:{key:{field:value for field,value in v.items() if field!='blocks'} for key,v in m.items() if key.endswith('_45ms') and not key.startswith(('mid_','lowmid_'))} for k,m in meters.items()}
        detail=dict(**row,bar_count_histogram=c['bar_count_histogram'],tempo_windows=c['tempo_windows'],meters=saved_meters)
        details.append(detail)
        if t['labels'] and not t.get('likely_duplicate_of'):
            z=np.load(BASE/'features'/f"{t['id']}.npz");fps=float(z['sr'])/float(z['hop']);origin=float(z['fft'])/(2*float(z['sr']))
            # 20-Hz maximum envelopes are for inspection, not timing measurement.
            bins=np.floor((origin+np.arange(len(z['linear']))/fps)*20).astype(int);length=bins[-1]+1
            bands=[]
            for band in [0,3,4]:
                env=np.zeros(length);np.maximum.at(env,bins,z['linear'][:,band]);scale=np.percentile(env,95)+1e-12
                bands.append(base64.b64encode(np.round(np.minimum(env/scale,3)*85).astype(np.uint8).tobytes()).decode())
            simple={}
            for k,m in meters.items():
                simple[k]={key:{field:v[field] for field in ['bars','profile','contrast','heldout_effect','blocks']} for key,v in m.items() if key in ['bass_linear_45ms','high_linear_45ms','broad_linear_45ms']}
            review.append(dict(id=t['id'],name=name,labels=t['labels'],status=t['label_status'],seconds=n['duration'],collection=t['collection'],source=row['source'],
                agreement=row['beat_model_f1_70ms'],downbeatAgreement=row['downbeat_model_f1_70ms'],coverage=row['regular_bar_coverage'],note=row['label_note'],
                beats=n['beats'],downbeats=n['downbeats'],smallBeats=sm['beats'],smallDownbeats=sm['downbeats'],tempo=n['tempo_windows'],meters=simple,bands=bands,fps=20))
    with open(OUT/'tracks.csv','w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
    (DATA/'track-metrics.json').write_text(json.dumps(compact(details),ensure_ascii=False,separators=(',',':')))
    (DATA/'review-data.js').write_text('window.REVIEW_DATA='+json.dumps(compact(review),ensure_ascii=False,separators=(',',':'))+';\n')
    coverage=dict(recordings=len(ts),hours=sum(r['seconds'] for r in rows)/3600,duration_basis='Decoded audio; metadata estimates retained separately in CSV.',collections=dict(collections.Counter(t['collection'] for t in ts)),
        labelled=sum(bool(t['labels']) for t in ts),likely_transcoded_duplicates=sum('likely_duplicate_of' in t for t in ts),
        full_feature_analyses=len(list((BASE/'features').glob('*.npz'))),final_model=len(list((BASE/'neural-final0').glob('*.json'))),
        small_model=len(list((BASE/'neural-small0').glob('*.json'))),texture_analyses=len(list((BASE/'texture').glob('*.npz'))),
        labels={label:dict(collections.Counter(t['collection'] for t in ts if label in t['labels'])) for label in sorted({l for t in ts for l in t['labels']})})
    (DATA/'coverage.json').write_text(json.dumps(compact(coverage),indent=2))
    for name in ['library-audit','near-duplicates','animation-audit','drumul-phases','texture-analysis','subdivisions','synthetic-controls','model-sensitivity','decode-audit']:
        raw=json.load(open(BASE/f'{name}.json'))
        if name=='texture-analysis':
            for track in raw:
                for meter in track['inferred_meters'].values():
                    for metric in meter.values():metric.pop('blocks',None)
        (DATA/f'{name}.json').write_text(json.dumps(compact(raw),ensure_ascii=False,separators=(',',':')))
    public=[{k:t[k] for k in ['id','name','seconds','source','collection','labels','label_status','database_tid','database_dances','album','label_note'] if k in t} for t in ts if t['collection'].startswith('public')]
    (DATA/'public-sources.json').write_text(json.dumps(compact(public),ensure_ascii=False,indent=2))
    print(json.dumps(coverage,indent=2));print('review tracks',len(review))

if __name__=='__main__':main()
