"""Known-answer controls for pulse aliasing, selection bias and visual timing."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import json
from pathlib import Path
import numpy as np
from scipy.optimize import brentq
from compare_beats import agreement
from analyze_recordings import phase_metrics

def main():
    rng=np.random.default_rng(20260922)
    fps=1000;tempo=95.;period=60/tempo
    t=np.arange(0,32*period,1/fps)
    envelope=np.full(len(t),.02)
    # Equal eighth-note attacks. Correct quarter-note samples are also equal.
    for hit in np.arange(0,t[-1],period/2):envelope+=np.exp(-.5*((t-hit)/.025)**2)
    true_times=np.arange(1,30)*period
    wrong_times=np.arange(1,40)*(period*.75)
    at=lambda x:np.interp(x,t,envelope)
    true=phase_metrics(at(true_times),2);wrong=phase_metrics(at(wrong_times),2)
    assert true['contrast']<1.001 and wrong['contrast']>40
    assert agreement([0,1,2],[0,1,2])['f1']==1
    assert abs(agreement([0,1],[0,0.01,1])['f1']-.8)<1e-10
    assert phase_metrics(np.r_[np.tile([2,1],8),np.tile([1,2],8)],2)['heldout_effect']<0
    bias=[]
    for bars in [4,8,16,32]:
        x=rng.exponential(size=(20000,bars,3))
        m=x.mean(axis=1);contrast=m.max(axis=1)/m.min(axis=1)
        train=x[:,:bars//2].mean(axis=1);test=x[:,bars//2:].mean(axis=1)
        hi=train.argmax(axis=1);lo=train.argmin(axis=1);rows=np.arange(len(x))
        effect=(test[rows,hi]-test[rows,lo])/test.mean(axis=1)
        bias.append(dict(bars=bars,no_true_accent=True,median_selected_contrast=float(np.median(contrast)),
                         fraction_contrast_over_1_5=float(np.mean(contrast>1.5)),
                         fraction_heldout_effect_over_0_2=float(np.mean(effect>.2))))
    transfer=brentq(lambda x:x*x*(3-2*x)-.675,0,1)
    stamp=brentq(lambda x:x*x*(3-2*x)-.1,0,1)*.12
    timing=[]
    for name,bpm,fraction in [('schottische',96,.22),('waltz',100,.22),('mazurka',90,.6),('drumul',160,.28)]:
        timing.append(dict(dance=name,bpm=bpm,trigger_after_count_ms=transfer*fraction*60000/bpm))
    result=dict(pulse_aliasing=dict(true_bpm=95,wrong_bpm=95*4/3,true_p2=true,wrong_p2=wrong,
                seconds=t[::5].tolist(),envelope=envelope[::5].tolist(),true_times=true_times.tolist(),wrong_times=wrong_times.tolist()),
                selection_bias=bias,transfer_crossing_fraction=transfer,stamp_crossing_count_fraction=stamp,
                stamp_delay_at_160_bpm_ms=stamp*60000/160,animation_timing=timing,
                visible_duration_above_opacity_0_1_ms=200*(1-np.sqrt(.1/.5)))
    Path('/tmp/balfolk-deep/synthetic-controls.json').write_text(json.dumps(result,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k!='pulse_aliasing'},indent=2))
    print('alias contrast',true['contrast'],wrong['contrast'])

if __name__=='__main__':main()
