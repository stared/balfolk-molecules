"""Compare musical repetition using the selected maps and optional phrase hypotheses."""
import argparse
import json
import os
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--track', action='append', help='Track key; default: configured structure reviews.')
parser.add_argument('--work-dir', type=Path, default=Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync')))
args = parser.parse_args()
tracks = json.loads((HERE / 'tracks.json').read_text())
maps = json.loads((HERE / 'audit.json').read_text())
names = args.track or [name for name, track in tracks.items() if track.get('structureReview')]
for name in names:
    if name not in maps:
        parser.error(f'{name}: no selected beat map')
for name in names:
    times = np.asarray(maps[name]['beats'])
    with np.load(args.work_dir / f'{name}-features.npz') as features:
        fps, chroma = float(features['chroma_fps']), features['chroma']
        # Two chroma samples per count retain note order within each pulse.
        samples = np.array([np.concatenate([
            chroma[:, int(t*fps):int((t+(b-a)/2)*fps)].mean(axis=1)
            for t in [a, (a+b)/2]
        ]) for a, b in zip(times[:-1], times[1:])])
    samples /= np.linalg.norm(samples, axis=1)[:, None] + 1e-9
    np.savez_compressed(args.work_dir / f'{name}-structure.npz', times=times, chroma=samples)
    report = {'track': name, 'lagSimilarity': {
        lag: float(np.mean(np.sum(samples[:-lag] * samples[lag:], axis=1)))
        for lag in [8,16,24,32,48,64] if len(samples) > lag
    }}
    # Optional A/BB hypothesis: compare the repeated units with the preceding unit.
    hypothesis = tracks[name].get('repeatContrast')
    if hypothesis:
        unit, step = hypothesis['unitCounts'], hypothesis['phaseStep']
        size = 3 * unit
        report['repeatContrast'] = {}
        for shift in range(0, size, step):
            cycles = [samples[i:i+size] for i in range(shift, len(samples)-size+1, size)]
            if cycles:
                report['repeatContrast'][shift] = float(np.mean([
                    np.mean(np.sum(c[unit:2*unit] * c[2*unit:size], axis=1))
                    - np.mean(np.sum(c[:unit] * c[unit:2*unit], axis=1)) for c in cycles
                ]))
    bar = maps[name]['bar']
    report['barChromaDistances'] = [
        float(np.linalg.norm(samples[i-bar:i].mean(axis=0)-samples[i:i+bar].mean(axis=0)))
        for i in range(bar, min(16*bar+1, len(samples)-bar+1), bar)
    ]
    print(json.dumps(report, allow_nan=False))
