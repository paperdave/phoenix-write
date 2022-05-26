import { componentDefinition } from '../../registry-utils';

export interface PhraseData {
  phrase: string;
  hits: PhraseHit[];
}

export interface PhraseHit {
  /** Index of PhraseData.phrase that you must press. */
  index: number;
  /** If supplied, turns into a range hit, where you have a set time to type the entire word. */
  endIndex?: number;
  /** Time to press the key, in seconds offset from the level start. */
  time: number;
  /**
   * For range hits, extra time in seconds given before a fail is given. Do not use for normal hits.
   * Defaults to 0.5.
   */
  failTime?: number;
}

export default componentDefinition({
  type: 'phrase',
  display: null,
  logic: null,
});
