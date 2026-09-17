export interface Position { x: number; y: number }
export interface Dancer extends Position {
  angle: number;
  slot: number;
  id: string;
  weight?: number;
  /** Soft lowering of the body, shown as a subtle top-view contraction (0–1). */
  sink?: number;
  /** Lower-body rotation relative to the facing tick, in degrees. */
  hipAngle?: number;
  stampLeft?: number;
  stampRight?: number;
  role?: 'leader' | 'follower';
}
export interface DanceSection { name: string; start: number; duration: number; detail: string }
export interface HandReach { dancers: [number, number]; reach: number; arch?: number; shoulderHold?: number }

export interface LiveFrame { dancers: Dancer[]; hands: HandReach[]; weight: number; section: number }
export interface Dance {
  id: string;
  title: string;
  category: 'chain' | 'circle' | 'couple' | 'set';
  description: string;
  duration: number;
  millisecondsPerPhrase: number;
  countsPerPhrase?: number;
  /** Musical beats, when timeline counts represent multi-beat steps. */
  beatsPerPhrase?: number;
  contacts?: readonly number[];
  phraseContacts?: readonly (readonly number[])[];
  tempoNote?: string;
  sections: DanceSection[];
  phrases: string[];
  guides: string;
  note: string;
  sources: string;
  roles?: boolean;
  formation?: 'chain';
  progression?: 0 | 1 | -1;
  frame(time: number, cycle: number, pairCount?: number): LiveFrame;
}
