import { describe, expect, it } from 'vitest';
import type { AutumnChoiceCommitment } from './autumn-major-choice';
import { getAutumnMajorChoiceWorldFacts } from './autumn-world-consequences';
import { emptyCareerRecords, type CareerTitleId } from './career-records';
import {
  commitLongNightOutcome,
  commitWinterEnding,
  resolveLongNightOutcome,
  resolveModularEnding,
  selectCompletedRunHandoff,
} from './campaign-winter-season';
import { initialState, type GameState } from './game';
import { inspectSavedGame, serializeSavedGame } from './save-schema';
import {
  createTacticalScenarioBattle,
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  resolveTacticalScenarioResult,
} from './tactical-scenario';
import { prepareNewRunState } from './v3-persistent-state';
import {
  getWinterLongNightWorldCrisis,
  resolveWinterLongNightWorldConsequence,
} from './winter-long-night-world';
import {
  mapWinterTacticalResultToMajorOutcome,
  winterLongNightWorldCrisisToTacticalScenario,
} from './winter-world-tactical-lane';
import {
  applyWinterBondResolution,
  resolveWinterEndingStory,
} from './winter-ending-story';
import { buildWinterStoryUiModel } from './winter-story-ui';

const progression = { maxHp: 120, agility: 15, power: 24, magic: 20 };
const companions = ['bear', 'owl'] as const;
const careerTitles: CareerTitleId[] = ['steady_trainer', 'seasoned_explorer', 'warm_giver', 'veteran_guardian'];

const routes = [
  {
    commitment: { campaign: 'caretaker', choiceId: 'caretaker_autumn', optionId: 'team_solution' } as const,
    expectedOutcome: 'exceptional_victory' as const,
    terminal: 'flawless' as const,
  },
  {
    commitment: { campaign: 'pathfinder', choiceId: 'pathfinder_autumn', optionId: 'limited_access' } as const,
    expectedOutcome: 'costly_victory' as const,
    terminal: 'escape' as const,
  },
  {
    commitment: { campaign: 'vanguard', choiceId: 'vanguard_autumn', optionId: 'centralize' } as const,
    expectedOutcome: 'victory' as const,
    terminal: 'damaged_victory' as const,
  },
  {
    commitment: { campaign: 'arcanist', choiceId: 'arcanist_autumn', optionId: 'controlled_use' } as const,
    expectedOutcome: 'defeat' as const,
    terminal: 'defeat' as const,
  },
] satisfies ReadonlyArray<{
  commitment: AutumnChoiceCommitment;
  expectedOutcome: 'exceptional_victory' | 'victory' | 'costly_victory' | 'defeat';
  terminal: 'flawless' | 'escape' | 'damaged_victory' | 'defeat';
}>;

function terminalSession(
  battle: ReturnType<typeof createTacticalScenarioBattle>,
  terminal: (typeof routes)[number]['terminal'],
) {
  if (terminal === 'flawless') {
    return {
      ...battle,
      round: 5,
      units: battle.units.map(unit => unit.side === 'enemy'
        ? { ...unit, hp: 0 }
        : { ...unit, hp: unit.maxHp }),
    };
  }
  if (terminal === 'escape') return { ...battle, round: 2 };
  if (terminal === 'damaged_victory') {
    return {
      ...battle,
      round: 2,
      units: battle.units.map(unit => {
        if (unit.side === 'enemy') return { ...unit, hp: 0 };
        if (unit.id === 'runa') return { ...unit, hp: Math.max(1, unit.maxHp - 1) };
        return unit;
      }),
    };
  }
  return {
    ...battle,
    round: 2,
    units: battle.units.map(unit => unit.side === 'ally' ? { ...unit, hp: 0 } : unit),
  };
}

