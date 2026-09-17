# Bourrée music prototype

Two user-selected YouTube recordings are available below the full-width dance timeline, to the right of the controls and dance notes. No audio, video, player credentials or downloaded analysis files are shipped.

| Recording | Video | Measured main pulse | Selected start | Selected end | Dance cycles |
| --- | --- | --- | --- | --- | --- |
| Accordzéâm — Allez, bourrés | AE2tuIaFmTA | approximately 135 BPM | 40.540 s | 211.207 s | 6 |
| AedO — Experior (Remix) | 7pzXyRLWiuc | approximately 150 BPM | 25.980 s | 230.780 s | 8 |

These are selected practice passages, not full-song transcriptions. The introduction plays with the dancers waiting. Restart seeks to the first dance phrase. Playback pauses at the selected passage end. Selecting No music allows independent practice; selecting a recording always synchronizes the dance.

## Measurement and phrase origins

Temporary copies of the supplied recordings were decoded to mono 22050 Hz outside the repository. Spectral onset strength, local autocorrelation and a continuous pulse fit established the tempos. Chroma contour comparisons identified repeated melodic phrases; an independent Beat This downbeat model checked their boundaries. These analysis dependencies and media are not shipped.

Allez, bourrés: the attack at 33.4 s begins a 16-beat rhythmic lead-in. The repeated melody starts at 40.54 s. Its first 16-beat phrases begin at approximately 40.54, 47.66, 54.76 and 61.88 s; the next 64-beat cycle starts at 68.98 s. A continuous fit over 35–85 s gives 134.9934 BPM, rounded to 135. Across the selected passage, the nearest independently estimated downbeats at each 16-beat boundary have a median absolute grid error of 7 ms and maximum 67 ms.

Experior: the first pulse around 0.4 s belongs to a 64-beat introduction. The melody entry is at 25.98 s, with subsequent boundaries at 32.40, 38.78, 45.18 and 51.58 s. A continuous fit gives 150.0037 BPM, rounded to 150. The preset covers eight full dance cycles. Later, around 238–243 s, the downbeat detector changes meter phase by two beats while the pulse continues. This may reflect the arrangement or a detector error; that unresolved passage and the outro are excluded rather than presented as verified alignment.

One bourrée step spans two musical beats. A full animation cycle contains 64 musical beats. Phrase starts are supported by computational melodic repetition and downbeat agreement, not a manually listened-through transcription. This supports the chosen entries but does not prove that every later compositional section coincides with a dance cycle. The clock accepts nonuniform beat timestamps for future refinements.

## Playback design

YouTube's reported current time determines the absolute musical beat, dance cycle and within-cycle position. The independent animation timer is bypassed while sync is enabled, including when the video is paused or buffering. Backward seeks therefore return to the correct cycle rather than accumulating elapsed animation time.

The main controls and the video's own controls operate on the same player. The selector includes No music; there is no separate synchronization toggle. The player has a fixed space, and no passage caption, intro label or duplicate YouTube link is shown. The practice tempo slider is disabled during synchronization, and the displayed BPM accounts for the video's playback rate. Switching dances pauses the video; switching recordings destroys the previous player and creates a fresh instance to prevent stale timing/state. Invalid timing values during player initialization are guarded. No autoplay is requested when the iframe loads.

The official visible iframe remains at least 200 px in both dimensions at tested widths, with its native controls available. It streams from YouTube rather than a local proxy.

## Verification

- Unit checks: variable-interval interpolation, intro/outro bounds, cycle/step conversion, backward seeking and distinct recording grids.
- Simulated player checks: play/pause, buffering, restart, seek, track changes, native controls, playback-rate changes, passage end, practice mode and leaving the dance.
- Real iframe checks: both selected recordings load and play; reported video time agrees with dance position; pausing freezes the position; track switching does not leave invalid/stale time.
- Layout checks: 1280, 390 and 320 px wide viewports; no page overflow; player minimum size retained.

API reference: https://developers.google.com/youtube/iframe_api_reference
