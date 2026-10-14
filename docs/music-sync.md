# Music synchronization

The [24 September movement review](movement-review.md) checks stamp/hold rendering against both existing Drumul maps and provides an experimental schottische comparison page. It changes visual cues, not recording timestamps or count-rate interpretations. The [recording shortlist](recording-shortlist.md) distinguishes practice candidates from synchronized presets.

All eleven dances have recordings. The October expansion below adds sixteen choices; older mapping notes remain relevant to the original recordings. `tests/data-consistency.test.ts` checks that every map is increasing, belongs to a dance, has a nominal BPM within 3% of its median interval, and is flagged `variableTempo` exactly when its four-count tempo varies by more than 2%.

## Bourrée bancale

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

Barray and Battlefield Band are flagged `variableTempo`, like the Drumul recordings: the BPM readout follows the current four-count block (157–179 and 94–103 BPM respectively) and the animation follows the measured timestamps. `bpm` is only the nominal median. These checks are computational, not an ear-verified score transcription. All media and analysis dependencies remain outside the app and repository.


### The two Hanter-dro maps disagree — unresolved

The maps assign different metrical levels to a dance count. Barray: 167 counts per minute, one three-count step pattern in about 1.1 s. ba.fnu: 80 counts per minute, one pattern in 2.25 s; its measured 0.375 s pulse is treated as a subdivision, whereas Barray's 0.36 s pulse is treated as the count itself. The practice default is 90, and Barray's original mapping was 83. Both cannot be right for the same dance unless one performance is danced at twice the rate, which nobody has claimed. Barray's accent strengths (about 70, 53, 21 over three fast pulses) show that pulses group in threes; they do not say whether a count is one, two or three pulses. This needs a dancer's ear on both recordings, not another computational pass.

### Barray count-rate interpretation — unresolved

Review status, 18 September: the user still reports an incompatible tempo after the faster mapping below. It remains a hypothesis, not a confirmed correction. Clock-consistency tests and spectral accent measurements do not independently establish which pulse carries a dance count. No further rate or phase change was made in this review.

The original implementation kept alternate detected pulses and labelled the result 83 BPM. A later change shifted its start from 0.92 to 2.38 s, but still used that half-speed grid. Both choices were superseded after the user identified the remaining speed mismatch.

The expanded audit measures positive spectral changes in the 35–300 Hz band around **every** fast pulse (4096-sample windows, 110-sample hop, 22050 Hz). It compares all six phases of the old three-count cycle. There are two quieter closing phases, at fast-pulse indices 2 and 5, rather than only one. Over 54–95 s, mean strengths at the three fast phases were approximately 70, 53 and 21; over 100–140 s, 69, 52 and 19; over 140–167 s, 101, 60 and 28. The third fast phase remains quieter in the opening and final tested passages as well. The previous alternate-pulse analysis concealed every second closing phase.

The corrected mapping uses three fast pulses per movement pattern, restores the start to 0.92 s, and retains the original performance speed. For example, the first close occurs at 1.64 s, the next first travelling step at 2.01 s, and the next close at 2.759 s. Regression checks require a full pattern to take approximately 1.1 s at several points in the performance; merely testing the iframe clock against the configured map would not catch this mistake.

This interpretation combines the user's dance feedback with the expanded computational accent audit. The composer's score listing was found, but the notation itself was not accessible; no claim of score-based or manually listened-through validation is made.

## Drumul Dracului

