"""Full-duration moving-window rhythm analysis with competing pulse hypotheses.

An inferred pulse is not a verified musical beat, downbeat, or foot contact.
Results intentionally retain alternative rates and method disagreement.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
os.environ.setdefault('OMP_NUM_THREADS','1')
os.environ['NUMBA_CACHE_DIR']='/tmp/balfolk-numba-cache'
import concurrent.futures
import json
import math
from pathlib import Path
import numpy as np
from scipy import signal, ndimage, stats
import librosa

BASE=Path('/tmp/balfolk-deep'); SR=22050; HOP=256; FPS=SR/HOP

def tempo_candidates(onset):
    x=onset-np.mean(onset)
    ac=signal.fftconvolve(x,x[::-1],mode='full')[len(x)-1:]
    if ac[0]<1e-12:return []
    ac=ac/(np.arange(len(x),0,-1));ac=ac/ac[0]
    lo=int(FPS*60/220);hi=min(len(x)-2,int(FPS*60/45))
    peaks,_=signal.find_peaks(ac[lo:hi+1],distance=2)
    peaks=peaks+lo
    if not len(peaks):return []
    order=sorted(peaks,key=lambda k:ac[k],reverse=True)[:8]
    return [dict(bpm=float(60*FPS/k),acf=float(ac[k])) for k in order if ac[k]>.025]

def choose(candidates,prior=110):
    peak=max(c['acf'] for c in candidates)
    return max(candidates,key=lambda c:c['acf']/peak-.20*math.log2(c['bpm']/prior)**2)

def at(env,frames,radius):
    peak=ndimage.maximum_filter1d(env,size=2*radius+1,axis=0,mode='nearest')
    return peak[np.clip(np.round(frames).astype(int),0,len(env)-1)]

def phase_metrics(a,period):
    cycles=len(a)//period
    if cycles<4:return None
    x=a[:cycles*period].reshape(cycles,period)
    m=x.mean(axis=0);mean=float(m.mean())+1e-12
    split=cycles//2;train=x[:split].mean(axis=0);test=x[split:].mean(axis=0)
    hi=int(np.argmax(train));lo=int(np.argmin(train))
    test_effect=float((test[hi]-test[lo])/(test.mean()+1e-12))
    return dict(profile=(m/mean).tolist(),contrast=float(max(m)/(min(m)+1e-12)),heldout_effect=test_effect,cycles=cycles)

def grid_metrics(lin,log,beat_frames):
    beat_frames=np.asarray(beat_frames)
    if len(beat_frames)<12:return None
    interval=float(np.median(np.diff(beat_frames))); radius=max(1,min(4,round(interval*.10)))
    result={}
    for key,env in [('linear',lin),('log',log)]:
        hits=at(env,beat_frames,radius)
        halves=at(env,(beat_frames[:-1]+beat_frames[1:])/2,radius)
        thirds=at(env,beat_frames[:-1]+np.diff(beat_frames)/3,radius)
        twothirds=at(env,beat_frames[:-1]+np.diff(beat_frames)*2/3,radius)
        perband=[]
        for b in range(env.shape[1]):
            a=hits[:,b];mean=float(np.mean(a))+1e-12
            p2=phase_metrics(a,2);p3=phase_metrics(a,3);p4=phase_metrics(a,4)
            perband.append(dict(p2=p2,p3=p3,p4=p4,half=float(np.mean(halves[:,b])/mean),third=float(np.mean(thirds[:,b])/mean),two_thirds=float(np.mean(twothirds[:,b])/mean)))
        result[key]=perband
    return result

def analyze(t):
    dst=BASE/'analysis'/f"{t['id']}.json"
    if dst.exists():return dict(id=t['id'],status='cached')
    try:
        z=np.load(BASE/'features'/f"{t['id']}.npz")
        lin=z['linear'];log=z['logged'];rms=z['rms'];chroma=z['chroma'];dur=float(z['duration'])
        # Actual feature times are window centres, not librosa's default offset.
        origin=float(z['fft'])/(2*float(z['sr']))
        length=len(lin);window=round(16*FPS);stride=round(8*FPS)
        starts=list(range(0,max(1,length-window+1),stride))
        if length>window and starts[-1]!=length-window:starts.append(length-window)
        windows=[]
        for first in starts:
            last=min(first+window,length);r=rms[first:last]
            if len(r)<4*FPS:continue
            active=float(np.mean(r>max(1e-7,np.percentile(rms,75)*.025)))
            on=log[first:last,4].astype(float)
            # Local baseline removal limits slow loudness changes in the autocorrelation.
            on=np.maximum(0,on-ndimage.median_filter(on,size=43,mode='nearest'))
            cs=tempo_candidates(on)
            if active<.25 or not cs:
                windows.append(dict(start=first/FPS+origin,end=last/FPS+origin,active=active,status='weak'));continue
            priors=[80,110,160]
            chosen=[choose(cs,p) for p in priors]
            c=chosen[1]
            _,beats=librosa.beat.beat_track(onset_envelope=on,sr=SR,hop_length=HOP,bpm=c['bpm'],tightness=100,trim=True)
            metrics=grid_metrics(lin[first:last],log[first:last],beats)
            if metrics is None:continue
            alternatives=[]
            unique=set()
            for ca in chosen:
                if abs(ca['bpm']/c['bpm']-1)<.03 or round(ca['bpm']) in unique:continue
                unique.add(round(ca['bpm']))
                _,bb=librosa.beat.beat_track(onset_envelope=on,sr=SR,hop_length=HOP,bpm=ca['bpm'],tightness=100,trim=True)
                met=grid_metrics(lin[first:last],log[first:last],bb)
                if met:alternatives.append(dict(bpm=ca['bpm'],bass2=met['linear'][0]['p2'],broad2=met['linear'][4]['p2']))
            windows.append(dict(start=first/FPS+origin,end=last/FPS+origin,active=active,status='ok',candidates=cs,prior_bpms=[x['bpm'] for x in chosen],bpm=c['bpm'],beats=(beats/FPS+first/FPS+origin).tolist(),metrics=metrics,alternatives=alternatives))
        valid=[w for w in windows if w['status']=='ok']
        def vec(fn):return np.array([fn(w) for w in valid],dtype=float)
        summary=dict(windows=len(windows),valid_windows=len(valid),duration=dur)
        if valid:
            bp=vec(lambda w:w['bpm']);alt=vec(lambda w:max(w['prior_bpms'])/min(w['prior_bpms'])>1.15)
            summary.update(bpm_median=float(np.median(bp)),bpm_p10=float(np.percentile(bp,10)),bpm_p90=float(np.percentile(bp,90)),prior_ambiguity_fraction=float(np.mean(alt)))
            for name,band in [('bass',0),('lowmid',1),('mid',2),('high',3),('broad',4)]:
                for method in ['linear','log']:
                    for period in [2,3]:
                        ms=[w['metrics'][method][band][f'p{period}'] for w in valid]
                        ms=[x for x in ms if x]
                        if ms:
                            summary[f'{name}_{method}_p{period}_median']=float(np.median([x['contrast'] for x in ms]))
                            summary[f'{name}_{method}_p{period}_heldout_positive']=float(np.mean([x['heldout_effect']>.20 for x in ms]))
                summary[f'{name}_half_median']=float(np.median([w['metrics']['linear'][band]['half'] for w in valid]))
            # Opposing bass/high accents only count when both differences exceed 20%.
            opposing=[];supported=[]
            for w in valid:
                a=w['metrics']['linear'][0]['p2'];b=w['metrics']['linear'][3]['p2']
                if a and b:
                    da=a['profile'][0]-a['profile'][1];db=b['profile'][0]-b['profile'][1]
                    if abs(da)>.2 and abs(db)>.2:opposing.append(da*db<0)
                    la=w['metrics']['log'][0]['p2']
                    if la and abs(da)>.2:
                        dl=la['profile'][0]-la['profile'][1];supported.append(da*dl>0)
            summary['opposing_bass_high_fraction']=float(np.mean(opposing)) if opposing else None
            summary['opposing_bass_high_windows']=len(opposing)
            summary['bass_method_same_phase_fraction']=float(np.mean(supported)) if supported else None
        # Coarse timbral/harmonic changes suggest inspection points, not asserted phrases.
        secframes=round(2*FPS);n=len(chroma)//secframes
        novelty=[]
        if n>4:
            ch=chroma[:n*secframes].reshape(n,secframes,12).mean(axis=1)
            rr=rms[:n*secframes].reshape(n,secframes).mean(axis=1)
            delta=np.linalg.norm(np.diff(ch,axis=0),axis=1)
            delta+=.05*np.abs(np.diff(np.log(rr+1e-8)))
            peaks,_=signal.find_peaks(delta,distance=4,prominence=float(np.std(delta)*.5))
            novelty=[dict(time=float((i+1)*secframes/FPS+origin),score=float(delta[i])) for i in sorted(peaks,key=lambda i:delta[i],reverse=True)[:12]]
        rmsdb=20*np.log10(rms+1e-9)
        summary['rms_range_db_p90_p10']=float(np.percentile(rmsdb,90)-np.percentile(rmsdb,10))
        result=dict(track=t,summary=summary,windows=windows,change_candidates=novelty)
        dst.parent.mkdir(exist_ok=True);dst.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
        return dict(id=t['id'],name=t['name'],status='ok',windows=len(valid),ambiguity=summary.get('prior_ambiguity_fraction'))
    except Exception as e:return dict(id=t['id'],name=t['name'],status='error',error=repr(e))

def main():
    tracks=json.load(open(BASE/'manifest.json'))
    if (BASE/'public-manifest.json').exists():tracks+=json.load(open(BASE/'public-manifest.json'))
    (BASE/'analysis').mkdir(exist_ok=True)
    with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool,open(BASE/'analysis-log.jsonl','a') as log:
        for i,r in enumerate(pool.map(analyze,tracks)):
            log.write(json.dumps(r,ensure_ascii=False)+'\n');log.flush()
            print(i+1,len(tracks),r,flush=True)

if __name__=='__main__':main()
