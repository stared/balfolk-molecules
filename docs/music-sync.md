# Bourrée music prototype

Two user-selected YouTube recordings are available below the full-width dance timeline, to the right of the controls and dance notes. No audio, video, player credentials or downloaded analysis files are shipped.

| Recording | Video | Measured main pulse | Selected start | Selected end | Dance cycles |
| --- | --- | --- | --- | --- | --- |
| Accordzéâm — Allez, bourrés | AE2tuIaFmTA | approximately 135 BPM | 40.540 s | 211.207 s | 6 |
| AedO — Experior (Remix) | 7pzXyRLWiuc | approximately 150 BPM | 25.980 s | 230.780 s | 8 |

These are selected practice passages, not full-song transcriptions. The player opens at the selected dance passage. Main Play seeks to the exact first mapped beat if the player is before it, instead of playing an unanimated opening. Native controls can still seek into earlier material, where the dance remains held. Restart seeks to the first dance phrase. Playback pauses at the selected passage end. Selecting No music allows independent practice; selecting a recording always synchronizes the dance.

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

## Hanter-dro and An dro

The recording catalogue is keyed by dance. Each dance remembers its selected recording (including No music) while navigating within the page. A music selection always drives that dance's clock; the same transport controls apply to every supported dance.

| Dance | Recording | Pulse | Selected start | Selected end | Dance cycles |
| --- | --- | --- | --- | --- | --- |
| Hanter-dro | [Valentin Barray — Hanter Dro](https://www.youtube.com/watch?v=RUpWyj8LFcE) | Variable, nominal 167 BPM | 0.920 s | 191.220 s | 44 |
| Hanter-dro | [ba.fnu — Hanter dro](https://www.youtube.com/watch?v=iMQLYCar4WI) | 80 BPM | 25.280 s | 295.280 s | 30 |
| An dro | [Battlefield Band — The Devil’s Courtship / An Dro](https://www.youtube.com/watch?v=sVui_IvFjyQ) | Variable, nominal 100 BPM | 101.340 s | 217.940 s | 12 |

Barray's own upload identifies the piano piece as a composition from *Mirages*. The ba.fnu upload credits ba.fnu, Yann-Fañch Kemener and guests, from *YFK~2016*. The An dro upload names Battlefield Band and links the combined song/tune title; [Alan Reid's catalogue](https://www.alansongsreid.com/lyrics) independently credits the song and traditional An Dro arrangement separately.

### Timing checks

Hanter-dro uses three dance counts per basic step, with contacts on 1, &, 2, 3. Four basic steps occupy the visualization's 12-count cycle. Audio trackers can choose different metrical levels; their output must not automatically be halved. The count-to-movement interpretation is checked separately for each recording.

For Barray, successive measured pulses are used as dance counts, starting at 0.92 s. The typical interval is approximately 0.36 s (median 166.67 BPM), and a three-count pattern takes about 1.1 s. Early four-pattern boundaries are at 5.30 and 9.68 s. The map retains all pulses from the librosa track; nearby neural onset estimates within 60 ms refine their timestamps, and otherwise a 15 ms onset-latency correction is applied. The neural track's half-tempo interpretation is not used to choose which pulses to keep. All intervals remain between 0.25 and 0.5 s, preserving tempo changes without skipped counts. The selected passage contains 44 complete visualization cycles and stops before the uncertain closing cadence.

For ba.fnu, the opening sustained texture precedes the main rhythmic entry around 25.28 s. Fitting the subdivision pulse over 26–295 s gave 0.37500138 s, or 79.9997 quarter notes per minute. The preset uses 80 BPM. Neural detections near 25.26, 26.02, 26.78 and 27.52 s corroborate the quarter-note spacing and entry; the final selected cycle ends before the breakdown/outro around 297 s.

For Battlefield Band, the early opening has ambiguous beat/subdivision detections. The selected later passage begins at the independently detected downbeat at 101.34 s; subsequent 16-beat boundaries include 111.40 and 121.34 s. Its measured quarter-note intervals vary around 0.58–0.66 s, so a constant grid would drift. All 192 intervals in the selected passage are continuous, without inserted beats or subdivision changes. Downbeat estimates disagree by two quarter notes in some later sections (around 131–141 and 208–218 s); the map preserves the continuous pulse rather than inventing a jump. The chosen entry is a computationally supported practice boundary, not a confirmed transcription of exactly where the medley's named An Dro tune begins. Full compositional phrase alignment in those later sections remains uncertain.

The BPM readout is nominal for variable-tempo recordings; animation follows the measured timestamps. These checks are computational, not an ear-verified score transcription. All media and analysis dependencies remain outside the app and repository.


### Barray count-rate interpretation — unresolved

Review status, 18 September: the user still reports an incompatible tempo after the faster mapping below. It remains a hypothesis, not a confirmed correction. Clock-consistency tests and spectral accent measurements do not independently establish which pulse carries a dance count. No further rate or phase change was made in this review.

The original implementation kept alternate detected pulses and labelled the result 83 BPM. A later change shifted its start from 0.92 to 2.38 s, but still used that half-speed grid. Both choices were superseded after the user identified the remaining speed mismatch.

The expanded audit measures positive spectral changes in the 35–300 Hz band around **every** fast pulse (4096-sample windows, 110-sample hop, 22050 Hz). It compares all six phases of the old three-count cycle. There are two quieter closing phases, at fast-pulse indices 2 and 5, rather than only one. Over 54–95 s, mean strengths at the three fast phases were approximately 70, 53 and 21; over 100–140 s, 69, 52 and 19; over 140–167 s, 101, 60 and 28. The third fast phase remains quieter in the opening and final tested passages as well. The previous alternate-pulse analysis concealed every second closing phase.

The corrected mapping uses three fast pulses per movement pattern, restores the start to 0.92 s, and retains the original performance speed. For example, the first close occurs at 1.64 s, the next first travelling step at 2.01 s, and the next close at 2.759 s. Regression checks require a full pattern to take approximately 1.1 s at several points in the performance; merely testing the iframe clock against the configured map would not catch this mistake.

This interpretation combines the user's dance feedback with the expanded computational accent audit. The composer's score listing was found, but the notation itself was not accessible; no claim of score-based or manually listened-through validation is made.

## Drumul Dracului

| Recording | Selected start | Selected end | 64-count cycles | Tempo in selected passage |
| --- | --- | --- | --- | --- |
| [Żniwa — Drumul Draculi](https://www.youtube.com/watch?v=jwQukZnz4BQ) | 0.440 s | 154.200 s | 6 | approximately 119–160 BPM |
| [Stary Olsa — Drumul Draculi](https://www.youtube.com/watch?v=qXdZO2gc_uw) | 44.860 s | 217.260 s | 5 | approximately 81–125 BPM |

The supplied artist uploads identify these as tracks from *Dwa Żywioły* and *Drygula*, respectively. Only beat timestamps are shipped. The dance uses one count per travel step/stamp, four counts per timeline phrase and 64 counts per complete cycle. Neither map uses a fixed BPM, and the displayed tempo follows the current four-count block, including after a seek or native playback-rate change.

Żniwa's neural beat detections change to half-tempo in later passages. Intervals close to twice the preceding local period were split to maintain the accelerating pulse, giving 384 intervals and a final cadence at 154.20 s. Intermediate estimates are interpolated, not claimed as independently observed footfall accents. Checkpoints at counts 0, 64, 128, 192, 256, 320 and 384 are 0.44, 30.86, 57.24, 82.18, 106.66, 130.56 and 154.20 s. A separate onset tracker corroborates the overall tempo increase but introduces count/phase differences, so it is not blindly averaged with this map.

For Stary Olsa, the opening has irregular and duplicate detections. The selected regular passage starts at 44.86 s. A variable-tempo onset tracker follows the locally estimated pulse; neural timestamps within 55 ms refine its detections, with a 15 ms onset-latency correction otherwise. The selected five complete cycles stop at 217.26 s. The final acceleration after this boundary and closing material remain outside the synchronized practice passage; this is not a full-track transcription.

For an additional phase check, chroma contours were sampled four times per dance count and compared across neighbouring 16-count phrases. Among candidate offsets 0–15, offset zero gave the strongest average agreement in both maps (approximately 0.53 for Żniwa and 0.61 for Stary Olsa). This supports the selected repeating phrase origin separately from the pulse rate, without claiming a manually listened-through score annotation.

Checks cover 64-count conversion, complete-cycle endpoints, increasing local tempo, backward seeks and both real YouTube players. Choreography tests separately cover closed-ring hand connections, every stamp/hold, support continuity and full coverage of all three structure tiers. These validate different things; player-clock agreement alone does not validate musical phrasing.

### Żniwa figure phase

The selected Żniwa map starts at dance count 32 (Crossing), then reaches Travel after 32 recorded beats at 15.92 s. This changes figure assignment only: the media timestamps, tempo curve and 64-count cycle length stay intact. The user's identification of the more forceful music as Crossing prompted this correction. Spectral comparisons support that reading in most later repetitions: the previously assigned Travel halves generally have stronger high-frequency energy than the following halves. The opening orchestration builds differently, so intensity alone is not treated as proof of choreography.

`danceOffset` belongs to a recording, not to the dance's shared structure. The position-to-time conversion applies its inverse for timeline seeks; when the requested figure would precede the recording, it selects the first available occurrence. Restart returns to the recording's selected opening figure. Stary Olsa retains its existing figure phase.
