# Methods and limits

This audit asks whether audio accents justify a common visual foot-impact rule. It is exploratory, with explicit counterexamples and sensitivity checks. It is not a benchmark against human-annotated balfolk beats or motion capture.

## Inventory and labels

Local inventories include filenames, tags, durations, file hashes, and encoded-audio hashes. The latter remove duplicate containers without pretending that different encodings are different performances. Full-duration chroma and spectral-envelope similarity additionally found ten likely transcoded duplicates above 0.98 aligned similarity; one weaker candidate remains unresolved. No source files were removed or renamed.

Filename/tag dance matching is only a first pass. Explicit review adds artist/title/album matches from the [Balfolk Database](https://balfolk-db.eu/view/), preserves multiple-dance labels, and excludes obvious metric variants from ordinary-dance aggregates. Acoustic similarity recovers two otherwise anonymous Skolvan labels. A score or a dance-compatible label does not establish which foot lands at each recorded attack.

The public comparison set is purposive: named tracks discussed with the user, multiple performers where available, and useful counterexamples. Database votes helped locate examples; they are **not** a popularity survey or random sample. Preview boundaries are not matched musical phrases across versions. Complete sources and durations are in [public-sources.json](data/public-sources.json).

## Spectral measurements

Audio is decoded locally with FFmpeg to mono, 22,050 Hz float samples. The main transform uses a 2,048-sample Hann window, 256-sample hop, no boundary padding. Feature times refer to window centres, including the 46.44 ms origin offset.

CSV `seconds`, the viewer, and total hours use decoded duration; `metadata_seconds` retains the original estimate. A separate complete-file decoder audit checks error messages even when FFmpeg exits successfully. Brotto–Lopez's three-time bourrée suite produces an invalid-packet error and 50.08 decoded seconds versus 89.94 estimated; this source is damaged/partial. `Polska.mp3` has an inaccurate bitrate-based estimate (203.75 versus 189.60 decoded seconds), without decoder packet errors. Neither item supplies the main Drumul/schottische conclusions.

The [decoder audit](data/decode-audit.json) also flags invalid packets in Skeduz — *Hanter Fisel*, Bernard Loffet — *Pach’pi*, and Blowzabella — *New Pneus*. These remain unclassified controls. Eleven other files have malformed comment metadata, without audio-packet errors. All 428 decode attempts exited successfully, illustrating why the exit status alone is insufficient.

Positive spectral changes are measured in 40–180 Hz, 180–500 Hz, 500–2,000 Hz, 2–8 kHz, and 40–8,000 Hz bands. Both linear magnitude differences and `log1p(1000 × magnitude)` differences are retained. Linear flux weights large components heavily; log flux makes quiet components more influential. The same recording can therefore have different “strongest” positions under reasonable definitions of attack strength.

The stored `rms` field is a spectral energy proxy, not calibrated acoustic loudness or an LUFS measurement. Chroma is an approximate FFT pitch-class representation used for recurrence and duplicate screening, not a score transcription.

The first temporal pass uses full-duration 16-second windows with 8-second stride, plus a tail window. Local autocorrelation supplies competing pulse candidates from 45–220/minute. Three priors (80, 110, 160) expose metrical-level sensitivity. [Librosa’s beat tracker](https://librosa.org/doc/0.10.2/generated/librosa.beat.beat_track.html) aligns each candidate grid. **These overlapping windows are not independent statistical samples.** A candidate selected by the 110 prior is not automatically the dance pulse.

## Two neural checks

[Beat This!](https://github.com/CPJKU/beat_this), [paper](https://arxiv.org/abs/2407.21658), supplies framewise beat and downbeat predictions. The official `final0` and `small0` weights ran on-device, on every complete audio item. Their minimal postprocessor selects local peaks above 0.5 and moves predicted downbeats to nearby beats. It can output extra subdivisions, skip pulses, or change counting level.

These are two models in the **same family**, not independent human validations. Their frame interval is 20 ms. Reporting a median 93.75 or 166.67 BPM does not imply that degree of timing precision.

Beat agreement is a one-to-one chronological match at 40, 70, and 100 ms tolerances; F1 is `2 × matches / (A count + B count)`. It measures agreement, not accuracy. Downbeats are matched separately. A high beat F1 can coexist with wrong dance-count rate or wrong group phase.

Accent profiles are conditional on regular inferred groups of 2, 3, 4, or 6 pulses. A group must begin within 60 ms of its predicted start, have a median interval between 0.2 and 1.4 seconds, and contain no interval more than 24% from that median. At least six groups are required. This rejects irregular predictions but also selects the portions easiest for a model; coverage is reported rather than hidden.

Flux is sampled with peak windows of ±25, ±45, and ±75 ms. Each group is normalized to mean one before averaging, so a loud final section does not dominate by amplitude alone. Pooled profiles are also retained. Successive blocks of up to eight accepted groups show local variation. Blocks may span rejected intervals; they are not guaranteed contiguous musical phrases.

The strongest/weakest positions selected in the first chronological half are checked in the second half. A positive held-out effect supports recurrence; **0.2 is a descriptive threshold, not a p-value**. Synthetic exponential-noise controls show that even the held-out threshold can be exceeded by chance. A “2:1 strongest/weakest ratio” from a handful of selected bars is especially weak evidence.

## Additional angles

- **Texture separation:** median filters of 31 frames/bins on a 2,048-point transform with 512-sample hop. Soft masks with power two compare sustained and transient components; margins one and three expose leakage/ambiguous energy. This follows the principles of [harmonic/percussive separation](https://librosa.org/doc/0.10.2/generated/librosa.decompose.hpss.html) and [Driedger, Müller and Disch](https://www.audiolabs-erlangen.de/fau/professor/mueller/publications/2014_DriedgerMuellerDisch_ExtensionsHPSeparation_ISMIR.pdf). Accordion attacks can enter the transient component; this is not drum isolation.
- **Subdivision folding:** attack envelopes are mapped into 101 normalized positions between regular predicted pulses. Offbeat peaks are searched between phases 0.25 and 0.75. Results describe audio onset distributions, not dancer swing or millisecond-precise foot placement.
- **Drumul choreography comparison:** the existing app’s measured recording maps supply the dance-count hypothesis. Stamps, transfers and holds are derived from the existing 64-count score. Features are normalized in 16-count blocks before comparing action classes. Musical timing correspondence is checked separately from figure assignment.
- **Animation audit:** the existing frame functions and renderer thresholds are evaluated at 120 Hz through two cycles; the second cycle avoids initialization effects. Exact smoothstep threshold solutions quantify nominal delays. The study counts rendered events, not measured biomechanical contacts or user distraction.
- **Synthetic known-answer controls:** an intentionally wrong 4:3 pulse grid creates alternating accents from equal eighth notes; random unaccented samples demonstrate selection bias; matching checks ensure one prediction cannot match two others.
- **Model sensitivity:** the entire ordinary-schottische accent comparison is repeated with the smaller model’s grid, both flux definitions, and all three timing tolerances. [Condition-by-condition results](data/model-sensitivity.json) retain failures to replicate.

## What was not established

There is no validated automatic map from attack strength to foot force, sinking depth, step size, or the correct movement interpretation. No motion capture, dancer tapping experiment, or listening panel was performed. The Barray Hanter-dro count-rate dispute recorded in `docs/music-sync.md` remains unresolved; music-model confidence cannot settle it.

Unknown library material was screened without a claimed automatic genre identification. Public previews do not establish whole-song stability. A multiple-dance database label can indicate compatibility, a regional convention, or a tagging disagreement. Generic “bourrée” does not by itself distinguish two-time and three-time music, and a six-person formation does not imply six-time music.

## Files and reproduction

The repository contains measurements, figures, source links, the local viewer, and the scripts. Audio, model weights, absolute personal-library paths, and dense intermediate arrays stay outside the repository, principally in `/tmp/balfolk-deep`. Unidentified media-library titles are anonymized in the exported table. The viewer makes no external requests and only plays a file explicitly opened locally.

The scripts preserve the actual audit pipeline, including its temporary input manifests. They are research scripts, **not a one-command fresh-checkout workflow**: `build_manifest.py` expects the earlier library inventories and database snapshot; `fetch_public.py` also expects the four Drumul source files and the two initially requested mazurka streams. Public URLs and local filenames are recorded so those inputs can be reconstructed. Changing recordings, metadata, or preview availability can change the results.

Processing order after obtaining the inventories/audio:

1. `build_manifest.py`, `fetch_public.py`, `extract_features.py`.
2. `check_duplicates.py`, `review_labels.py`, `analyze_recordings.py`.
3. `neural_beats.py --model final0` and `--model small0`.
4. `compare_beats.py`, `check_model_sensitivity.py`, `separate_texture.py`, `analyze_texture.py`, `subdivisions.py`.
5. Export the existing app maps to `app-recordings.json`; run `drumul_phases.py`, `audit_animation.ts`, and `synthetic_controls.py`.
6. `export_results.py`, then `plot_results.py`.

The analysis used cached Python environments with NumPy, SciPy, librosa, PyTorch/Beat This!, and matplotlib; FFmpeg 7.1; and Node’s native TypeScript support for the read-only animation audit. No JavaScript package or app dependency was added.

Browser verification exercised every recording and inferred-group option in the viewer, local audio loading/playback, passage jumps, and the 390 px layout. It found no script errors, external requests, or horizontal overflow. The saved plots were visually inspected. Numerical coverage/integrity checks are recorded in [validation.json](data/validation.json).