| Recording | Selected start | Selected end | 64-count cycles | Tempo in selected passage |
| --- | --- | --- | --- | --- |
| [Żniwa — Drumul Draculi](https://www.youtube.com/watch?v=jwQukZnz4BQ) | 15.920 s | 142.280 s | 5 | approximately 124–167 BPM |
| [Stary Olsa — Drumul Draculi](https://www.youtube.com/watch?v=qXdZO2gc_uw) | 44.860 s | 217.260 s | 5 | approximately 81–125 BPM |

The supplied artist uploads identify these as tracks from *Dwa Żywioły* and *Drygula*, respectively. Only beat timestamps are shipped. The dance uses one count per travel step/stamp, four counts per timeline phrase and 64 counts per complete cycle. Neither map uses a fixed BPM, and the displayed tempo follows the current four-count block, including after a seek or native playback-rate change.

Żniwa's neural beat detections change to half-tempo in later passages. Intervals close to twice the preceding local period were split to maintain the accelerating pulse, giving 384 intervals and a final cadence at 154.20 s. Intermediate estimates are interpolated, not claimed as independently observed footfall accents. Checkpoints at counts 0, 64, 128, 192, 256, 320 and 384 are 0.44, 30.86, 57.24, 82.18, 106.66, 130.56 and 154.20 s. A separate onset tracker corroborates the overall tempo increase but introduces count/phase differences, so it is not blindly averaged with this map.

For Stary Olsa, the opening has irregular and duplicate detections. The selected regular passage starts at 44.86 s. A variable-tempo onset tracker follows the locally estimated pulse; neural timestamps within 55 ms refine its detections, with a 15 ms onset-latency correction otherwise. The selected five complete cycles stop at 217.26 s. The resulting map is effectively five constant-tempo segments rather than a continuous curve: linear fits give 80.0, 94.1, 100.0, 106.1 and 126.0 BPM, with changes near counts 28–32, 64, 96 and 128, and residuals of about 8 ms RMS, close to the rounding noise of its 20 ms timestamps. The round values suggest a click-tracked recording. The first change, at counts 28–32, is the only one off a 16-count boundary and is the least trustworthy stretch. The final acceleration after this boundary and closing material remain outside the synchronized practice passage; this is not a full-track transcription.

For an additional phase check, chroma contours were sampled four times per dance count and compared across neighbouring 16-count phrases. Among candidate offsets 0–15, offset zero gave the strongest average agreement in both maps (approximately 0.53 for Żniwa and 0.61 for Stary Olsa). This supports the selected repeating phrase origin separately from the pulse rate, without claiming a manually listened-through score annotation.

Checks cover 64-count conversion, complete-cycle endpoints, increasing local tempo, backward seeks and both real YouTube players. Choreography tests separately cover closed-ring hand connections, every stamp/hold, support continuity and full coverage of all three structure tiers. These validate different things; player-clock agreement alone does not validate musical phrasing.

### Żniwa figure phase

The original Żniwa practice passage opened at 0.44 s with a 32-count figure offset, so choosing Drumul opened on Crossing rather than the first Travel figure. The practice passage now starts at the first aligned Travel, **15.92 s**, with no offset. It contains five complete cycles and ends at **142.28 s**. Opening, Restart and clicking the first Travel figure all use this entry. The underlying measured timestamps are retained unchanged; only the selected passage is trimmed.

The established musical phase is preserved: Crossing still begins at 30.86 s, followed by Travel at the same subsequent recording times as before. The earlier figure assignment was informed by the user's identification of forceful material as Crossing; spectral intensity alone does not establish choreography. The full 0.44–154.20 s measurement map and its checkpoints described above remain the source data, not the current selected practice passage.

`danceOffset` belongs to a recording, not to the dance's shared structure. The position-to-time conversion applies its inverse for timeline seeks; when the requested figure would precede the recording, it selects the first available occurrence. Restart returns to the recording's selected opening figure. Both current Drumul practice passages start on Travel; Stary Olsa is unchanged.

## Timestamp precision

Żniwa, Stary Olsa and Battlefield Band timestamps lie on a 20 ms grid (the beat model's frame rate); that is about 5% of one interval at Żniwa's fastest tempo, so single intervals are noisy even where the tempo is steady. Barray mixes 20 ms values with millisecond onset refinements (43% of its stamps). In the Żniwa map 220 of 383 neighbouring interval pairs are equal: beats interpolated across half-tempo detections are not marked and cannot be told from observed ones. Re-measuring would need the audio, which is deliberately not kept. The former `passage` captions were removed from the data: they were never displayed and are exactly the first and last entries of `beats`.

## Repertoire expansion, 13 October 2026

Sixteen additions bring the catalogue to 23 recordings. The requested **ba.fnu & Yann-Fañch Kemener — Scottish (YFK~2016)** is the first schottische choice. Existing dance movement and rendering are unchanged by this expansion. Only timing metadata is bundled.

| Dance | Added recording | Counts/min (nominal) | Passage (seconds) | Complete cycles |
| --- | --- | --- | --- | --- |
| Bourrée bancale | [Balsam — Modelina’s Advice / Mitora](https://www.youtube.com/watch?v=CtXFR4k0hCg) | 120.3 | 32.940–255.740 | 7 |
| Chapelloise | [Accordzéâm — Jopelloise](https://www.youtube.com/watch?v=WRsnS1X_giw) | 130 | 1.715–238.023 | 16 |
| Chapelloise | [ba.fnu feat. Beat Bouet Trio — Jsem já synek](https://www.youtube.com/watch?v=NqeNjJuqVLQ) | 110 | 20.610–177.701 | 9 |
| Cercle circassien | [Accordzéâm — Starwars](https://www.youtube.com/watch?v=JsT6Mz4lbEY) | 136.3 | 0.340–85.500 | 3 |
| Branle de Noirmoutier | [Bargainatt — Branle des chevaliers](https://www.youtube.com/watch?v=n6ryuNSjmHo) | 132.3 | 0.780–246.800 | 17 |
| Waltz | [AedO — Lora Luna](https://www.youtube.com/watch?v=WdZhlntuf3s) | 151.3 | 2.820–59.900 | 24 |
| Waltz | [Balsam — Po powrocie do domu](https://www.youtube.com/watch?v=9X1NAyDcNlw) | 155.5 | 5.960–174.320 | 73 |
| Schottische | [ba.fnu & Yann-Fañch Kemener — Scottish (YFK~2016)](https://www.youtube.com/watch?v=NJUhZDllgc0) | 95 | 41.951–294.582 | 50 |
| Schottische | [Accordzéâm — Jottish](https://www.youtube.com/watch?v=Xr9g4gRTl7c) | 96.8 | 0.860–60.440 | 12 |
| Schottische | [Folk Knock — Dina and her musical house / Thanks, Pien!](https://www.youtube.com/watch?v=8ehWd9yc1k0) | 102.8 | 151.940–263.800 | 24 |
| Mazurka | [Naragonia — Alio (Tandem)](https://www.youtube.com/watch?v=_Zj8kWGUxp0) | 125.4 | 1.440–179.220 | 31 |
| Mazurka | [Folk Knock — Šapito perdu](https://www.youtube.com/watch?v=DLb8aH3CSAY) | 110.2 | 0.420–273.480 | 42 |
| Hanter-dro | [Naragonia — Calimero](https://www.youtube.com/watch?v=t9A3Gqhr7sw) | 89.1 | 0.440–170.300 | 21 |
| Hanter-dro | [Folk Knock — Noctivagate](https://www.youtube.com/watch?v=9eSaBX8N58o) | 81.9 | 0.420–202.360 | 23 |
| An dro | [Żniwa — Burning Andro](https://www.youtube.com/watch?v=nsaP4H9ryyk) | 132 | 0.298–203.934 | 28 |
| Tzadik Katamar | [Bill Woodgate — Tzadik Katamar](https://www.youtube.com/watch?v=DTiK8DishCM) | 108.3 | 10.120–89.900 | 3 |

### How the maps were checked

The [retained analysis](../research/music-analysis/sync-2026-10/) covers 23 exact source files (including rejected and alternate uploads) and contains source URLs, media hashes, two full-recording beat/downbeat detection runs, selected observations, mapping decisions and numerical checks. Temporary audio was decoded at 22050 Hz. Beat This `final0` and `small0` provide two model configurations, **not independent human annotations**. Librosa onset tracking, separate spectral bands, chroma repetition, forward/backward pulse tracking and actual browser playback provide different checks. The full recordings were examined computationally; this is not a claim of listening through or dancing every song.

1. Establish the dance's metrical level before counting. Schottische has eight main counts per full pattern; a waltz turn has six; this mazurka has twelve. Hanter-dro has three counts per basic step, including its intervening `&` contact. An onset peak is not automatically a new dance count.
2. Compare half, main and double pulse interpretations. Raw detections contained extra subdivisions in Alio around 119–123 s, Calimero around 30–39 s and later passages, and Noctivagate around 57 s and later passages. Very short duplicate events also occurred in Branle des chevaliers and Tzadik. Feeding those arrays directly to the app would introduce extra steps.
3. Follow candidate observations in both directions with a local period estimate. Every retained variable map returns the same count in reverse. Forward/backward timestamp disagreements are at most 60 ms except the alternate Lora Luna performance (100 ms). No missing timestamp is silently inserted by this tracker: an unsupported gap rejects the passage.
4. For variable recordings, preserve measured bar anchors and interpolate intermediate counts with a monotone cubic curve. This removes most 20 ms detector quantization from the animation's speed without forcing an entire performance to constant BPM. The 95th-percentile adjustment from chosen observations is about 15–22 ms in the shipped maps. The app still interpolates between successive counts; these are not measured footfall times.
5. Independently check longer musical patterns. Chroma comparisons support 64-count repetition in Starwars and Balsam's bourrée, 32 in Branle des chevaliers, and 48 in Tzadik. A repeated pattern establishes cycle length more readily than the exact first figure. For ordinary couple dances the entry is a supported bar boundary, not a claim that musicians prescribe a particular improvised movement.
6. Test the player separately. Video metadata claiming embeddability is insufficient: actual iframe playback rejected several original candidates. Player-clock tests prove the implementation follows its map; they do not independently prove the map's musical interpretation.

### Entries and limitations

- **Scottish, YFK~2016:** 95 BPM, with the practice passage starting at 41.95081 s after the irregular opening. Fitting the pulse and checking six separate 45-second windows supports a constant grid. Every selected main count is within 60 ms of at least one model; the per-window 90th-percentile discrepancy is at most 28 ms. The early models often follow subdivisions, so their individual event arrays are unsuitable as dance clocks. Fifty complete eight-count patterns end at 294.582 s. The first four counts drive sideways travel and the next four drive turning; strong sound alone does not add a stamp or change that pattern.
- **Jopelloise, Jsem já synek and Burning Andro:** stable grids at 130, 110 and 132 counts/minute respectively. Every selected count is corroborated within 60 ms by at least one model across separate time windows. Jopelloise begins at its first clear downbeat; Synek starts at the fuller rhythmic entry around 20.61 s, after its introduction. Chroma evidence for the exact 32-count figure origin in Synek is weaker than its pulse evidence; that interpretation remains open to dancer review.
- **Alio:** the selected version is *Tandem*, approximately 194 seconds, not the earlier 179-second Boom bal analysis. A measured map follows its tempo variation and removes the temporary detector subdivision switch. A constant 125 BPM grid would drift.
- **Folk Knock:** Noctivagate follows approximately 82 main counts/minute, not its approximately 164 subdivisions. Šapito perdu follows its changing three-count meter. Dina… / Thanks, Pien! uses the later passage starting at 151.94 s, where both models support the main count and bar phase; the ambiguous early detection changes are outside this preset.
- **Balsam:** Modelina’s Advice / Mitora starts at 32.94 s, the next 64-count boundary after the incomplete opening detections. Po powrocie do domu uses a continuous six-count waltz passage ending at 174.32 s; the uncertain later detections and ending are excluded. Both retain performance tempo changes.
- **Jottish:** twelve complete patterns in the opening passage. The full upload changes tempo substantially later (roughly 97 to 115, then slower again); treating the entire recording as 97 BPM fails. Later transitions are not part of this preset.
- **Starwars:** three 64-count cycles, ending at 85.50 s. A later break around 115.6 s and subsequent tempo changes are outside the selected passage. The earlier breakpoint estimate from a coarse window was superseded by direct timestamp inspection.
- **Lora Luna:** the originally analysed AEDO upload rejected embedding. The playable Mathias Bynens upload is a different performance, so its map was measured again, not shifted from the first recording. The selected 2.82–59.90 s passage contains 24 waltz turns. Later model gaps are unresolved; no full-track synchronization is claimed.
- **Tzadik:** three complete cycles begin at 10.12 s in the playable upload credited to Bill Woodgate. The [written melody](https://ifdo.ca/~seymour/midipage/tzadick_katamar.pdf) supplies an opening motif; testing all 48 possible count origins and twelve transpositions ranks this origin highest. The [dance notation](https://www.imber.com.au/ifd/dance_steps/tzadik_katamar.pdf) supports 16 walk/sway counts followed by the repeated 16-count second figure. The earlier Effi Netzer upload has a corresponding entry at 10.36 s but rejects embedding. Its map must not be reused unchanged. The chosen upload's artist credit is retained rather than attributing it to the choreographer.
- **Branle des chevaliers:** the 32-count musical repetition and continuous pulse support the preset. They do not independently establish every detail of the animation's specific Noirmoutier variant or its opposite-front phase.

These are practice passages with explicit computational support and remaining interpretation limits. No automatic accent-to-stamp mapping was added: bass, melody, accompaniment and actual dancer weight transfer are different signals. The existing unresolved Barray count-rate issue above is not resolved by adding Calimero and Noctivagate.

### Candidates not shipped

**Café Coiffeur** has a usable measured pulse map, but its available artist upload returned YouTube error 150 in the app. It is retained in the analysis, not offered as a broken preset.

**Zabili** was analysed from ba.fnu's public Bandcamp stream. Its 95 BPM pulse is supported through a candidate passage around 6.98–348.03 s. The later ending needs separate handling. No compatible YouTube recording was found; Mazurská is a different song and is not a substitute. An expiring Bandcamp media URL is not a stable app source, and the current player has no Bandcamp synchronization API. The [artist's track page](https://bafnu.bandcamp.com/track/zabili-mazurka) remains the listening source.

### Reproducing and reviewing

`sync-2026-10/build_maps.py` regenerates `src/music/repertoire-beats.ts` and `audit.json` from the retained `detections.json` using NumPy and SciPy. For example: `uv run --with numpy --with scipy python research/music-analysis/sync-2026-10/build_maps.py`. It fails on unsupported pulse gaps or inconsistent forward/backward counts. The audit also retains maps for rejected playback sources; those are deliberately excluded from the TypeScript output.

Full remeasurement requires temporary exact-source media named by the keys in `sources.json`, FFmpeg, librosa, Beat This and the two model checkpoints. `features.py` and `neural.py` use `BALFOLK_SYNC_WORK` (default `/tmp/balfolk-sync`); `FFMPEG_BINARY` selects FFmpeg. They produce spectral/chroma features and raw model results. `gridcheck.py`, `structure.py` and `score_phase.py` rerun the independent comparisons from those temporary features. Audio, checkpoints and analysis dependencies are not app dependencies or committed assets.

Browser scripts accept `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE` and `REVIEW_ORIGIN`. The simulated transport checks cover all 23 recordings, forward/backward seeking, restart, pause, playback rate, passage end, No music and finite rendered geometry. Real playback results record the rejected candidates as well as the final playable replacements. This is separate from the source-audio analysis.

Final verification: `pnpm test` passes all 126 tests; `pnpm build` passes. Simulated transport checks cover 138 seek positions across all 23 catalogue recordings. All sixteen new selections reached the playing state in the real iframe; an additional 21 real paused seeks across YFK Scottish, Alio, Starwars and Tzadik agreed with the app clock, including late passages and backward seeks. Seek checks wait for YouTube to report its new position instead of assuming a fixed buffering delay. Desktop, 390 px and 320 px layouts were checked without page overflow. These results are retained in `browser-playback.json`, `browser-transport.json` and `browser-late.json`.

## Mazurská

[ba.fnu — Mazurská](https://www.youtube.com/watch?v=OkT2h14eO6A), from *10 . Refused . Reduced* (2019), is now an additional mazurka preset, bringing the catalogue to 24 recordings.

The exact upload has a stable **114 BPM** pulse. The selected fuller entry is **24.294303 s**; 39 complete twelve-count animation cycles end at **270.610092 s**, before the uncertain closing material. A tempo search over 110–118 BPM selects 114, and both models strongly favour the same three-count bar phase. The grid agrees within 60 ms with at least one beat model for 465 of 469 timestamps; the 95th-percentile discrepancy is 20.4 ms.

At four counts around 86.93–89.03 s, both models temporarily follow offbeats. Nearby spectral flux peaks and the unchanged grid phase before and after that passage support retaining the continuous pulse. These four timestamps are inferred from the stable grid, not independently observed by the beat models; one nearby flux peak is 70 ms early. `mazurska_check.py` reproduces the tempo search and writes these exceptions to `mazurska-validation.json`. `gridcheck.py` also checks separate time windows. No gesture or stamp is inferred simply from a loud audio attack.

Mazurská verification: the real iframe played successfully and seven paused seeks at 25, 87, 89, 140, 250, 269 and 30 seconds agreed with the dance clock. Results are in `mazurska-browser.json`. The reusable `browser-late.mjs` now accepts `SYNC_CASES` as a JSON array of `[danceId, videoId, seconds[]]`. All 126 tests and the production build pass.
