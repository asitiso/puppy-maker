import { describe, expect, it } from 'vitest';
import { endingScores, leadingEndingSeed } from './endings';
import { initialState } from '../game';

describe('ending tendencies',()=>{
 it('leans guardian for courageous hunt-focused Runa',()=>{const state={...initialState,personality:{...initialState.personality,courage:95},mastery:{...initialState.mastery,hunt:{xp:30}}};expect(leadingEndingSeed(state)).toBe('guardian');});
 it('leans mage for curious magic-focused Runa',()=>{const state={...initialState,personality:{...initialState.personality,curiosity:95},mastery:{...initialState.mastery,magic:{xp:30}}};expect(leadingEndingSeed(state)).toBe('sage');});
 it('returns finite scores for all six endings',()=>{const scores=endingScores(initialState);expect(Object.keys(scores)).toHaveLength(6);expect(Object.values(scores).every(Number.isFinite)).toBe(true);});
});