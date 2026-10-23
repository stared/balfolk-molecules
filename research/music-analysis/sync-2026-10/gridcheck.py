"""Validate constant-tempo candidates from tracks.json; report all tracks together."""
import argparse
import json
import os
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent


def nearest_errors(times, observations):
    return np.min(abs(times[:, None] - observations), axis=1)


def flux_offset(seconds, flux, fps, radius):
    index = round(seconds * fps)
    first = max(0, index - round(radius * fps))
    last = min(len(flux), index + round(radius * fps) + 1)
    if first >= last:
        raise ValueError(f'No spectral data at {seconds:.3f} s')
    return (first + int(np.argmax(flux[first:last])) - index) / fps


def validate(track, detections, features):
    config = track['mapping']
    bpm, start, counts, cycle, bar = (config[k] for k in ['bpm', 'start', 'counts', 'cycle', 'bar'])
    times = start + np.arange(counts + 1) * 60 / bpm
    models = track.get('models', ['final0', 'small0'])
    beats = [np.asarray(detections[model]['beats']) for model in models]
    error = np.minimum(*(nearest_errors(times, values) for values in beats))
    fps, flux = float(features['fps']), features['logflux']
    report = {
        'bpm': bpm, 'start': start, 'end': float(times[-1]),
        'counts': counts, 'cycles': counts // cycle,
        'within60ms': float(np.mean(error < .06)),
        'p95ms': float(np.percentile(error, 95) * 1000),
        'modelDisagreements': [
            {'seconds': float(t), 'nearestModelMs': float(e * 1000),
             'strongestFluxOffsetMs': flux_offset(t, flux, fps, .1) * 1000}
            for t, e in zip(times, error) if e > .06
        ],
    }
    fit = track.get('tempoFit', {})
    low, high = fit.get('window', [start, float(times[-1])])
    observations = np.concatenate(beats)
    observations = observations[(observations > low) & (observations < high)]
    if len(observations) < 2:
        raise ValueError('Tempo fitting requires observations inside its window')
    minimum, maximum = fit.get('bpmRange', [bpm * .96, bpm * 1.04])
    periods = 60 / np.linspace(minimum, maximum, fit.get('candidates', 3201))
    coherence = np.array([abs(np.mean(np.exp(2j * np.pi * observations / p))) for p in periods])
    best = int(np.argmax(coherence))
    period = 60 / bpm
    phase = float(np.angle(np.mean(np.exp(2j * np.pi * observations / period))) * period / (2 * np.pi) % period)
    report['tempoFit'] = {'window': [low, high], 'bpm': float(60 / periods[best]),
                          'coherence': float(coherence[best]), 'configuredGridPhase': phase}
    report['barPhaseVotes'] = {}
    for model in models:
        downbeats = np.asarray(detections[model]['downbeats'])
        indices = np.round((downbeats - phase) / period).astype(int)
        supported = abs(downbeats - phase - indices * period) < .06
        report['barPhaseVotes'][model] = np.bincount(indices[supported] % bar, minlength=bar).tolist()
    report['windows'] = []
    for low in np.arange(start, times[-1], 45):
        selected = (times >= low) & (times < low + 45)
        errors = error[selected]
        offsets = [flux_offset(t, flux, fps, .065) for t in times[selected]]
        report['windows'].append({
            'from': float(low), 'beats': int(np.sum(selected)),
            'modelWithin60ms': float(np.mean(errors < .06)),
            'modelP90Ms': float(np.percentile(errors, 90) * 1000),
            'fluxMedianAbsMs': float(np.median(abs(np.array(offsets))) * 1000),
        })
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--track', action='append', help='Track key; repeat to select several. Default: all grids.')
    parser.add_argument('--work-dir', type=Path, default=Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync')))
    parser.add_argument('--output', type=Path, default=HERE / 'grid-validation.json')
    args = parser.parse_args()
    tracks = json.loads((HERE / 'tracks.json').read_text())
    raw = json.loads((HERE / 'detections.json').read_text())
    names = args.track or [name for name, track in tracks.items() if track['mapping']['method'] == 'grid']
    for name in names:
        if name not in tracks or tracks[name]['mapping']['method'] != 'grid':
            parser.error(f'{name}: expected a configured grid track')
    # A targeted rerun replaces that track's results, preserving the other reports.
    results = json.loads(args.output.read_text()) if args.track and args.output.exists() else {}
    for name in names:
        with np.load(args.work_dir / f'{name}-features.npz') as features:
            results[name] = validate(tracks[name], raw[name], features)
        print(f"{name}: {results[name]['within60ms']:.1%} within 60 ms; "
              f"{len(results[name]['modelDisagreements'])} model disagreements")
    args.output.write_text(json.dumps(results, indent=2, allow_nan=False) + '\n')


if __name__ == '__main__':
    main()
