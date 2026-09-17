import type { Dance } from '../model.ts';
import { phraseBeats, phraseSpans, phraseRepeats } from '../engine/phrase-structure.ts';
import { musicalBeatsPerPhrase } from '../engine/timeline.ts';
import { $ } from './dom.ts';

/** Static phrase boundaries share the scrubber's exact horizontal scale. */
export function createPhraseStructure(seek: (time: number) => void) {
  const panel = $('#phrase-structure');
  const score = $('#phrase-score');
  let buttons: HTMLButtonElement[] = [];
  let wasDisabled = false;
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = '12px system-ui';
  const fitLabels = () => {
    for (const button of buttons) button.classList.toggle('phrase-label-tight',
      measure.measureText(button.textContent ?? '').width + 8 > button.clientWidth);
  };
  new ResizeObserver(fitLabels).observe(score);
  return {
    setup(dance: Dance) {
      buttons = []; wasDisabled = false;
      score.replaceChildren();
      panel.hidden = !dance.structure;
      document.body.classList.toggle('has-structure', !!dance.structure);
      $('#timeline').style.minWidth = '';
      if (!dance.structure) return;
      const total = phraseBeats(dance.structure.phrase);
      const beatsPerPhrase = musicalBeatsPerPhrase(dance);
      const spans = phraseSpans(dance.structure.phrase);
      const motifs = spans.filter(span => span.depth === 1);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('phrase-edges');
      svg.setAttribute('viewBox', '0 0 1000 64');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      const drawn = new Set<string>();
      const edge = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        const key = [x1,y1,x2,y2].join(',');
        if (drawn.has(key)) return;
        drawn.add(key);
        const line = document.createElementNS(svg.namespaceURI, 'line');
        for (const [key, value] of Object.entries({x1,y1,x2,y2})) line.setAttribute(key, String(value));
        line.setAttribute('stroke', color);
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.append(line);
      };
      // Draw each shared edge once. Labels never change the beat geometry.
      edge(0, 64, 1000, 64, '#b6b8c1');
      const palette = ['#747aac', '#a17496', '#73899a', '#8b819e'];
      const motifColors = new Map<string, string>();
      const bracket = (start: number, end: number, top: number, color: string) => {
        edge(start, top, end, top, color);
        edge(start, top, start, top + 6, color);
        edge(end, top, end, top + 6, color);
      };
      for (const section of motifs) {
        if (!motifColors.has(section.name)) motifColors.set(section.name, palette[motifColors.size % palette.length]!);
        const color = motifColors.get(section.name)!;
        const start = section.start / total, end = (section.start + section.beats) / total;
        bracket(start * 1000, end * 1000, 32, color);
        const label = document.createElement('button');
        label.type = 'button'; label.className = 'phrase-section';
        label.style.left = `${start * 100}%`; label.style.width = `${(end-start) * 100}%`;
        label.textContent = section.name;
        label.style.color = color;
        label.title = section.detail;
        label.addEventListener('click', () => seek(section.start / beatsPerPhrase));
        score.append(label); buttons.push(label);
      }
      for (const repeat of phraseRepeats(dance.structure.phrase).filter(repeat => repeat.depth === 1)) {
        const section = motifs.find(section => section.start === repeat.start);
        const color = motifColors.get(section?.name ?? '') ?? palette[0]!;
        bracket(repeat.start / total * 1000, (repeat.start + repeat.beats) / total * 1000, 0, color);
        const hint = document.createElement('div');
        hint.className = 'phrase-repeat';
        hint.style.left = `${repeat.start / total * 100}%`;
        hint.style.width = `${repeat.beats / total * 100}%`;
        hint.title = `${repeat.name}, repeated ${repeat.times} times`;
        score.append(hint);
      }
      for (const span of spans.filter(span => span.depth === 2)) {
        const x = span.start / total;
        edge(x * 1000, 59, x * 1000, 64, '#b6b8c1');
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'phrase-action';
        button.style.left = `${x * 100}%`; button.style.width = `${span.beats / total * 100}%`;
        button.title = `${span.name}: ${span.beats} beats, starting at ${span.start + 1}. ${span.detail}`;
        button.setAttribute('aria-label', button.title);
        button.textContent = span.name;
        button.dataset.action = span.name.toLowerCase();
        button.addEventListener('click', () => seek(span.start / beatsPerPhrase));
        score.append(button); buttons.push(button);
      }
      score.append(svg);
      // Keep the complete cycle visible. Narrow cells retain boundaries and
      // accessible hover descriptions, rather than squeezing or wrapping text.
      fitLabels();

    },
    render(_time: number, disabled: boolean) {
      if (disabled === wasDisabled) return;
      for (const button of buttons) button.disabled = disabled;
      wasDisabled = disabled;
    },
  };
}
