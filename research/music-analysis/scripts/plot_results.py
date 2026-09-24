"""Standalone figures, generated from saved measurements (no audio embedded)."""
import os
os.environ.setdefault('MPLCONFIGDIR','/tmp/balfolk-mpl')
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
BASE=Path('/tmp/balfolk-deep');OUT=Path(__file__).resolve().parents[1]/'figures';OUT.mkdir(exist_ok=True)
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none','figure.facecolor':'white'})
BLUE='#24718b';ORANGE='#c67929';GRAY='#76817e'

def save(fig,name):
    fig.savefig(OUT/(name+'.png'),dpi=170,bbox_inches='tight');fig.savefig(OUT/(name+'.svg'),bbox_inches='tight');plt.close(fig)

def main():
    ts=json.load(open(BASE/'reviewed-manifest.json'));byid={t['id']:t for t in ts}
    rows=[]
    for t in ts:
        if t['collection']!='balfolk' or t['labels']!=['schottische'] or t['label_status']!='tagged':continue
        r=json.load(open(BASE/'beat-comparison'/f"{t['id']}.json"));m=r['inferred_meters'];k=max(m,key=lambda k:m[k]['bass_linear_45ms']['bars']);m=m[k]
        vals=[]
        for band in ['bass','high']:
            p=np.array(m[band+'_linear_45ms']['profile']);vals.append(p[::2].mean()-p[1::2].mean())
        rows.append((t['name'],*vals,r['raw_neural_bpm']))
    fig,ax=plt.subplots(figsize=(10,9));y=np.arange(len(rows))
    for i,(name,bass,high,bpm) in enumerate(rows):
        ax.plot([bass,high],[i,i],color='#d0d5d3',lw=1.5)
        ax.scatter(bass,i,color=BLUE,s=38,facecolors='none' if bpm>145 else BLUE)
        ax.scatter(high,i,color=ORANGE,s=38,facecolors='none' if bpm>145 else ORANGE)
    labels=[name.replace(' — ',' · ').replace(' (scottish)','').replace(' - scottish','').replace(' (Scottish)','') for name,*_ in rows]
    ax.set_yticks(y,labels,fontsize=8.5);ax.invert_yaxis();ax.axvline(0,color='#8e9995',lw=.8)
    ax.set_xlim(-1.25,1.35);ax.set_xlabel('Odd-position attack − even-position attack (group mean = 1)')
    ax.scatter([],[],color=BLUE,label='Bass, 40–180 Hz');ax.scatter([],[],color=ORANGE,label='Bright, 2–8 kHz');ax.legend(loc='upper center',bbox_to_anchor=(.5,1.035),ncol=2,frameon=False)
    ax.set_title('24 local schottisches: bass and bright attacks can emphasize opposite pulses',loc='left',pad=40)
    fig.text(.02,.01,'Positions follow inferred groups, not verified dance counts. Hollow points: faster/doubled pulse interpretation needs review.\nSeven exceed a 0.2 opposing-contrast threshold in this pass; five retain it with the other model’s grid. No significance test is claimed.',fontsize=9,color='#555f5c')
    fig.tight_layout(rect=(0,.045,1,1));save(fig,'schottische-accents')

    dp=json.load(open(BASE/'drumul-phases.json'));fig,axs=plt.subplots(1,2,figsize=(10,4.1),sharey=True)
    for ax,r in zip(axs,dp):
        x=np.arange(3)
        for j,(band,color) in enumerate([('bass',BLUE),('high',ORANGE)]):
            values=[r['methods']['linear'][band]['by_action'][a] for a in ['transfer','stamp','hold']]
            ax.bar(x+(j-.5)*.32,values,.30,color=color,label=band.capitalize())
        ax.axhline(1,color='#777',lw=.8,ls='--');ax.set_xticks(x,['Weight transfer','Stamp','Hold']);ax.set_title(r['artist']);ax.set_ylim(0,1.85)
    axs[0].set_ylabel('Attack strength / local 16-count mean');axs[1].legend(frameon=False)
    fig.suptitle('A strong musical attack can occur during a dance hold',x=.06,ha='left',fontsize=13)
    fig.text(.06,.02,'Conditional on the existing app choreography and recording maps; equal-length 16-count blocks limit crescendo bias.',fontsize=9,color='#555f5c')
    fig.tight_layout(rect=(0,.05,1,.95));save(fig,'drumul-actions')

    fig,axs=plt.subplots(2,2,figsize=(10,6.5));maps=json.load(open(BASE/'app-recordings.json'))['drumul-dracului']
    for ax,m in zip(axs.flat[:2],maps):
        b=np.array(m['beats']);x=[];v=[]
        for i in range(0,len(b)-16,16):x.append((b[i]+b[i+16])/2);v.append(60*16/(b[i+16]-b[i]))
        ax.plot(x,v,color=BLUE,marker='.',ms=4);ax.set_title(m['artist']+' · existing selected passage');ax.set_ylim(65,190)
    for ax,id in zip(axs.flat[2:],['dea4f0794d1ae8de','c5abdfa2378452ed']):
        n=json.load(open(BASE/'neural-final0'/f'{id}.json'));b=np.array(n['beats']);ibi=np.diff(b);x=[];v=[]
        for sec in range(0,int(n['duration'])-10,16):
            a=ibi[(b[:-1]>=sec)&(b[:-1]<sec+16)&(ibi>.30)&(ibi<.46)]
            if len(a)>20:x.append(sec+8);v.append(60/a.mean())
        ax.plot(x,v,color=BLUE,marker='.',ms=4);ax.set_title(byid[id]['name']);ax.set_ylim(65,190)
    for ax in axs.flat:ax.set_xlabel('Recording time, seconds');ax.set_ylabel('Pulse / count rate per minute');ax.grid(axis='y',alpha=.15)
    fig.suptitle('Drumul recordings have different tempo trajectories',x=.07,ha='left',fontsize=14)
    fig.text(.07,.005,'Top: existing dance-count maps. Bottom: regular model intervals of 0.30–0.46 s, averaged over 16 s; conditional pulse interpretation.',fontsize=8.5,color='#555f5c')
    fig.tight_layout(rect=(0,.02,1,.95));save(fig,'drumul-tempo')

    fig,axs=plt.subplots(1,2,figsize=(10.5,4));r=json.load(open(BASE/'beat-comparison/9df55aca5da6ab0e.json'))['inferred_meters']['3']
    x=np.arange(3)
    for j,(band,color) in enumerate([('bass',BLUE),('high',ORANGE),('broad',GRAY)]):axs[0].bar(x+(j-1)*.25,r[band+'_linear_45ms']['profile'],.23,color=color,label=band.capitalize())
    axs[0].set_xticks(x,['1','2','3']);axs[0].axhline(1,color='#777',ls='--',lw=.8);axs[0].set_title('Zabili: 184 regular three-pulse groups');axs[0].set_ylabel('Mean-normalized attack');axs[0].legend(frameon=False)
    for model,color,label in [('final0',BLUE,'Model A'),('small0',ORANGE,'Model B')]:
        n=json.load(open(BASE/f'neural-{model}/8d7a87938921a702.json'));w=n['tempo_windows'];axs[1].plot([p['start']+8 for p in w],[p['bpm'] for p in w],marker='.',color=color,label=label)
    axs[1].set_title('Alio: the detector changes pulse level');axs[1].set_xlabel('Recording time, seconds');axs[1].set_ylabel('Raw model pulse rate / minute');axs[1].legend(frameon=False)
    fig.text(.06,.01,'Alio is the 2:59 Boom bal compilation stream. The model’s doubled rate is not evidence that the dance should double speed.',fontsize=9,color='#555f5c')
    fig.tight_layout(rect=(0,.065,1,1));save(fig,'mazurka-checks')

    s=json.load(open(BASE/'synthetic-controls.json'));a=s['pulse_aliasing'];fig,axs=plt.subplots(2,1,figsize=(10,4.8),sharex=True)
    t=np.array(a['seconds']);env=np.array(a['envelope'])
    for ax,key,label,color in [(axs[0],'true_times','Correct quarter-note grid: 95 BPM',BLUE),(axs[1],'wrong_times','Wrong grid: 126.7 BPM creates strong/weak alternation',ORANGE)]:
        ax.plot(t,env,color='#c0c9c5',lw=1);times=np.array(a[key]);ys=np.interp(times,t,env);ax.scatter(times,ys,s=28,color=color,zorder=3);ax.set_title(label,loc='left');ax.set_xlim(.5,5.7);ax.set_yticks([0,1]);ax.set_ylabel('Attack')
    axs[1].set_xlabel('Time, seconds');fig.text(.08,.005,'Synthetic equal eighth-note attacks; no alternating accent exists in the source. This tests a failure mechanism, not a transcription of Zabili.',fontsize=9,color='#555f5c')
    fig.tight_layout(rect=(0,.025,1,1));save(fig,'pulse-aliasing')
    print('wrote figures',OUT)

if __name__=='__main__':main()
