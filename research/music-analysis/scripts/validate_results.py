"""Integrity checks for the research outputs, not musical ground-truth tests."""
import ast,csv,json,re,subprocess
from pathlib import Path
import numpy as np
BASE=Path('/tmp/balfolk-deep');OUT=Path(__file__).resolve().parents[1]

def main():
    ts=json.load(open(BASE/'reviewed-manifest.json'));ids={t['id'] for t in ts}
    assert len(ids)==len(ts)
    checked=[];durations={};max_duration_error=0.;max_model_overrun=0.
    for t in ts:
        z=np.load(BASE/'features'/f"{t['id']}.npz")
        expected=1+int(round(float(z['duration'])*float(z['sr']))-int(z['fft']))//int(z['hop'])
        n=len(z['linear']);assert n==expected,(t['id'],n,expected)
        for name in ['linear','logged','energy','rms','chroma','centroid']:
            a=z[name];assert len(a)==n and np.all(np.isfinite(a)),(t['id'],name)
            assert np.all(a>=0),(t['id'],name,'negative')
        max_duration_error=max(max_duration_error,abs(t['seconds']-float(z['duration'])))
        durations[t['id']]=float(z['duration'])
        for model in ['final0','small0']:
            r=json.load(open(BASE/f'neural-{model}'/f"{t['id']}.json"))
            assert abs(r['duration']-durations[t['id']])<.01
            for kind in ['beats','downbeats']:
                a=np.array(r[kind]);assert np.all(np.isfinite(a)) and np.all(np.diff(a)>0)
                if len(a):
                    assert a[0]>=0 and a[-1]<r['duration']+.06
                    max_model_overrun=max(max_model_overrun,a[-1]-r['duration'])
        c=json.load(open(BASE/'beat-comparison'/f"{t['id']}.json"))
        assert 0<=c['regular_bar_duration_fraction']<=1.01
        for m in c['inferred_meters'].values():
            for metric in m.values():
                assert np.all(np.isfinite(metric['profile']))
                assert abs(np.mean(metric['profile'])-1)<.01
        checked.append(t['id'])
    rows=list(csv.DictReader(open(OUT/'tracks.csv')));assert {r['id'] for r in rows}==ids
    assert all(abs(float(r['seconds'])-durations[r['id']])<.001 for r in rows)
    decoder=json.load(open(OUT/'data/decode-audit.json'));assert decoder['files_checked']==len(ts)
    damaged=[r['id'] for r in decoder['files_with_errors'] if 'packet' in r['decoder_messages']]
    assert all('Decoder' in r['label_note'] for r in rows if r['id'] in damaged)
    for p in (OUT/'scripts').glob('*.py'):ast.parse(p.read_text())
    subprocess.run(['node','--check',str(OUT/'review.js')],check=True)
    for p in (OUT/'data').glob('*.json'):json.load(open(p))
    state=subprocess.check_output(['git','status','--porcelain','--untracked-files=all'],text=True)
    changed=[line[3:] for line in state.splitlines()]
    assert all(p.startswith('research/music-analysis/') for p in changed),changed
    browser=json.load(open(BASE/'viewer-validation.json'))
    assert not browser['errors'] and not browser['external_requests'] and browser['mobile_overflow'] is False
    result=dict(audio_items=len(ts),feature_arrays_checked=len(ts)*6,models_checked=len(ts)*2,
                csv_rows=len(rows),finite_nonnegative_features=True,expected_frame_counts=True,
                monotonic_predictions=True,maximum_metadata_vs_decoded_duration_difference_seconds=max_duration_error,
                exported_durations_match_decoded_audio=True,damaged_audio_sources_flagged=damaged,
                maximum_prediction_overrun_seconds=max_model_overrun,normalized_profiles=True,
                python_scripts_parse=True,viewer_javascript_parse=True,app_files_unchanged=True,
                viewer=browser,scope='Integrity and consistency only; not a test against human beat annotations.')
    target=OUT/'data/validation.json';target.write_text(json.dumps(result,indent=2))
    missing=[]
    for p in OUT.glob('*.md'):
        for dest in re.findall(r'\]\(([^)]+)\)',p.read_text()):
            if dest.startswith(('https://','http://','#')):continue
            if not (p.parent/dest.split('#')[0]).exists():missing.append((p.name,dest))
    assert not missing,missing
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
