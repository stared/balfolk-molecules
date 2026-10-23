"""Compare ViatoreS phrase order with the existing Travel-first Żniwa map.

Requires features.py outputs named drumul-viatores-features.npz and
drumul-zniwa-reference-features.npz in BALFOLK_SYNC_WORK. This is a melodic
comparison against the app's established figure assignment, not a new
independent annotation of dance steps.
"""
import json
import os
import subprocess
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
WORK = Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync'))


def samples(key, beats):
    with np.load(WORK / f'{key}-features.npz') as features:
        chroma, fps = features['chroma'], float(features['chroma_fps'])
        values = np.array([
            [chroma[:, int((a+k*(b-a)/4)*fps):int((a+(k+1)*(b-a)/4)*fps)].mean(axis=1)
             for k in range(4)] for a, b in zip(beats[:-1], beats[1:])
        ])
    return values / (np.linalg.norm(values, axis=2, keepdims=True) + 1e-9)


reference = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {recordingsByDance} from './src/music/recordings.ts';"
    "console.log(JSON.stringify(recordingsByDance['drumul-dracului'].find(r=>r.videoId==='jwQukZnz4BQ')));"
], cwd=ROOT))
mapping = json.loads((HERE / 'audit.json').read_text())['drumul-viatores']
beats = np.asarray(mapping['beats'])
template = samples('drumul-zniwa-reference', reference['beats']).reshape(-1, 64, 4, 12).mean(axis=0)
target = samples('drumul-viatores', beats)
results = []
for phase in range(64):
    for transpose in range(12):
        scores = [float(np.mean(np.sum(target[i:i+64] * np.roll(template, transpose, axis=2), axis=2)))
                  for i in range(phase, len(target)-63, 64)]
        results.append({'phase': phase, 'seconds': float(beats[phase]),
                        'transpose': transpose, 'score': float(np.mean(scores)), 'cycles': scores})
results.sort(key=lambda result: result['score'], reverse=True)
source = json.loads((WORK / 'drumul-zniwa-reference-source.json').read_text())
report = {
    'method': 'Four chroma samples per dance count; cosine similarity over all 64 origins and 12 transpositions.',
    'reference': {'url': source['webpage_url'], 'mediaSha256': source['mediaSha256'],
                  'start': reference['beats'][0], 'end': reference['beats'][-1]},
    'target': 'https://www.youtube.com/watch?v=2rXDxHWpjlI',
    'results': results[:15],
}
(HERE / 'drumul-reference-phase.json').write_text(json.dumps(report, indent=2) + '\n')
print(results[0])