for (const route of routes) {
  describe(`V3 Winter final Wave · ${route.commitment.campaign}`, () => {
    it('connects Autumn history through Long Night, Ending, Bond/UI, save/reload, replay blocking, and completed-run handoff', () => {
      const facts = getAutumnMajorChoiceWorldFacts(route.commitment.campaign, route.commitment.optionId);
      expect(facts).not.toBeNull();
      if (!facts) return;

      const crisis = getWinterLongNightWorldCrisis(route.commitment, {
        currentFacts: [...facts],
        inheritedFacts: ['rift_stabilized'],
      });
      expect(crisis).not.toBeNull();
      if (!crisis) return;
      expect(crisis.failForward).toBe(true);

      const scenario = winterLongNightWorldCrisisToTacticalScenario(crisis);
      const battle = createTacticalScenarioBattle(scenario, companions, progression, 700 + routes.indexOf(route));
      const session = terminalSession(battle, route.terminal);
      const terminal = resolveTacticalScenarioResult(scenario, session, `winter-final-${route.commitment.campaign}`);
      expect(terminal).not.toBeNull();
      if (!terminal) return;

      const firstHandoff = handoffTacticalTerminalResult(createTacticalTerminalHandoffState(), terminal);
      expect(firstHandoff.result).not.toBeNull();
      if (!firstHandoff.result) return;
      expect(handoffTacticalTerminalResult(firstHandoff.state, terminal).result).toBeNull();

      const outcome = mapWinterTacticalResultToMajorOutcome(firstHandoff.result);
      expect(outcome).toBe(route.expectedOutcome);
      const world = resolveWinterLongNightWorldConsequence(route.commitment.campaign, outcome);
      expect(world).not.toBeNull();
      if (!world) return;
      expect(world.failForward).toBe(true);

      const acceptedOutcome = resolveLongNightOutcome({ campaign: route.commitment.campaign, outcome });
      expect(acceptedOutcome.accepted).toBe(true);
      if (!acceptedOutcome.accepted) return;

      const runBeforeNight = {
        ...initialState.campaignRun,
        phase: 'winter' as const,
        activeCampaign: route.commitment.campaign,
        majorChoices: { [route.commitment.choiceId]: route.commitment.optionId },
        majorOutcomes: { great_expedition: 'victory' as const },
        seasonMilestones: ['autumn_resolved' as const],
      };
      const longNight = commitLongNightOutcome(runBeforeNight, acceptedOutcome);
      expect(longNight.committed).toBe(true);
      if (!longNight.committed) return;
      expect(longNight.state.majorOutcomes.long_night).toBe(outcome);
      expect(longNight.state.seasonMilestones).toContain('winter_resolved');
      if (outcome === 'defeat') expect(longNight.state.failForwardOutcomes).toContain('long_night');

      const story = resolveWinterEndingStory({
        campaign: route.commitment.campaign,
        autumnChoice: route.commitment.optionId,
        longNightOutcome: outcome,
        characterBonds: initialState.characterBonds,
        careerRecords: { ...emptyCareerRecords(), trainings: 12, outings: 11, gifts: 6, monthsCompleted: 4 },
        careerTitles,
      });
      expect(story.status).toBe('resolved');

      const bondApplied = applyWinterBondResolution(initialState.characterBonds, story.bondAftermath);
      expect(bondApplied.applied).toBe(true);
      expect(applyWinterBondResolution(bondApplied.bonds, story.bondAftermath).applied).toBe(false);

      const ui = buildWinterStoryUiModel(story, bondApplied.bonds);
      expect(ui.axes.map(axis => axis.id)).toEqual(['campaign', 'bond', 'world', 'career']);
      expect(ui.endingCommitted).toBe(true);
      if (outcome === 'defeat') expect(ui.longNightResult).toMatch(/패배|상처|밤/);

      const modular = resolveModularEnding({
        campaignResolution: `${route.commitment.campaign}_${route.commitment.optionId}`,
        bondResolution: `${story.bondResolution.character}_${story.bondResolution.key.split('.').at(-1)}`,
        worldResolution: world.consequence,
        careerResolution: story.careerResolution.key.split('.').at(-1),
      });
      expect(modular.accepted).toBe(true);
      if (!modular.accepted) return;

      const stateBeforeEnding = {
        ...initialState,
        campaignRun: longNight.state,
        worldHistory: { currentFacts: [...facts], inheritedFacts: ['rift_stabilized'] },
        characterBonds: bondApplied.bonds,
      } as GameState;
      const ending = commitWinterEnding(stateBeforeEnding, modular.ending, {
        majorWorldOutcomes: [...facts],
        keyBondMemories: story.bondAftermath
          ? [{ characterId: story.bondAftermath.character, memoryId: story.bondAftermath.memoryId }]
          : [],
      });
      expect(ending.committed).toBe(true);
      if (!ending.committed) return;

      const loaded = inspectSavedGame(serializeSavedGame(ending.state as GameState));
      expect(loaded.status).toBe('valid');
      expect(loaded.state.campaignRun.majorOutcomes.long_night).toBe(outcome);
      expect(loaded.state.campaignRun.seasonMilestones).toEqual([
        'autumn_resolved', 'winter_resolved', 'ending_committed',
      ]);
      expect(loaded.state.legacy.completedRuns).toBe(1);
      expect(loaded.state.legacy.endingCollection).toContain(modular.ending.id);
      expect(story.bondAftermath && loaded.state.characterBonds[story.bondAftermath.character].memories)
        .toContain(story.bondAftermath?.memoryId);

      const handoff = selectCompletedRunHandoff(loaded.state);
      expect(handoff).toEqual(expect.objectContaining({
        runNumber: 1,
        campaignId: route.commitment.campaign,
        longNightOutcome: outcome,
        endingId: modular.ending.id,
        dimensions: modular.ending.dimensions,
      }));

      const replayOutcome = resolveLongNightOutcome({ campaign: route.commitment.campaign, outcome: 'defeat' });
      expect(replayOutcome.accepted).toBe(true);
      if (replayOutcome.accepted) {
        expect(commitLongNightOutcome(loaded.state.campaignRun, replayOutcome)).toEqual({
          committed: false,
          state: loaded.state.campaignRun,
          reason: 'already_committed',
        });
      }
      expect(commitWinterEnding(loaded.state, modular.ending)).toEqual({
        committed: false,
        state: loaded.state,
        reason: 'already_committed',
      });
      expect(applyWinterBondResolution(loaded.state.characterBonds, story.bondAftermath).applied).toBe(false);

      const reloaded = inspectSavedGame(serializeSavedGame(loaded.state));
      expect(reloaded.status).toBe('valid');
      expect(reloaded.state).toEqual(loaded.state);

      const nextRun = prepareNewRunState(loaded.state);
      expect(nextRun.campaignRun.activeCampaign).toBeNull();
      expect(nextRun.campaignRun.majorOutcomes.long_night).toBeUndefined();
      expect(nextRun.campaignRun.seasonMilestones).toEqual([]);
      expect(nextRun.characterBonds).toEqual(initialState.characterBonds);
      expect(nextRun.legacy).toEqual(loaded.state.legacy);
      expect(selectCompletedRunHandoff(nextRun)).toBeNull();
    });
  });
}

