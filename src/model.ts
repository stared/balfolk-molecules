import type { Phrase } from './engine/phrase-structure.ts';
export interface Position { x: number; y: number }
export interface Dancer extends Position {
  angle: number;
  slot: number;
  id: string;
  weight?: number;
  /** Soft lowering of the body, shown as a subtle top-view contraction (0–1). */
  sink?: number;
  /** Lower-body rotation relative to the facing direction, in degrees. */
  hipAngle?: number;
  stampLeft?: number;
  stampRight?: number;
  role?: 'leader' | 'follower';
  front?: 0 | 1;
}
export interface DanceSection { name: string; start: number; duration: number; detail: string }
export interface HandReach { dancers: [number, number]; reach: number; arch?: number; shoulderHold?: number }

export interface LiveFrame { dancers: Dancer[]; hands: HandReach[]; weight: number; section: number }
export interface Dance {
  id: string;
  title: string;
  category: 'chain' | 'circle' | 'couple' | 'set';
  aliases?: readonly string[];
  origin?: string;
  materials?: readonly { name: string; url: string }[];
  description: string;
  /** Cycle length in timeline phrases, the unit of `frame` time and section starts. */
  duration: number;
  millisecondsPerPhrase: number;
  /** Timeline counts in one phrase; four when omitted. */
  countsPerPhrase?: number;
  /** Musical beats, when timeline counts represent multi-beat steps. */
  beatsPerPhrase?: number;
  /** Foot contacts in counts from the start of a phrase, the same in every phrase. */
  contacts?: readonly number[];
  /** Contacts that differ between phrases; one list per phrase, same units. */
  phraseContacts?: readonly (readonly number[])[];
  /** Shown as the tempo readout's tooltip; a plain practice tempo when omitted. */
  tempoNote?: string;
  /** Coarse parts on the scrubber, in phrases. Each boundary is also a structure boundary. */
  sections: DanceSection[];
  /** One caption per fixed-length timeline phrase; these may cut across movements. */
  phrases: string[];
  /** Movement hierarchy in musical beats; its note is the diagram's tooltip. */
  structure?: { phrase: Phrase; note: string };
  guides: string;
  note: string;
  /** HTML; only its links are rendered, the prose records limits of the drawing. */
  sources: string;
  roles?: boolean;
  /** One open chain whose dancer order survives a change of dance; not facing lines. */
  formation?: 'chain';
  progression?: 0 | 1 | -1;
  frame(time: number, cycle: number, pairCount?: number): LiveFrame;
}
