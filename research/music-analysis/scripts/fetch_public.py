"""Fetch a bounded, documented comparison set of public streams/previews."""
import hashlib,html,json,re,subprocess,time
from pathlib import Path

BASE=Path('/tmp/balfolk-deep'); DEST=BASE/'public'
FF='/Users/pmigdal/.cache/uv/archive-v0/ezK7oLJgpX1oqaOC/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
MAP={'Bourrée 2 temps':'bourree','Cercle circassien':'cercle','Branle de Noirmoutier':'noirmoutier','Wals in 3':'waltz','Scottish':'schottische','Mazurka':'mazurka','Hanter dro':'hanter-dro','Andro':'an-dro','Drumul Dracului':'drumul','Chapelloise':'chapelloise'}

def curl(url,path):
    if Path(path).exists() and Path(path).stat().st_size>100:return
    subprocess.run(['curl','--connect-timeout','10','--max-time','60','-L','--fail','--silent','--show-error',url,'-o',str(path)],check=True)

def entry(name,path,source,labels,kind,extra=None):
    p=subprocess.run([FF,'-v','error','-i',str(path),'-ac','1','-ar','8000','-f','s16le','-'],capture_output=True,check=True)
    key=hashlib.sha256(Path(path).read_bytes()).hexdigest()[:16]
    return dict(id=key,name=name,path=str(path),seconds=len(p.stdout)/16000,source=source,labels=labels,label_status='source-labelled',collection=kind,**(extra or {}))

def main():
    DEST.mkdir(exist_ok=True);out=[];errors=[]
    for x in json.load(open('/tmp/drumul-streams.json')):
        out.append(entry(x['name'],x['path'],x['source'],['drumul'],'public-full'))
    for name,title,url in [('zabili','ba.fnu — Zabili','https://bafnu.bandcamp.com/track/zabili-mazurka'),('alio','Naragonia — Alio (Boom bal compilation)','https://homerecordsbe.bandcamp.com/track/alio')]:
        out.append(entry(title,'/tmp/'+name+'.mp3',url,['mazurka'],'public-full'))
    for slug,name,url in [('tzadik','Jonathan Gabay — Tzadik Katamar','https://musicfromisrael.bandcamp.com/track/tzadik-katamar'),('tzadik-netzer','Effi Netzer and his band — Tzadik Katamar','https://music-from-israel.bandcamp.com/track/tzadik-katamar')]:
        try:
            page=DEST/f'{slug}.html';curl(url,page)
            d=json.loads(html.unescape(re.search(r'data-tralbum="([^"]+)"',page.read_text()).group(1)))
            tr=d['trackinfo'][0];path=DEST/f'{slug}.mp3';curl(tr['file']['mp3-128'],path)
            out.append(entry(name,path,url,['tzadik'],'public-full'))
        except Exception as e:errors.append(dict(source=url,error=str(e)))
    # Named tunes discussed with the user, plus at least three different artists
    # per database category where available. These are illustrative, not random.
    selected={7370,16832,7391,1269,766,2381,2754,14574,3550,1129,1280,10489,5259,15686,5535,6850,654,10845,4946,3430,4693,6861,7344}
    db=json.load(open('/tmp/balfolk-music-research.json'));chosen={}
    for dance,rs in db.items():
        artists=set()
        for r in rs:
            if r['tid'] in selected and r.get('sample_urls'):
                chosen.setdefault(r['tid'],(r,[]))[1].append(MAP[dance]);artists.add(r['band'])
        if len(artists)<3:
            ranked=sorted(rs,key=lambda r:(sum(r.get('upvotes') or []),bool(r.get('bpm'))),reverse=True)
            for r in ranked:
                if r['band'] in artists or not r.get('sample_urls'):continue
                chosen.setdefault(r['tid'],(r,[]))[1].append(MAP[dance]);artists.add(r['band'])
                if len(artists)>=3:break
    for tid,(r,labels) in chosen.items():
        url='https://balfolk-db.eu'+r['sample_urls'][0];path=DEST/f'db-{tid}.mp3'
        try:
            curl(url,path)
            e=entry(r['band']+' — '+r['title'],path,'https://balfolk-db.eu/view/',labels,'public-preview',dict(database_tid=tid,database_bpm=r.get('bpm'),album=r['album'],audio_url=url))
            out.append(e);print(tid,e['name'],round(e['seconds'],1),flush=True)
        except Exception as e:errors.append(dict(tid=tid,source=url,error=str(e)));print('ERROR',tid,str(e),flush=True)
        (BASE/'public-manifest.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
        (BASE/'public-fetch-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2))
        time.sleep(.15)
    print('done',len(out),'errors',len(errors),flush=True)

if __name__=='__main__':main()
