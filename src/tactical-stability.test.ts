import { describe, expect, it } from 'vitest';
import { createBattleSession, isBattleFinished, type BattleSession, type TacticalUnit } from './tactical-battle';
import { chooseAutoCombinationUltimate, chooseTacticalEngineAction } from './tactical-ai';
import { tacticalActionHand } from './tactical-hand';
import { validTacticalTargets } from './tactical-actions';
import { nextTacticalActor, resolveTacticalAction, skipTacticalTurnIfNoPlayableAction } from './tactical-engine';
import { createTacticalExpeditionBattle, resolveTacticalExpeditionReward } from './tactical-expedition';
import { resolveCombinationUltimate, validCombinationUltimateTargets } from './tactical-ultimate';

const progression = { power: 42, magic: 32, agility: 13, maxHp: 150 };
const party = ['wolf', 'owl'] as const;
const bonds = { wolf: 5, owl: 1 } as const;
const stressStages = Array.from({length:10},(_,index)=>`stress-${index}`);

function assertResourceBounds(session:BattleSession) {
  for (const unit of session.units) {
    expect(unit.hp, `${unit.id} hp`).toBeGreaterThanOrEqual(0);
    expect(unit.hp, `${unit.id} hp`).toBeLessThanOrEqual(unit.maxHp);
    expect(unit.ap, `${unit.id} ap`).toBeGreaterThanOrEqual(0);
    expect(unit.ap, `${unit.id} ap`).toBeLessThanOrEqual(unit.maxAp);
    expect(unit.mp, `${unit.id} mp`).toBeGreaterThanOrEqual(0);
    expect(unit.mp, `${unit.id} mp`).toBeLessThanOrEqual(unit.maxMp);
    expect(unit.shield, `${unit.id} shield`).toBeGreaterThanOrEqual(0);
  }
}

function manualStep(session:BattleSession):BattleSession {
  const actorId = nextTacticalActor(session);
  if (!actorId) return session;

  if (actorId === 'runa') {
    for (const companionId of party) {
      const bondLevel = bonds[companionId] ?? 1;
      const targetIds = validCombinationUltimateTargets(session, actorId, companionId, bondLevel);
      if (targetIds.length) {
        const next = resolveCombinationUltimate(session, { actorId, companionId, bondLevel, targetId:targetIds[0] });
        if (next !== session) return next;
      }
    }
  }

  const hand = tacticalActionHand(session, actorId);
  for (const actionId of hand) {
    const targets = validTacticalTargets(session, actorId, actionId);
    if (!targets.length) continue;
    const next = resolveTacticalAction(session, { actorId, actionId, targetId:targets[0] });
    if (next !== session) return next;
  }
  return skipTacticalTurnIfNoPlayableAction(session, actorId, hand);
}

function autoStep(session:BattleSession):BattleSession {
  const actorId = nextTacticalActor(session);
  if (!actorId) return session;
  if (actorId === 'runa') {
    const ultimate = chooseAutoCombinationUltimate(session, party, bonds);
    if (ultimate) {
      const next = resolveCombinationUltimate(session, ultimate);
      if (next !== session) return next;
    }
  }
  const move = chooseTacticalEngineAction(session, actorId, session.seed + session.round + session.acted.length);
  if (move) {
    const next = resolveTacticalAction(session, move);
    if (next !== session) return next;
  }
  return skipTacticalTurnIfNoPlayableAction(session, actorId, tacticalActionHand(session, actorId));
}

function runBattle(mode:'manual'|'auto', seed:number, stageId='city_gate') {
  let session = createTacticalExpeditionBattle(stageId, party, progression, seed);
  const initialHand = tacticalActionHand(session, 'runa');
  expect(initialHand).toHaveLength(4);
  expect(tacticalActionHand(session, 'runa')).toEqual(initialHand);
  let steps = 0;
  let ultimateUsed = false;

  while (!isBattleFinished(session) && steps < 160) {
    const before = session;
    const beforeDigest = digest(session);
    const beforeRunaMp = session.units.find(unit => unit.id === 'runa')?.mp ?? 0;
    session = mode === 'manual' ? manualStep(session) : autoStep(session);
    expect(session, `${mode} ${stageId} seed ${seed} stalled at step ${steps}`).not.toBe(before);
    expect(digest(session), `${mode} ${stageId} seed ${seed} made no meaningful progress at step ${steps}`).not.toEqual(beforeDigest);
    const afterRunaMp = session.units.find(unit => unit.id === 'runa')?.mp ?? 0;
    ultimateUsed = ultimateUsed || beforeRunaMp === 10 && afterRunaMp === 0;
    assertResourceBounds(session);
    const active = nextTacticalActor(session);
    if (active) expect(session.units.find(unit => unit.id === active)?.hp).toBeGreaterThan(0);
    steps += 1;
  }

  expect(isBattleFinished(session), `${mode} ${stageId} seed ${seed} did not finish`).not.toBeNull();
  expect(steps).toBeLessThan(160);
  return { session,steps,ultimateUsed };
}

