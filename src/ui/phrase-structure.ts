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
  // Short forms retain the same wording at every occurrence in a tier.
  // A single-letter action is read in the context of its movement above it.
  const shortLabels: Record<string, readonly string[]> = {
    Forward: ['Fwd', 'F'], Backward: ['Back', 'B'], Back: ['B'],
    Grapevine: ['Vine', 'V'],
    Right: ['R'], Left: ['L'], Step: ['S'], Stamps: ['St', 'S'], Stamp: ['St', 'S'],
    Side: ['Sd', 'S'], Close: ['Cl', 'C'], Cross: ['Cr', 'C'], Recover: ['Rec', 'R'],
    Hold: ['H'], Open: ['O'], Walk: ['W'], Sway: ['Sw', 'S'], Turn: ['T'], Hip: ['H'],
    'Lean R': ['Ln R', 'LR'], 'Lean L': ['Ln L', 'LL'], Lean: ['Ln', 'L'],
    Together: ['Tog', 'T'], Apart: ['A'], 'Swap sides': ['Swap', 'Sw'],
    'New partner': ['Partner', 'P'], Settle: ['Set', 'S'], Pass: ['P'], Spring: ['Spr', 'S'],
    Outward: ['Out', 'O'], Return: ['Ret', 'R'], Exchange: ['Exch', 'E'],
    Progression: ['Prog', 'P'], Crossing: ['Cross', 'C'], Travel: ['Trav', 'T'],
    'Left lead': ['L lead', 'L'], 'Right lead': ['R lead', 'R'],
    'Basic step': ['Basic', 'B'], 'In place': ['Place', 'P'],
    Followers: ['Foll', 'F'], Leaders: ['Lead', 'L'], Partners: ['Part', 'P'],
    Promenade: ['Prom', 'P'], Approach: ['Appr', 'A'], Straight: ['Str', 'S'],
    Turning: ['Turn', 'T'], Sideways: ['Side', 'S'], Transfer: ['Trans', 'T'],
    Lower: ['Low', 'L'], Circle: ['Circ', 'C'], Swing: ['Sw', 'S'],
    Lines: ['Ln', 'L'], Meet: ['M'], In: ['I'], Out: ['O'],
    Counterpartners: ['Counterpart', 'Counter', 'C'], Pastourelle: ['Past', 'P'],
    Tiroir: ['Tir', 'T'], Chase: ['Ch', 'C'], Home: ['H'], Play: ['P'], Reunite: ['Reun', 'R'],
  };
  const tooltip = document.createElement('div');
  tooltip.className = 'phrase-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.append(tooltip);
  let touchInspection = false;
  const hideTooltip = () => { tooltip.hidden = true; };
  const showTooltip = (button: HTMLButtonElement) => {
    if (button.disabled) return;
    tooltip.textContent = button.dataset.description!;
    tooltip.hidden = false;
    const cell = button.getBoundingClientRect();
    const bounds = score.getBoundingClientRect();
    const width = tooltip.getBoundingClientRect().width;
    tooltip.style.left = `${Math.max(8, Math.min(innerWidth - width - 8, cell.left + cell.width / 2 - width / 2))}px`;
    tooltip.style.top = `${Math.max(8, bounds.top - tooltip.getBoundingClientRect().height - 6)}px`;
  };
  const targetButton = (target: EventTarget | null) => target instanceof Element
    ? target.closest<HTMLButtonElement>('#phrase-score button') : null;
  score.addEventListener('pointerover', event => {
    const button = targetButton(event.target);
    if (button && event.pointerType !== 'touch') { touchInspection = false; showTooltip(button); }
  });
  score.addEventListener('pointerout', event => {
    if (!touchInspection && targetButton(event.target) !== targetButton(event.relatedTarget)) hideTooltip();
  });
  score.addEventListener('focusin', event => {
    const button = targetButton(event.target);
    if (button) showTooltip(button);
  });
  score.addEventListener('focusout', hideTooltip);
  document.addEventListener('pointerdown', event => {
    const button = targetButton(event.target);
    touchInspection = event.pointerType === 'touch';
    if (button) showTooltip(button); else hideTooltip();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip(); });
  const describe = (button: HTMLButtonElement, name: string, ancestors: string[], start: number, beats: number) => {
    button.dataset.label = name;
    const position = beats === 1 ? `Beat ${start + 1}` : `Beats ${start + 1}–${start + beats}`;
    button.dataset.description = `${position}\n${[...ancestors, name].join(' › ')}`;
    button.setAttribute('aria-label', button.dataset.description);
    const text = document.createElement('span');
    text.className = 'phrase-label';
    text.textContent = name;
    button.replaceChildren(text);
  };
  const fitLabels = () => {
    hideTooltip();
    if (!score.clientWidth) return;
    for (const selector of ['.phrase-group', '.phrase-section', '.phrase-action']) {
      const row = buttons.filter(button => button.matches(selector));
      if (!row.length) continue;
      const style = getComputedStyle(row[0]!);
      measure.font = `${style.fontSize} ${style.fontFamily}`;
      const available = (button: HTMLButtonElement) => {
        const width = score.clientWidth * parseFloat(button.style.width) / 100;
        return Math.max(1, width - (width < 12 ? 0.5 : 4));
      };
      const labels = new Map<string, string>();
      for (const name of new Set(row.map(button => button.dataset.label!))) {
        const space = Math.min(...row.filter(button => button.dataset.label === name).map(available));
        const choices = [name, ...(shortLabels[name] ?? [name[0]!])];
        labels.set(name, choices.find(label => measure.measureText(label).width <= space) ?? choices.at(-1)!);
      }
      // Directional counterparts use the same notation, even if one word is shorter.
      for (const [left, right] of [['Left', 'Right'], ['Left lead', 'Right lead'], ['Lean L', 'Lean R']] as const) {
        if (labels.has(left) && labels.has(right) && (labels.get(left) !== left || labels.get(right) !== right)) {
          const level = Math.max(
            [left, ...shortLabels[left]!].indexOf(labels.get(left)!),
            [right, ...shortLabels[right]!].indexOf(labels.get(right)!),
          );
          labels.set(left, [left, ...shortLabels[left]!][level]!);
          labels.set(right, [right, ...shortLabels[right]!][level]!);
        }
      }
      for (const button of row) {
        const text = button.querySelector<HTMLElement>('.phrase-label')!;
        text.textContent = labels.get(button.dataset.label!)!;
        // At phone widths a 64-count cycle has ~5 px per action. Condense only
        // the final abbreviation, keeping its height and every beat position.
        const scale = Math.min(1, available(button) / measure.measureText(text.textContent).width);
        text.style.transform = scale < 1 ? `scaleX(${scale})` : '';
      }
    }
  };
  new ResizeObserver(fitLabels).observe($('#timeline-scroll'));
  return {
    setup(dance: Dance) {
      buttons = []; wasDisabled = false;
      hideTooltip();
      score.replaceChildren();
      panel.hidden = !dance.structure;
      document.body.classList.toggle('has-structure', !!dance.structure);
      if (!dance.structure) return;
      // Nested scores expose figure, movement and action; Bourrée groups repeats.
      const nested = ['chapelloise','drumul-dracului','tzadik-katamar','congo-de-captieux'].includes(dance.id);
      const grouped = dance.id === 'bourree' || nested;
      const detailsOnDemand = dance.id === 'drumul-dracului' || dance.id === 'congo-de-captieux';
      const offset = grouped ? 24 : 0;
      score.classList.toggle('phrase-grouped', grouped);
      document.body.classList.toggle('phrase-grouped', grouped);
      score.classList.toggle('phrase-details-on-demand', detailsOnDemand);
      document.body.classList.toggle('phrase-details-on-demand', detailsOnDemand);
      const total = phraseBeats(dance.structure.phrase);
      const beatsPerPhrase = musicalBeatsPerPhrase(dance);
      const spans = phraseSpans(dance.structure.phrase);
      const groups = nested ? spans.filter(span => span.depth === 1) : dance.sections.map(section => ({name:section.name,start:section.start*beatsPerPhrase,beats:section.duration*beatsPerPhrase,detail:section.detail}));
      const motifDepth = nested ? 2 : 1;
      const motifs = spans.filter(span => span.depth === motifDepth);
      const actions = spans.filter(span => span.depth === motifDepth + 1);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('phrase-edges');
      const baseline = detailsOnDemand ? 36 : 60;
      svg.setAttribute('viewBox', `0 0 1000 ${baseline + offset}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      const drawn = new Set<string>();
      const edge = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        const key = [x1,y1,x2,y2].join(',');
        if (drawn.has(key)) return;
        drawn.add(key);
        const line = document.createElementNS(svg.namespaceURI, 'line');
        for (const [key, value] of Object.entries({x1,y1:y1+offset,x2,y2:y2+offset})) line.setAttribute(key, String(value));
        line.setAttribute('stroke', color);
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.append(line);
      };
      // Draw each shared edge once. Labels never change the beat geometry.
      edge(0, baseline, 1000, baseline, '#b6b8c1');
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
        label.style.color = color;
        describe(label, group.name, [], group.start, group.beats);
        label.addEventListener('click', () => seek(group.start / beatsPerPhrase));
        score.append(label); buttons.push(label);
      }
      for (const section of motifs) {
        if (!motifColors.has(section.name)) motifColors.set(section.name, palette[motifColors.size % palette.length]!);
        const color = grouped ? palette[groups.findIndex(group => section.start >= group.start && section.start < group.start+group.beats) % palette.length]! : motifColors.get(section.name)!;
        sectionColors.set(section.start, color);
        const start = section.start / total, end = (section.start + section.beats) / total;
        bracket(start * 1000, end * 1000, 8, color);
        const label = document.createElement('button');
        label.type = 'button'; label.className = 'phrase-section';
        label.style.left = `${start * 100}%`; label.style.width = `${(end-start) * 100}%`;
        label.style.color = color;
        const group = grouped ? groups.find(group => section.start >= group.start && section.start < group.start + group.beats) : undefined;
        describe(label, section.name, group ? [group.name] : [], section.start, section.beats);
        if (detailsOnDemand) {
          const detail = dance.id === 'congo-de-captieux' ? section.detail : actions.filter(action => action.start >= section.start && action.start < section.start + section.beats)
            .map(action => action.name).join(' · ');
          label.dataset.description += `\n${detail}`;
          label.setAttribute('aria-label', label.dataset.description!);
        }
        label.addEventListener('click', () => seek(section.start / beatsPerPhrase));
        score.append(label); buttons.push(label);
      }
      for (const span of detailsOnDemand ? [] : actions) {
        const x = span.start / total;
        const parent = motifs.find(motif => span.start >= motif.start && span.start < motif.start + motif.beats)!;
        bracket(x * 1000, (span.start + span.beats) / total * 1000, 32, sectionColors.get(parent.start)!);
        edge(x * 1000, baseline - 5, x * 1000, baseline, '#b6b8c1');
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'phrase-action';
        button.style.color = sectionColors.get(parent.start)!;
        button.style.left = `${x * 100}%`; button.style.width = `${span.beats / total * 100}%`;
        const group = grouped ? groups.find(group => span.start >= group.start && span.start < group.start + group.beats) : undefined;
        describe(button, span.name, [...(group ? [group.name] : []), parent.name], span.start, span.beats);
        button.dataset.action = span.name.toLowerCase();
        button.addEventListener('click', () => seek(span.start / beatsPerPhrase));
        score.append(button); buttons.push(button);
      }
      score.append(svg);
      // Fit complete labelled tiers to the same beat axis, without scrolling.
      fitLabels();

    },
    render(_time: number, disabled: boolean) {
      if (disabled === wasDisabled) return;
      if (disabled) hideTooltip();
      for (const button of buttons) button.disabled = disabled;
      wasDisabled = disabled;
    },
  };
}
