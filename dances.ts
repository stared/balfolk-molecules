import { frame, sections, duration } from './movement.ts';
import type { Dancer, HandReach, DanceSection } from './movement.ts';
import { chapelloiseFrame } from './chapelloise.ts';

interface ViewFrame { dancers: Dancer[]; hands: HandReach[]; weight: number; section: number }
export interface Dance {
  id: string;
  title: string;
  description: string;
  duration: number;
  millisecondsPerPhrase: number;
  sections: DanceSection[];
  phrases: string[];
  guides: string;
  note: string;
  sources: string;
  roles?: boolean;
  frame(time: number, cycle: number, pairCount?: number): ViewFrame;
}
export const dances: Dance[] = [
  {
    id: 'bourree', title: 'Bourrée bancale', description: 'Six dancers, changing lines and crossing four sides.', duration,
    millisecondsPerPhrase: 5000, sections,
    phrases: ['Approach, change, retreat', 'Approach, change, retreat', 'Approach, change, retreat', 'Approach, change, retreat', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn'],
    guides: '<path class="guide" d="M -120 -120 H 120 V 120 H -120 Z M 0 -120 V 120 M -120 0 H 120"/>',
    note: 'Each phrase has four bourrée steps.',
    sources: '<a href="https://www.folkabourk.fr/apprendre" target="_blank" rel="noreferrer">Choreography</a> · <a href="https://dansetrad.fr/fiches/fiches_pdf/Bourree_du_Berry.pdf" target="_blank" rel="noreferrer">Step reference</a>',
    frame(time, cycle) { const state = frame(time, cycle); return { ...state, weight: state.rhythm.weight }; },
  },
  {
    id: 'chapelloise', title: 'Chapelloise', description: 'Couples in a circle: walk, turn, exchange sides, then join the partner behind.', duration: 8,
    millisecondsPerPhrase: 2500, roles: true,
    sections: [{ name: 'Walk + turn', start: 0, duration: 4, detail: 'Four forward, turn, four backward; repeat back to the start.' }, { name: 'Exchange + change', start: 4, duration: 4, detail: 'Together/apart, exchange sides; together/apart, underarm turn to the partner behind.' }],
    phrases: ['Forward + turn', 'Backward', 'Forward + turn', 'Backward', 'Together / apart', 'Exchange sides', 'Together / apart', 'Change partner'],
    guides: '<circle class="guide" r="108"/><circle class="guide" r="162"/>',
    note: '32 counts · Four counts per phrase · New partner each cycle.',
    sources: '<a href="https://www.dansetrad.fr/fiches/fiches_pdf/Chapelloise.pdf" target="_blank" rel="noreferrer">Steps: Olivier Pécheux</a> · Walking on counts; lateral polka on 1 &amp; 2, 3 &amp; 4; exchanges on three steps, then settle. Distance and the split of partner progression are schematic. Raised curve = underarm passage.',
    frame: chapelloiseFrame,
  },
];
