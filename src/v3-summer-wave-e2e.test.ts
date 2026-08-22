import { describe, expect, it } from 'vitest';
import { initialState, type GameState } from './game';
import { inspectSavedGame, serializeSavedGame } from './save-schema';
import type { MainCampaignId, MajorOutcomeResult } from './campaign-model';
import { getSummerGuardianFestivalWorldRoute } from './summer-campaign-world';
import {
  createTacticalScenarioBattle,
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  resolveTacticalScenarioResult,
} from './tactical-scenario';
import {
  mapSummerTacticalResultToGuardianFestivalOutcome,
  summerWorldRouteToTacticalClimax,
} from './summer-world-tactical-lane';
import { resolveGuardianFestivalWorldOutcome } from './campaign-world';
import {
  commitSummerCampaignOutcome,
  resolveSummerCampaignAction,
  resolveSummerCampaignOutcome,
  type SummerCampaignActionFact,
} from './campaign-summer-season';
import {
  applySummerStoryBondConsequence,
  resolveSummerCampaignStory,
  summerCampaignStoryPresentation,
} from './summer-campaign-story';
import { buildSummerStoryUiModel } from './summer-story-ui';

const progression = { maxHp: 120, agility: 15, power: 24, magic: 20 };
const companions = ['bear', 'owl'] as const;

const cases = [
  { campaign: 'caretaker', fact: 'protect', outcome: 'exceptional_victory', seed: 201 },
  { campaign: 'pathfinder', fact: 'discovery', outcome: 'costly_victory', seed: 202 },
  { campaign: 'vanguard', fact: 'ally_survival', outcome: 'victory', seed: 203 },
  { campaign: 'arcanist', fact: 'relic', outcome: 'defeat', seed: 204 },
] as const satisfies readonly {
  campaign: MainCampaignId;
  fact: SummerCampaignActionFact;
  outcome: MajorOutcomeResult;
  seed: number;
}[];

function terminalResult(campaign: MainCampaignId, seed: number) {
  const route = getSummerGuardianFestivalWorldRoute(campaign);
  expect(route).not.toBeNull();
  const climax = summerWorldRouteToTacticalClimax(route!);
  const battle = createTacticalScenarioBattle(climax, companions, progression, seed);

  const terminalBattle = campaign === 'caretaker'
    ? {
        ...battle,
        round: 4,
        units: battle.units.map(unit => unit.side === 'enemy'
          ? { ...unit, hp: 0 }
          : { ...unit, hp: unit.maxHp }),
      }
    : campaign === 'pathfinder'
      ? { ...battle, round: 3 }
      : campaign === 'vanguard'
        ? {
            ...battle,
            round: 2,
            units: battle.units.map(unit => {
              if (unit.side === 'enemy') return { ...unit, hp: 0 };
              if (unit.id === 'runa') return { ...unit, hp: Math.max(1, unit.maxHp - 1) };
              return unit;
            }),
          }
        : {
            ...battle,
            round: 2,
            units: battle.units.map(unit => unit.side === 'ally' ? { ...unit, hp: 0 } : unit),
          };

  const terminal = resolveTacticalScenarioResult(climax, terminalBattle, `summer-wave:${campaign}`);
  expect(terminal).not.toBeNull();
  const first = handoffTacticalTerminalResult(createTacticalTerminalHandoffState(), terminal!);
  expect(first.result).not.toBeNull();
  const replay = handoffTacticalTerminalResult(first.state, terminal!);
  expect(replay.result).toBeNull();
  return first.result!;
}