describe('V3 Winter final Wave boundaries', () => {
  it('does not let inherited Autumn history substitute for current-run commitment evidence', () => {
    const commitment: AutumnChoiceCommitment = {
      campaign: 'pathfinder',
      choiceId: 'pathfinder_autumn',
      optionId: 'limited_access',
    };
    const facts = getAutumnMajorChoiceWorldFacts(commitment.campaign, commitment.optionId)!;
    expect(getWinterLongNightWorldCrisis(commitment, {
      currentFacts: [],
      inheritedFacts: [...facts],
    })).toBeNull();
  });

  it('rejects cross-campaign Autumn choice and malformed ending dimensions instead of inventing a Winter resolution', () => {
    const invalidStory = resolveWinterEndingStory({
      campaign: 'caretaker',
      autumnChoice: 'controlled_use',
      longNightOutcome: 'victory',
      characterBonds: initialState.characterBonds,
      careerRecords: emptyCareerRecords(),
      careerTitles: [],
    });
    expect(invalidStory.status).toBe('invalid_input');
    expect(resolveModularEnding({
      campaignResolution: 'caretaker:bad',
      bondResolution: 'mira_open',
      worldResolution: 'night_endured',
      careerResolution: 'emerging',
    })).toEqual({ accepted: false, reason: 'invalid_dimension' });
  });
});
