"""Audit local music, preserving uncertain labels and duplicate provenance."""
import concurrent.futures
import difflib
import hashlib
import json
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path('/Users/pmigdal/Music/Muzyka balfolk')
MEDIA = Path('/Users/pmigdal/Music/Music/Media.localized/Music')
OUT = Path('/tmp/balfolk-deep')
FF = '/Users/pmigdal/.cache/uv/archive-v0/ezK7oLJgpX1oqaOC/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'

def norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in unicodedata.normalize('NFKD', s.lower()) if not unicodedata.combining(c))).strip()

def classify(s):
    s = norm(s)
    labels = []
    if re.search(r'scott|schott|escot', s): labels.append('schottische')
    if re.search(r'mazur|natzurka|naztzurka', s): labels.append('mazurka')
    if re.search(r'\b(valse|wals|waltz|valsen)\b', s): labels.append('waltz')
    if re.search(r'hanter\s*dr[oe]|hanterdro', s): labels.append('hanter-dro')
    if re.search(r'\ban\s*dr[oe]\b|\bandro\b|\ben\s*dro\b', s): labels.append('an-dro')
    if re.search(r'chapp?el?loise|chapeloise', s): labels.append('chapelloise')
    if re.search(r'cercle|tovercir', s): labels.append('cercle')
    if re.search(r'noirmoutier|branles? de l epine', s): labels.append('noirmoutier')
    if re.search(r'\b(?:bour+ees?|borreias?)\b', s): labels.append('bourree')
    if re.search(r'tzadik|tsadik', s): labels.append('tzadik')
    if re.search(r'drumul|ordog ut', s): labels.append('drumul')
    variant = bool(re.search(r'impaire|valse (?:a )?(?:5|8|11|cinq|huit|onze)|cercle (?:a )?3|bour+ees? (?:a )?(?:3|trois)|bouree 3', s))
    mixed = len(labels)>1 or bool(re.search(r'scottish (?:et |)polka|mazurska valse',s))
    return labels, ('variant' if variant else 'mixed' if mixed else 'tagged' if labels else 'unclassified')

def encoded_hash(r):
    p = subprocess.run([FF,'-v','error','-i',r['path'],'-map','0:a:0','-c:a','copy','-f','hash','-'],capture_output=True,text=True,timeout=60)
    r['audio_hash'] = p.stdout.strip() if p.returncode==0 else None
    return r

def main():
    rows=json.load(open('/tmp/balfolk-local-inventory.json'))
    media=json.load(open('/tmp/music-media-comparison.json'))
    # Unknown media-library recordings are retained for analysis, not assumed irrelevant.
    extras=[r for r in media if not r['already_in_balfolk_folder'] and ('unknown' in r['tags'].get('artist',r['path'].split('/')[0]).lower())]
    allrows=[]
    for root, rs in [(ROOT,rows),(MEDIA,extras)]:
        for r in rs:
            allrows.append({**r,'path':str(root/r['path']),'relative_path':r['path'],'collection':'balfolk' if root==ROOT else 'media-unknown'})
    allrows=list(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(encoded_hash,allrows))
    groups={}
    for r in allrows: groups.setdefault(r['audio_hash'] or r['sha256'],[]).append(r)
    tracks=[]
    for ah,group in groups.items():
        # Prefer shorter, original folder names over nested duplicate copies.
        group.sort(key=lambda r:('Kopia' in r['path'],len(r['path'])))
        r=group[0]; tags=r['tags']; text=r['relative_path']+' '+str(tags)
        labels,status=classify(text)
        title=tags.get('title') or Path(r['path']).stem
        artist=tags.get('artist','')
        if not artist: artist=Path(r['relative_path']).parts[0] if '/' in r['relative_path'] else ''
        tracks.append(dict(id=hashlib.sha256(ah.encode()).hexdigest()[:16],path=r['path'],relative_path=r['relative_path'],collection=r['collection'],name=(artist+' — '+title).strip(' —'),artist=artist,title=title,seconds=r['seconds'],audio_hash=ah,labels=labels,label_status=status,aliases=[x['path'] for x in group],tags=tags))
    tracks.sort(key=lambda t:t['path'])
    # Database matching generates review candidates; it never silently overrides labels.
    db=json.load(open('/tmp/balfolk-music-research.json')); candidates=[]
    for t in tracks:
        ta=norm(t['artist']);tt=norm(t['title']); matches=[]
        for dance,entries in db.items():
            for e in entries:
                ea=norm(e['band']);et=norm(e['title']);ar=difflib.SequenceMatcher(None,ta,ea).ratio()
                if ar<.70:continue
                tr=difflib.SequenceMatcher(None,tt,et).ratio()
                if tr<.62:continue
                matches.append(dict(dance=dance,artist=e['band'],title=e['title'],album=e['album'],tid=e['tid'],score=round(ar*.35+tr*.65,3),bpm=e.get('bpm'),sample_urls=e.get('sample_urls')))
        matches.sort(key=lambda x:x['score'],reverse=True)
        if matches: candidates.append(dict(id=t['id'],name=t['name'],status=t['label_status'],matches=matches[:5]))
    OUT.mkdir(exist_ok=True)
    (OUT/'manifest.json').write_text(json.dumps(tracks,ensure_ascii=False,indent=2))
    (OUT/'database-candidates.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2))
    (OUT/'library-audit.json').write_text(json.dumps(dict(input_files=len(allrows),balfolk_input_files=len(rows),media_unknown_input_files=len(extras),unique_compressed_streams=len(tracks),duration_hours=sum(t['seconds'] for t in tracks)/3600,second_library_total=len(media),second_library_duplicate_files=sum(r['already_in_balfolk_folder'] is True for r in media)),indent=2))
    print(json.loads((OUT/'library-audit.json').read_text()),flush=True)

if __name__=='__main__':main()