describe('V3 Summer final Wave E2E', () => {
  it.each(cases)('$campaign flows World/Tactical -> Season -> Bond/UI -> save/reload exactly once', ({
    campaign,
    fact,
    outcome: expectedOutcome,
    seed,
  }) => {
    const tactical = terminalResult(campaign, seed);
    const outcome = mapSummerTacticalResultToGuardianFestivalOutcome(tactical);
    expect(outcome).toBe(expectedOutcome);

    const world = resolveGuardianFestivalWorldOutcome({
      outcome,
      worldHistory: { currentFacts: [], inheritedFacts: ['ancient_route_opened'] },
      majorOutcomes: {},
      failForwardOutcomes: [],
    });
    expect(world.applied).toBe(true);
    expect(world.outcome).toBe(expectedOutcome);
    expect(world.worldHistory.inheritedFacts).toEqual(['ancient_route_opened']);
    expect(world.worldHistory.currentFacts).toEqual([
      expectedOutcome === 'exceptional_victory' || expectedOutcome === 'victory'
        ? 'festival_saved'
        : 'festival_heavy_losses',
    ]);
    expect(world.failForwardOutcomes).toEqual(
      expectedOutcome === 'costly_victory' || expectedOutcome === 'defeat'
        ? ['guardian_festival']
        : [],
    );

    const seasonal = resolveSummerCampaignAction({
      year: 2,
      week: 2,
      campaign,
      facts: [fact],
      claimedKeys: [],
    });
    expect(seasonal.accepted).toBe(true);
    if (!seasonal.accepted) return;
    expect(seasonal.claimKey).toContain(`summer:${campaign}:`);

    const summerOutcome = resolveSummerCampaignOutcome({ campaign, outcome: world.outcome });
    expect(summerOutcome.accepted).toBe(true);
    if (!summerOutcome.accepted) return;

    const committed = commitSummerCampaignOutcome({
      ...initialState.campaignRun,
      claimedSeasonalObjectives: [seasonal.claimKey],
      failForwardOutcomes: world.failForwardOutcomes,
    }, summerOutcome);
    const campaignRun = {
      ...committed,
      majorOutcomes: world.majorOutcomes,
      failForwardOutcomes: world.failForwardOutcomes,
    };
    expect(campaignRun.activeCampaign).toBe(campaign);
    expect(campaignRun.seasonMilestones).toContain('summer_resolved');

    const story = resolveSummerCampaignStory(campaign, expectedOutcome);
    expect(story.resolved).toBe(true);
    const appliedBond = applySummerStoryBondConsequence(initialState.characterBonds, story);
    expect(appliedBond.applied).toBe(true);
    const duplicateBond = applySummerStoryBondConsequence(appliedBond.bonds, story);
    expect(duplicateBond.applied).toBe(false);
    expect(duplicateBond.bonds).toBe(appliedBond.bonds);

    const state = {
      ...initialState,
      campaignRun,
      worldHistory: world.worldHistory,
      characterBonds: appliedBond.bonds,
    } as GameState;
    const loaded = inspectSavedGame(serializeSavedGame(state));
    expect(loaded.status).toBe('valid');
    expect(loaded.state.campaignRun.activeCampaign).toBe(campaign);
    expect(loaded.state.campaignRun.majorOutcomes.guardian_festival).toBe(expectedOutcome);
    expect(loaded.state.campaignRun.claimedSeasonalObjectives).toEqual([seasonal.claimKey]);
    expect(loaded.state.worldHistory).toEqual(world.worldHistory);
    expect(loaded.state.characterBonds).toEqual(appliedBond.bonds);

    const duplicateSeasonal = resolveSummerCampaignAction({
      year: 2,
      week: 4,
      campaign,
      facts: [fact],
      claimedKeys: loaded.state.campaignRun.claimedSeasonalObjectives,
    });
    expect(duplicateSeasonal).toEqual(expect.objectContaining({
      accepted: false,
      reason: 'already_claimed',
      claimKey: seasonal.claimKey,
    }));

    const replayWorld = resolveGuardianFestivalWorldOutcome({
      outcome: expectedOutcome === 'defeat' ? 'victory' : 'defeat',
      worldHistory: loaded.state.worldHistory,
      majorOutcomes: loaded.state.campaignRun.majorOutcomes,
      failForwardOutcomes: loaded.state.campaignRun.failForwardOutcomes,
    });
    expect(replayWorld.applied).toBe(false);
    expect(replayWorld.outcome).toBe(expectedOutcome);

    const presentation = summerCampaignStoryPresentation(
      loaded.state.campaignRun.activeCampaign,
      loaded.state.campaignRun.majorOutcomes.guardian_festival,
      loaded.state.characterBonds,
    );
    const ui = buildSummerStoryUiModel(presentation);
    expect(presentation.status).toBe('resolved');
    expect(ui.phase).toBe('Guardian Festival 이후');
    expect(ui.bond).not.toBeNull();
    expect(ui.journey.beats).toHaveLength(2);
    const serializedUi = JSON.stringify(ui);
    expect(serializedUi).not.toContain('campaignAffinities');
    expect(serializedUi).not.toContain('"trust"');

    const reloaded = inspectSavedGame(serializeSavedGame(loaded.state));
    expect(reloaded.status).toBe('valid');
    expect(reloaded.state).toEqual(loaded.state);
  });

  it('repairs malformed Summer persistence deterministically before consumer reconciliation', () => {
    const validClaim = resolveSummerCampaignAction({
      year: 2,
      week: 2,
      campaign: 'vanguard',
      facts: ['ally_survival'],
      claimedKeys: [],
    });
    expect(validClaim.accepted).toBe(true);
    if (!validClaim.accepted) return;

    const raw = {
      ...initialState,
      campaignRun: {
        ...initialState.campaignRun,
        activeCampaign: 'not-a-campaign',
        claimedSeasonalObjectives: [
          validClaim.claimKey,
          validClaim.claimKey,
          '02-summer:vanguard:summer_vanguard_chain',
          'bad',
        ],
        majorOutcomes: { guardian_festival: 'defeat' },
        seasonMilestones: ['summer_resolved', 'bad'],
        failForwardOutcomes: ['guardian_festival', 'guardian_festival', 'bad'],
      },
      worldHistory: {
        currentFacts: ['festival_saved', 'bad'],
        inheritedFacts: ['ancient_route_opened', 'bad'],
      },
    } as unknown as GameState;

    const hydrated = inspectSavedGame(serializeSavedGame(raw));
    expect(hydrated.status).toBe('valid');
    expect(hydrated.state.campaignRun.activeCampaign).toBeNull();
    expect(hydrated.state.campaignRun.claimedSeasonalObjectives).toEqual([validClaim.claimKey]);
    expect(hydrated.state.campaignRun.seasonMilestones).toEqual(['summer_resolved']);
    expect(hydrated.state.campaignRun.failForwardOutcomes).toEqual(['guardian_festival']);
    expect(hydrated.state.worldHistory.currentFacts).toEqual(['festival_saved']);
    expect(hydrated.state.worldHistory.inheritedFacts).toEqual(['ancient_route_opened']);

    const reconciled = resolveGuardianFestivalWorldOutcome({
      outcome: null,
      worldHistory: hydrated.state.worldHistory,
      majorOutcomes: hydrated.state.campaignRun.majorOutcomes,
      failForwardOutcomes: hydrated.state.campaignRun.failForwardOutcomes,
    });
    expect(reconciled.applied).toBe(false);
    expect(reconciled.outcome).toBe('defeat');
    expect(reconciled.worldHistory.currentFacts).toEqual(['festival_heavy_losses']);
    expect(reconciled.worldHistory.inheritedFacts).toEqual(['ancient_route_opened']);
    expect(reconciled.failForwardOutcomes).toEqual(['guardian_festival']);

    const again = inspectSavedGame(serializeSavedGame(hydrated.state));
    expect(again.status).toBe('valid');
    expect(again.state).toEqual(hydrated.state);
  });
});
