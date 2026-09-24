"""Explicit metadata review; keep evidence separate from acoustic inference."""
import json
from pathlib import Path
BASE=Path('/tmp/balfolk-deep')
MAP={'Bourrée 2 temps':'bourree','Cercle circassien':'cercle','Branle de Noirmoutier':'noirmoutier','Wals in 3':'waltz','Scottish':'schottische','Mazurka':'mazurka','Hanter dro':'hanter-dro','Andro':'an-dro','Drumul Dracului':'drumul','Chapelloise':'chapelloise'}
MAP.update({'Bourrée in 2':'bourree','Tovercirkel':'cercle','Wals':'waltz','Hanterdro':'hanter-dro','Traditionele Mazurka':'mazurka','Traditional mazurka':'mazurka'})
MATCHES={'c2250684848261ce':3926,'91ad9b6cb7d8fab8':259,'f6355768fa6a65b8':2331,'b27d2e69e1003c4a':2335,'16f733a09e23ad26':5434}

def main():
    tracks=json.load(open(BASE/'manifest.json'))+json.load(open(BASE/'public-manifest.json'))
    db=json.load(open('/tmp/balfolk-music-research.json'));entries={r['tid']:r for rows in db.values() for r in rows}
    for t in tracks:
        t['original_labels']=t['labels'][:]
        tid=MATCHES.get(t['id'],t.get('database_tid'))
        if tid in entries:
            e=entries[tid];t['database_tid']=tid;t['database_dances']=e['dances'];t['database_bpm']=e.get('bpm');t['label_source']='https://balfolk-db.eu/view/'
            t['label_note']='Artist/title/album metadata match; not audio identification.'
            labels=[MAP[d] for d in e['dances'] if d in MAP]
            if labels:t['labels']=list(dict.fromkeys(labels))
            if t['id'] in MATCHES:t['label_status']='database-match'
            # A multiple-dance row is not a definitive annotation for one dance.
            unexpected=[d for d in e['dances'] if d not in MAP and d!='Jig']
            if len(t['labels'])>1 or unexpected:
                t['label_status']='multiple-dance-labels'
                t['label_note']='Database lists multiple dance uses: '+', '.join(e['dances'])+'. Excluded from ordinary single-dance aggregates.'
            elif e['dances']==['Jig']:
                t['label_status']='compatible-rhythm';t['label_note']='Source identifies a jig; suitable rhythm is not evidence for one particular mixer choreography.'
        if t['id']=='cbb159e57280d70f':
            t.update(labels=['waltz'],label_status='artist-labelled',label_source='https://blowzabella.co.uk/track/1398132/to-the-edges-robin-s',label_note='The band describes these as two waltzes.')
        if '3=5' in t['name'].replace('\\',''):
            t['label_status']='variant';t['label_note']='Title explicitly signals metric ambiguity; do not use as ordinary three-beat waltz evidence.'
        if t['id']=='a350b9bcdb2a6ae7':
            t.update(labels=[],label_status='other-dance',label_note='Loudéac. The word bourreau in the title is not the dance bourrée.')
        if t['id']=='eedea48c2578a76d':
            t.update(label_status='variant',label_note='Title explicitly identifies a suite of three-time bourrées; not the app’s two-time dance.')
        if t['id']=='5eba955a65058417':
            t.update(label_status='multiple-dance-labels',label_note='The database labels this medley Hanterdro and Scottish impaire; retained as a mixed-use example, not ordinary schottische.')
        if t['id']=='d318355e4c89fdaf':
            t['labels']=['schottische','hanter-dro'];t['label_note']='Title: hanter / scottish impaire; excluded from ordinary schottische.'
        if t['collection']=='media-unknown':
            t['label_note']='Unknown or non-balfolk media-library material screened computationally; no claimed dance identification.'
    byid={t['id']:t for t in tracks}
    for pair in json.load(open(BASE/'near-duplicates.json')):
        if pair['aligned_similarity']<.98:continue
        a=byid[pair['a']];b=byid[pair['b']]
        b['likely_duplicate_of']=a['id'];b['duplicate_evidence']=pair['aligned_similarity']
        if not b['labels'] and a['labels']:
            b['labels']=a['labels'][:];b['label_status']='acoustic-duplicate';b['label_note']='Near-identical full-duration features to '+a['name']+'. Excluded from aggregate counts.'
    (BASE/'reviewed-manifest.json').write_text(json.dumps(tracks,ensure_ascii=False,indent=2))
    print('reviewed',len(tracks),'duplicates',sum('likely_duplicate_of' in t for t in tracks))

if __name__=='__main__':main()
