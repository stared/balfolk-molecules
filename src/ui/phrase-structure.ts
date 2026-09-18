import type { Dance } from '../model.ts';
import { phraseBeats, phraseSpans } from '../engine/phrase-structure.ts';
import { musicalBeatsPerPhrase } from '../engine/timeline.ts';
import { $ } from './dom.ts';

/** Static phrase boundaries share the scrubber's exact horizontal scale. */
export function createPhraseStructure(seek: (time: number) => void) {
  const panel = $('#phrase-structure');
  const score = $('#phrase-score');
  let buttons: HTMLButtonElement[] = [];
  let wasDisabled = false;
  const measure = document.createElement('canvas').getContext('2d')!;
  const fitLabels = () => {
    const fitRow = (selector: string): number => {
      let size = 12;
      for (const button of buttons.filter(button => button.matches(selector))) {
        const style = getComputedStyle(button);
        measure.font = `12px ${style.fontFamily}`;
        const width = measure.measureText(button.textContent ?? '').width;
        const available = score.clientWidth * parseFloat(button.style.width) / 100 - 4;
        size = Math.min(size, 12 * Math.max(0, available) / width);
      }
      return size;
    };
    const detailSize = fitRow('.phrase-action');
    // A level is complete or absent: never blank out individual labels.
    const compact = detailSize < 8;
    score.classList.toggle('phrase-overview', compact);
    document.body.classList.toggle('phrase-overview', compact);
    const sectionSize = fitRow('.phrase-section');
    const groupSize = fitRow('.phrase-group');
    for (const button of buttons) button.style.fontSize =
      `${button.matches('.phrase-action') ? Math.max(8, detailSize) : button.matches('.phrase-group') ? groupSize : sectionSize}px`;
  };
  new ResizeObserver(fitLabels).observe($('#timeline-scroll'));
  return {
    setup(dance: Dance) {
      buttons = []; wasDisabled = false;
      score.replaceChildren();
      panel.hidden = !dance.structure;
      document.body.classList.toggle('has-structure', !!dance.structure);
      $('#timeline').style.minWidth = '';
      if (!dance.structure) return;
      // Nested scores expose figure, movement and action; Bourrée groups repeats.
      const nested = dance.id === 'chapelloise' || dance.id === 'drumul-dracului';
      const grouped = dance.id === 'bourree' || nested;
      const offset = grouped ? 24 : 0;
      score.classList.toggle('phrase-grouped', grouped);
      document.body.classList.toggle('phrase-grouped', grouped);
      const total = phraseBeats(dance.structure.phrase);
      const beatsPerPhrase = musicalBeatsPerPhrase(dance);
      const spans = phraseSpans(dance.structure.phrase);
      const groups = nested ? spans.filter(span => span.depth === 1) : dance.sections.map(section => ({name:section.name,start:section.start*beatsPerPhrase,beats:section.duration*beatsPerPhrase,detail:section.detail}));
      const motifDepth = nested ? 2 : 1;
      const motifs = spans.filter(span => span.depth === motifDepth);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('phrase-edges');
      svg.setAttribute('viewBox', `0 0 1000 ${64 + offset}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      const drawn = new Set<string>();
      const edge = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        const key = [x1,y1,x2,y2].join(',');
        if (drawn.has(key)) return;
        drawn.add(key);
        const line = document.createElementNS(svg.namespaceURI, 'line');
        for (const [key, value] of Object.entries({x1,y1:y1+offset,x2,y2:y2+offset})) line.setAttribute(key, String(value));
        if (y1 === 32 || y1 === 38 || y1 === 59) line.classList.add('phrase-detail-edge');
        if (y1 === 64 && y2 === 64) line.classList.add('phrase-baseline');
        line.setAttribute('stroke', color);
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.append(line);
      };
      // Draw each shared edge once. Labels never change the beat geometry.
      edge(0, 64, 1000, 64, '#b6b8c1');
      const palette = ['#747aac', '#a17496', '#73899a', '#8b819e'];
      const motifColors = new Map<string, string>();
      const sectionColors = new Map<number, string>();
      const bracket = (start: number, end: number, top: number, color: string) => {
        edge(start, top, end, top, color);
        edge(start, top, start, top + 6, color);
        edge(end, top, end, top + 6, color);
      };
      if (grouped) for (const [index, group] of groups.entries()) {
        const start = group.start / total;
        const width = group.beats / total;
        const color = palette[index % palette.length]!;
        bracket(start * 1000, (start + width) * 1000, 8 - offset, color);
        const label = document.createElement('button');
        label.type = 'button'; label.className = 'phrase-group';
        label.style.left = `${start * 100}%`; label.style.width = `${width * 100}%`;
        label.style.color = color; label.textContent = group.name;
        label.title = group.detail;
        label.addEventListener('click', () => seek(group.start / beatsPerPhrase));
        score.append(label); buttons.push(label);
      }
      for (const section of motifs) {
        if (!motifColors.has(section.name)) motifColors.set(section.name, palette[motifColors.size % palette.length]!);
        const color = nested ? palette[groups.findIndex(group => section.start >= group.start && section.start < group.start+group.beats) % palette.length]! : motifColors.get(section.name)!;
        sectionColors.set(section.start, color);
        const start = section.start / total, end = (section.start + section.beats) / total;
        bracket(start * 1000, end * 1000, 8, color);
        const label = document.createElement('button');
        label.type = 'button'; label.className = 'phrase-section';
        label.style.left = `${start * 100}%`; label.style.width = `${(end-start) * 100}%`;
        label.textContent = section.name;
        label.style.color = color;
        label.title = section.detail;
        label.addEventListener('click', () => seek(section.start / beatsPerPhrase));
        score.append(label); buttons.push(label);
      }
      for (const span of spans.filter(span => span.depth === motifDepth + 1)) {
        const x = span.start / total;
        const parent = motifs.find(motif => span.start >= motif.start && span.start < motif.start + motif.beats)!;
        bracket(x * 1000, (span.start + span.beats) / total * 1000, 32, sectionColors.get(parent.start)!);
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
      // Fit complete labelled tiers to the same beat axis, without scrolling.
      fitLabels();
      $('#timeline-scroll').scrollLeft = 0;

    },
    render(_time: number, disabled: boolean) {
      if (disabled === wasDisabled) return;
      for (const button of buttons) button.disabled = disabled;
      wasDisabled = disabled;
    },
  };
}