function digest(session:BattleSession) {
  return {
    result:isBattleFinished(session),
    round:session.round,
    acted:session.acted,
    units:session.units.map(unit => ({ id:unit.id,hp:unit.hp,ap:unit.ap,mp:unit.mp,shield:unit.shield,statuses:unit.statuses ?? [] })),
  };
}

const basicUnit = (id:string,side:'ally'|'enemy',agility:number,hp=100,ap=3,mp=0):TacticalUnit => ({
  id,side,position:'front',maxHp:100,hp,agility,ap,maxAp:3,mp,maxMp:10,shield:0,
});

describe('tactical vertical slice stability', () => {
  it('sanitizes non-finite battle inputs so a fresh session cannot start corrupted', () => {
    const corrupted = {
      ...basicUnit('runa','ally',20),
      maxHp:Number.NaN,
      hp:Number.POSITIVE_INFINITY,
      agility:Number.NEGATIVE_INFINITY,
      ap:Number.NaN,
      maxAp:Number.POSITIVE_INFINITY,
      mp:Number.NEGATIVE_INFINITY,
      maxMp:Number.NaN,
      shield:Number.POSITIVE_INFINITY,
    };
    const session = createBattleSession(
      [corrupted,basicUnit('ally-2','ally',10),basicUnit('ally-3','ally',8)],
      [basicUnit('enemy-1','enemy',15),basicUnit('enemy-2','enemy',9),basicUnit('enemy-3','enemy',7)],
      Number.NaN,
    );

    expect(Number.isFinite(session.seed)).toBe(true);
    for (const unit of session.units) {
      for (const value of [unit.maxHp,unit.hp,unit.agility,unit.ap,unit.maxAp,unit.mp,unit.maxMp,unit.shield]) {
        expect(Number.isFinite(value), `${unit.id} contains non-finite battle state`).toBe(true);
      }
    }
    assertResourceBounds(session);
  });

  it('owns fresh unit, status, timeline and acted state instead of sharing battle input references', () => {
    const runa = { ...basicUnit('runa','ally',20),statuses:[{ id:'focus' as const,turns:2 }] };
    const allies = [runa,basicUnit('ally-2','ally',10),basicUnit('ally-3','ally',8)];
    const enemies = [basicUnit('enemy-1','enemy',15),basicUnit('enemy-2','enemy',9),basicUnit('enemy-3','enemy',7)];
    const session = createBattleSession(allies,enemies,23);

    expect(session.units[0]).not.toBe(runa);
    expect(session.units[0].statuses).not.toBe(runa.statuses);
    expect(session.round).toBe(1);
    expect(session.acted).toEqual([]);
    expect(session.timeline).toEqual(['runa','enemy-1','ally-2','enemy-2','ally-3','enemy-3']);

    session.units[0].hp = 1;
    session.units[0].statuses?.push({ id:'guard',turns:1 });
    session.acted.push('runa');
    expect(runa.hp).toBe(100);
    expect(runa.statuses).toEqual([{ id:'focus',turns:2 }]);
  });

  it('repeats complete manual and AUTO battles without stalls or resource corruption', () => {
    let sawUltimate = false;
    for (const mode of ['manual','auto'] as const) {
      for (const seed of [1,7,19,73,101,211]) {
        const result = runBattle(mode,seed);
        sawUltimate = sawUltimate || result.ultimateUsed;
        const reward = resolveTacticalExpeditionReward('city_gate',isBattleFinished(result.session)!);
        if (isBattleFinished(result.session) === 'victory') {
          expect(reward.coins).toBeGreaterThan(0);
          expect(reward.expeditionScore).toBeGreaterThan(0);
        } else {
          expect(reward.coins).toBe(0);
          expect(reward.expeditionScore).toBe(0);
        }
      }
    }
    expect(sawUltimate).toBe(true);
  });

  it('is deterministic when the same seed and control mode are replayed', () => {
    expect(digest(runBattle('manual',73).session)).toEqual(digest(runBattle('manual',73).session));
    expect(digest(runBattle('auto',73).session)).toEqual(digest(runBattle('auto',73).session));
  });

  it('keeps AUTO bounded and making meaningful progress through 10, 50 and 100 battle checkpoints across mixed stage archetypes', () => {
    const checkpoints = new Map<number,{victories:number;defeats:number}>();
    let victories = 0;
    let defeats = 0;
    for (let seed=1;seed<=100;seed+=1) {
      const stageId=stressStages[(seed-1)%stressStages.length];
      const { session,steps } = runBattle('auto',seed,stageId);
      const result = isBattleFinished(session);
      expect(result).not.toBeNull();
      expect(steps).toBeGreaterThan(0);
      expect(steps).toBeLessThan(160);
      if (result === 'victory') victories += 1;
      else defeats += 1;
      if (seed === 10 || seed === 50 || seed === 100) checkpoints.set(seed,{victories,defeats});
    }

    expect(checkpoints.get(10)).toBeDefined();
    expect(checkpoints.get(50)).toBeDefined();
    expect(checkpoints.get(100)).toEqual({victories,defeats});
    expect(victories + defeats).toBe(100);
  });

  it('replays representative AUTO seeds identically after the 100-battle stress run', () => {
    for (const seed of [1,10,50,100]) {
      expect(digest(runBattle('auto',seed).session)).toEqual(digest(runBattle('auto',seed).session));
    }
  });

  it('rejects a dead target without spending resources or advancing the turn', () => {
    const session = createBattleSession(
      [basicUnit('runa','ally',20),basicUnit('ally-2','ally',10),basicUnit('ally-3','ally',8)],
      [basicUnit('enemy-dead','enemy',15,0),basicUnit('enemy-2','enemy',9),basicUnit('enemy-3','enemy',7)],
      31,
    );
    const before = digest(session);
    expect(validTacticalTargets(session,'runa','skill')).not.toContain('enemy-dead');
    expect(resolveTacticalAction(session,{actorId:'runa',actionId:'skill',targetId:'enemy-dead'})).toBe(session);
    expect(digest(session)).toEqual(before);
  });

  it('safely advances exactly one live turn when the hand is empty or has no playable action', () => {
    const session = createBattleSession(
      [basicUnit('runa','ally',20),basicUnit('ally-2','ally',10),basicUnit('ally-3','ally',8)],
      [basicUnit('enemy-1','enemy',15),basicUnit('enemy-2','enemy',9),basicUnit('enemy-3','enemy',7)],
      11,
    );
    const actorId = nextTacticalActor(session)!;
    const emptyHandPass = skipTacticalTurnIfNoPlayableAction(session,actorId,[]);
    expect(emptyHandPass).not.toBe(session);
    expect(emptyHandPass.acted).toEqual([actorId]);
    expect(skipTacticalTurnIfNoPlayableAction(emptyHandPass,actorId,[])).toBe(emptyHandPass);

    const noResource = createBattleSession(
      [basicUnit('runa','ally',20,100,0,0),basicUnit('ally-2','ally',10),basicUnit('ally-3','ally',8)],
      [basicUnit('enemy-1','enemy',15),basicUnit('enemy-2','enemy',9),basicUnit('enemy-3','enemy',7)],
      12,
    );
    const noPlayablePass = skipTacticalTurnIfNoPlayableAction(noResource,'runa',['attack','skill','special']);
    expect(noPlayablePass.acted).toEqual(['runa']);
    expect(noPlayablePass.units.find(unit => unit.id === 'runa')).toEqual(noResource.units.find(unit => unit.id === 'runa'));

    const legalHandDoesNotPass = skipTacticalTurnIfNoPlayableAction(session,actorId,['attack']);
    expect(legalHandDoesNotPass).toBe(session);
  });

  it('keeps Ultimate locked below 10 MP, available at 10, and clamps over-cap input', () => {
    const make = (mp:number) => createBattleSession(
      [basicUnit('runa','ally',20,100,3,mp),basicUnit('companion-wolf','ally',12),basicUnit('companion-owl','ally',8)],
      [basicUnit('enemy-1','enemy',10),basicUnit('enemy-2','enemy',7),basicUnit('enemy-3','enemy',5)],
      17,
    );
    const below = make(9);
    expect(validCombinationUltimateTargets(below,'runa','wolf',5)).toEqual([]);
    expect(resolveCombinationUltimate(below,{actorId:'runa',companionId:'wolf',bondLevel:5,targetId:'enemy-1'})).toBe(below);

    const exact = make(10);
    expect(validCombinationUltimateTargets(exact,'runa','wolf',5)).toContain('enemy-1');
    const exactNext = resolveCombinationUltimate(exact,{actorId:'runa',companionId:'wolf',bondLevel:5,targetId:'enemy-1'});
    expect(exactNext.units.find(unit => unit.id === 'runa')?.mp).toBe(0);

    const over = make(999);
    expect(over.units.find(unit => unit.id === 'runa')?.mp).toBe(10);
    assertResourceBounds(over);
  });

  it('terminates immediately when the last enemy or last ally dies and never targets a corpse', () => {
    const victory = createBattleSession(
      [basicUnit('runa','ally',20),basicUnit('ally-2','ally',9),basicUnit('ally-3','ally',8)],
      [basicUnit('enemy-1','enemy',10,1),basicUnit('enemy-2','enemy',7,0),basicUnit('enemy-3','enemy',5,0)],
      5,
    );
    const won = resolveTacticalAction(victory,{actorId:'runa',actionId:'attack',targetId:'enemy-1'});
    expect(isBattleFinished(won)).toBe('victory');
    expect(nextTacticalActor(won)).toBeNull();
    expect(resolveTacticalAction(won,{actorId:'runa',actionId:'attack',targetId:'enemy-1'})).toBe(won);

    const defeat = createBattleSession(
      [basicUnit('runa','ally',10,1),basicUnit('ally-2','ally',7,0),basicUnit('ally-3','ally',5,0)],
      [basicUnit('enemy-1','enemy',20),basicUnit('enemy-2','enemy',9),basicUnit('enemy-3','enemy',8)],
      6,
    );
    const lost = resolveTacticalAction(defeat,{actorId:'enemy-1',actionId:'attack',targetId:'runa'});
    expect(isBattleFinished(lost)).toBe('defeat');
    expect(nextTacticalActor(lost)).toBeNull();
  });

  it('treats a mutual wipe as terminal defeat instead of stalling without an actor', () => {
    const mutualWipe = createBattleSession(
      [basicUnit('runa','ally',20,0),basicUnit('ally-2','ally',9,0),basicUnit('ally-3','ally',8,0)],
      [basicUnit('enemy-1','enemy',10,0),basicUnit('enemy-2','enemy',7,0),basicUnit('enemy-3','enemy',5,0)],
      29,
    );

    expect(isBattleFinished(mutualWipe)).toBe('defeat');
    expect(nextTacticalActor(mutualWipe)).toBeNull();
  });

  it('blocks regular actions, skips and Joint Ultimate after a terminal result', () => {
    const won = createBattleSession(
      [basicUnit('runa','ally',20,100,3,10),basicUnit('companion-wolf','ally',12),basicUnit('companion-owl','ally',8)],
      [basicUnit('enemy-1','enemy',10,0),basicUnit('enemy-2','enemy',7,0),basicUnit('enemy-3','enemy',5,0)],
      41,
    );
    expect(isBattleFinished(won)).toBe('victory');
    expect(resolveTacticalAction(won,{actorId:'runa',actionId:'support',targetId:'runa'})).toBe(won);
    expect(skipTacticalTurnIfNoPlayableAction(won,'runa',[])).toBe(won);
    expect(validCombinationUltimateTargets(won,'runa','wolf',5)).toEqual([]);
    expect(resolveCombinationUltimate(won,{actorId:'runa',companionId:'wolf',bondLevel:5,targetId:'enemy-1'})).toBe(won);
    expect(digest(won)).toEqual(digest(won));
  });

  it('does not leak HP, AP, MP, acted units or terminal state into a consecutive battle', () => {
    const first = runBattle('auto',101).session;
    expect(isBattleFinished(first)).not.toBeNull();

    const second = createTacticalExpeditionBattle('city_gate',party,progression,101);
    const fresh = createTacticalExpeditionBattle('city_gate',party,progression,101);
    expect(second).toEqual(fresh);
    expect(second).not.toBe(fresh);
    expect(second.units).not.toBe(fresh.units);
    expect(second.acted).not.toBe(fresh.acted);
    expect(second.timeline).not.toBe(fresh.timeline);
    for (let index=0;index<second.units.length;index+=1) expect(second.units[index]).not.toBe(fresh.units[index]);
    expect(second.round).toBe(1);
    expect(second.acted).toEqual([]);
    expect(isBattleFinished(second)).toBeNull();
    expect(second.units.every(unit => unit.hp === unit.maxHp && unit.ap === unit.maxAp && unit.mp === 0 && unit.shield === 0)).toBe(true);
  });
});
