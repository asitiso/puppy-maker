import { describe, expect, it } from 'vitest';
import { initialState, type GameState } from './game';
import { inspectSavedGame, serializeSavedGame } from './save-schema';
import type { MainCampaignId, MajorChoiceOptionId, MajorOutcomeResult } from './campaign-model';
import { buildGreatExpeditionWorldPrerequisite } from './campaign-world';
import { getAutumnGreatExpeditionWorldRoute } from './autumn-campaign-world';
import {
  createTacticalScenarioBattle,
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  resolveTacticalScenarioResult,
} from './tactical-scenario';
import {
  autumnWorldRouteToTacticalClimax,
  greatExpeditionEvidenceFromTacticalResult,
} from './autumn-world-tactical-lane';
import {
  commitAutumnMajorChoice as commitAutumnStateChoice,
  resolveAutumnCampaignAction,
  resolveAutumnMajorChoice,
  resolveAutumnThirdOptionEligibility,
  selectWinterCampaignInput,
  type AutumnCampaignActionFact,
  type AutumnEvidenceTag,
} from './campaign-autumn-season';
import {
  applyAutumnChoiceBondConsequence,
  autumnChoicePresentation,
  commitAutumnMajorChoice as commitAutumnStoryChoice,
  resolveAutumnChoiceOptions,
} from './autumn-major-choice';
import { buildAutumnStoryUiModel } from './autumn-story-ui';
import { getAutumnMajorChoiceWorldFacts } from './autumn-world-consequences';
import { prepareNewRunState } from './v3-persistent-state';

const progression = { maxHp: 120, agility: 15, power: 24, magic: 20 };
const companions = ['bear', 'owl'] as const;

const cases = [
  {
    campaign: 'caretaker',
    actionFact: 'great_expedition_protect',
    evidence: ['bond_support', 'protected_civilians'],
    choice: 'team_solution',
    thirdEligible: true,
    outcome: 'exceptional_victory',
    worldFact: 'caretaker_team_solution',
    seed: 401,
  },
  {
    campaign: 'pathfinder',
    actionFact: 'great_expedition_discovery',
    evidence: ['discovery_evidence', 'limited_route_evidence'],
    choice: 'limited_access',
    thirdEligible: true,
    outcome: 'costly_victory',
    worldFact: 'ancient_route_limited',
    seed: 402,
  },
  {
    campaign: 'vanguard',
    actionFact: 'great_expedition_command',
    evidence: ['ally_support'],
    choice: 'preserve_independence',
    thirdEligible: false,
    outcome: 'victory',
    worldFact: 'regional_alliance',
    seed: 403,
  },
  {
    campaign: 'arcanist',
    actionFact: 'great_expedition_relic',
    evidence: ['relic_control_evidence', 'astral_mastery'],
    choice: 'controlled_use',
    thirdEligible: true,
    outcome: 'defeat',
    worldFact: 'forbidden_relic_controlled',
    seed: 404,
  },
] as const satisfies readonly {
  campaign: MainCampaignId;
  actionFact: AutumnCampaignActionFact;
  evidence: readonly AutumnEvidenceTag[];
  choice: MajorChoiceOptionId;
  thirdEligible: boolean;
  outcome: MajorOutcomeResult;
  worldFact: string;
  seed: number;
}[];

function terminalEvidence(campaign: MainCampaignId, seed: number) {
  const prerequisiteInput = {
    activeCampaign: campaign,
    worldHistory: {
      currentFacts: ['festival_saved'],
      inheritedFacts: ['rift_stabilized'],
    },
    majorOutcomes: { guardian_festival: 'victory' },
    failForwardOutcomes: [],
  } as const;
  const prerequisite = buildGreatExpeditionWorldPrerequisite(prerequisiteInput);
  expect(prerequisite.ready).toBe(true);

  const route = getAutumnGreatExpeditionWorldRoute(campaign, prerequisiteInput);
  expect(route).not.toBeNull();
  const climax = autumnWorldRouteToTacticalClimax(route!);
  const battle = createTacticalScenarioBattle(climax, companions, progression, seed);

  const terminalBattle = campaign === 'caretaker'
    ? {
        ...battle,
        round: 5,
        units: battle.units.map(unit => unit.side === 'enemy'
          ? { ...unit, hp: 0 }
          : { ...unit, hp: unit.maxHp }),
      }
    : campaign === 'pathfinder'
      ? { ...battle, round: 4 }
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

  const terminal = resolveTacticalScenarioResult(climax, terminalBattle, `autumn-wave:${campaign}`);
  expect(terminal).not.toBeNull();
  const first = handoffTacticalTerminalResult(createTacticalTerminalHandoffState(), terminal!);
  expect(first.result).not.toBeNull();
  const replay = handoffTacticalTerminalResult(first.state, terminal!);
  expect(replay.result).toBeNull();

  return greatExpeditionEvidenceFromTacticalResult(route!, first.result!, prerequisite);
}

function differentChoice(campaign: MainCampaignId, selected: MajorChoiceOptionId): MajorChoiceOptionId {
  const alternatives: Record<MainCampaignId, MajorChoiceOptionId[]> = {
    caretaker: ['save_one', 'spread_risk'],
    pathfinder: ['open_route', 'seal_route'],
    vanguard: ['centralize', 'preserve_independence'],
    arcanist: ['use_relic', 'destroy_relic'],
  };
  return alternatives[campaign].find(choice => choice !== selected)!;
}

describe('V3 Autumn final Wave E2E', () => {
  it.each(cases)(
    '$campaign flows Summer history -> Great Expedition -> Major Choice -> World/Bond/Season -> save/reload',
    ({ campaign, actionFact, evidence: eligibilityEvidence, choice, thirdEligible, outcome: expectedOutcome, worldFact, seed }) => {
      const evidence = terminalEvidence(campaign, seed);
      expect(evidence.outcome).toBe(expectedOutcome);
      expect(evidence.currentFacts).toEqual(['festival_saved']);
      expect(evidence.inheritedFacts).toEqual(['rift_stabilized']);

      const seasonal = resolveAutumnCampaignAction({
        year: 3,
        week: 2,
        campaign,
        facts: [actionFact],
        claimedKeys: [],
      });
      expect(seasonal.accepted).toBe(true);
      if (!seasonal.accepted) return;
      expect(seasonal.claimKey).toContain(`autumn:${campaign}:`);

      const eligibility = resolveAutumnThirdOptionEligibility({ campaign, evidence: eligibilityEvidence });
      expect(eligibility.eligible).toBe(thirdEligible);

      const storyOptions = resolveAutumnChoiceOptions(campaign, {
        thirdEligible: eligibility.eligible,
        characterBonds: initialState.characterBonds,
      });
      expect(storyOptions.earned.available).toBe(thirdEligible);
      expect(storyOptions.options.includes(storyOptions.earned.optionId)).toBe(thirdEligible);

      if (!thirdEligible) {
        const locked = resolveAutumnMajorChoice({
          campaign,
          choice: storyOptions.earned.optionId,
          thirdEligible: false,
        });
        expect(locked).toEqual({ accepted: false, reason: 'choice_locked' });
      }

      const stateChoice = resolveAutumnMajorChoice({ campaign, choice, thirdEligible: eligibility.eligible });
      expect(stateChoice.accepted).toBe(true);
      if (!stateChoice.accepted) return;

      const stateCommitted = commitAutumnStateChoice({
        ...initialState.campaignRun,
        activeCampaign: campaign,
        claimedSeasonalObjectives: [seasonal.claimKey],
        majorOutcomes: {
          guardian_festival: 'victory',
          great_expedition: evidence.outcome,
        },
        failForwardOutcomes: evidence.failForward ? ['great_expedition'] : [],
      }, stateChoice);
      expect(stateCommitted.committed).toBe(true);
      if (!stateCommitted.committed) return;
      expect(stateCommitted.state.seasonMilestones).toContain('autumn_resolved');

      const storyCommit = commitAutumnStoryChoice(
        campaign,
        choice,
        { thirdEligible: eligibility.eligible, characterBonds: initialState.characterBonds },
        null,
        evidence.outcome,
      );
      expect(storyCommit.status).toBe('committed');
      expect(storyCommit.commitment).not.toBeNull();
      expect(storyCommit.aftermath).not.toBeNull();

      const bonded = applyAutumnChoiceBondConsequence(initialState.characterBonds, storyCommit.aftermath);
      expect(bonded.applied).toBe(true);
      const duplicateBond = applyAutumnChoiceBondConsequence(bonded.bonds, storyCommit.aftermath);
      expect(duplicateBond.applied).toBe(false);
      expect(duplicateBond.bonds).toBe(bonded.bonds);

      const consequenceFacts = getAutumnMajorChoiceWorldFacts(campaign, choice);
      expect(consequenceFacts).toEqual([worldFact]);
      const worldHistory = {
        currentFacts: [...evidence.currentFacts, ...(consequenceFacts ?? [])],
        inheritedFacts: [...evidence.inheritedFacts],
      };

      const state = {
        ...initialState,
        campaignRun: stateCommitted.state,
        worldHistory,
        characterBonds: bonded.bonds,
      } as GameState;
      const loaded = inspectSavedGame(serializeSavedGame(state));
      expect(loaded.status).toBe('valid');
      expect(loaded.schemaVersion).toBe(3);
      expect(loaded.state.campaignRun.activeCampaign).toBe(campaign);
      expect(loaded.state.campaignRun.majorOutcomes.great_expedition).toBe(expectedOutcome);
      expect(loaded.state.campaignRun.majorChoices[stateChoice.majorChoiceId]).toBe(choice);
      expect(loaded.state.campaignRun.claimedSeasonalObjectives).toEqual([seasonal.claimKey]);
      expect(loaded.state.campaignRun.seasonMilestones).toContain('autumn_resolved');
      expect(loaded.state.worldHistory.currentFacts).toContain(worldFact);
      expect(loaded.state.worldHistory.inheritedFacts).toEqual(['rift_stabilized']);
      expect(loaded.state.characterBonds).toEqual(bonded.bonds);

      const duplicateSeasonal = resolveAutumnCampaignAction({
        year: 3,
        week: 4,
        campaign,
        facts: [actionFact],
        claimedKeys: loaded.state.campaignRun.claimedSeasonalObjectives,
      });
      expect(duplicateSeasonal).toEqual(expect.objectContaining({
        accepted: false,
        reason: 'already_claimed',
        claimKey: seasonal.claimKey,
      }));

      const conflictingChoice = resolveAutumnMajorChoice({
        campaign,
        choice: differentChoice(campaign, choice),
        thirdEligible: false,
      });
      expect(conflictingChoice.accepted).toBe(true);
      if (conflictingChoice.accepted) {
        const replay = commitAutumnStateChoice(loaded.state.campaignRun, conflictingChoice);
        expect(replay.committed).toBe(false);
        expect(replay.state).toBe(loaded.state.campaignRun);
        expect(replay.state.majorChoices[stateChoice.majorChoiceId]).toBe(choice);
      }

      const storyReplay = commitAutumnStoryChoice(
        campaign,
        choice,
        { thirdEligible: eligibility.eligible, characterBonds: loaded.state.characterBonds },
        storyCommit.commitment,
        evidence.outcome,
      );
      expect(storyReplay.status).toBe('already_committed');
      expect(storyReplay.aftermath).toBeNull();

      expect(selectWinterCampaignInput(loaded.state.campaignRun)).toEqual({
        campaignId: campaign,
        autumnChoiceId: choice,
        greatExpeditionOutcome: expectedOutcome,
      });

      const presentation = autumnChoicePresentation(storyOptions);
      const ui = buildAutumnStoryUiModel({
        presentation,
        commitment: storyCommit.commitment,
        aftermath: storyCommit.aftermath,
        bonds: loaded.state.characterBonds,
        greatExpeditionResult: expectedOutcome,
      }, 'Autumn');
      expect(ui.phase).toBe('Major Choice 결정 이후');
      expect(ui.journey.beats).toHaveLength(2);
      expect(ui.bond).not.toBeNull();
      const serializedUi = JSON.stringify(ui);
      expect(serializedUi).not.toContain('campaignAffinities');
      expect(serializedUi).not.toContain('thirdEligible');
      expect(serializedUi).not.toContain('"trust"');

      const reloaded = inspectSavedGame(serializeSavedGame(loaded.state));
      expect(reloaded.status).toBe('valid');
      expect(reloaded.state).toEqual(loaded.state);
    },
  );

  it('sanitizes malformed Autumn persistence deterministically before Winter selection', () => {
    const validClaim = resolveAutumnCampaignAction({
      year: 3,
      week: 2,
      campaign: 'vanguard',
      facts: ['great_expedition_command'],
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
          '03-autumn:vanguard:autumn_vanguard_command',
          '3-autumn:caretaker:autumn_vanguard_command',
          'bad',
        ],
        majorChoices: {
          vanguard_autumn: 'not-a-choice',
          caretaker_autumn: 'team_solution',
          bad_choice: 'bad',
        },
        majorOutcomes: {
          guardian_festival: 'victory',
          great_expedition: 'costly_victory',
          bad_event: 'victory',
        },
        seasonMilestones: ['autumn_resolved', 'bad'],
        failForwardOutcomes: ['great_expedition', 'great_expedition', 'bad'],
      },
      worldHistory: {
        currentFacts: ['coalition_command', 'bad'],
        inheritedFacts: ['rift_stabilized', 'bad'],
      },
    } as unknown as GameState;

    const hydrated = inspectSavedGame(serializeSavedGame(raw));
    expect(hydrated.status).toBe('valid');
    expect(hydrated.schemaVersion).toBe(3);
    expect(hydrated.state.campaignRun.activeCampaign).toBeNull();
    expect(hydrated.state.campaignRun.claimedSeasonalObjectives).toEqual([validClaim.claimKey]);
    expect(hydrated.state.campaignRun.majorChoices).toEqual({ caretaker_autumn: 'team_solution' });
    expect(hydrated.state.campaignRun.majorOutcomes).toEqual({
      guardian_festival: 'victory',
      great_expedition: 'costly_victory',
    });
    expect(hydrated.state.campaignRun.seasonMilestones).toEqual(['autumn_resolved']);
    expect(hydrated.state.campaignRun.failForwardOutcomes).toEqual(['great_expedition']);
    expect(hydrated.state.worldHistory.currentFacts).toEqual(['coalition_command']);
    expect(hydrated.state.worldHistory.inheritedFacts).toEqual(['rift_stabilized']);
    expect(selectWinterCampaignInput(hydrated.state.campaignRun)).toBeNull();

    const again = inspectSavedGame(serializeSavedGame(hydrated.state));
    expect(again.status).toBe('valid');
    expect(again.state).toEqual(hydrated.state);
  });

  it('resets Autumn run state for a new run while preserving Legacy', () => {
    const current = {
      ...initialState,
      campaignRun: {
        ...initialState.campaignRun,
        activeCampaign: 'vanguard' as const,
        claimedSeasonalObjectives: ['3-autumn:vanguard:autumn_vanguard_command'],
        majorChoices: { vanguard_autumn: 'coalition_command' as const },
        majorOutcomes: {
          guardian_festival: 'victory' as const,
          great_expedition: 'victory' as const,
        },
        seasonMilestones: ['autumn_resolved' as const],
      },
    };
    const next = prepareNewRunState(current);
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.campaignRun.majorChoices).toEqual({});
    expect(next.campaignRun.majorOutcomes).toEqual({});
    expect(next.campaignRun.seasonMilestones).toEqual([]);
    expect(selectWinterCampaignInput(next.campaignRun)).toBeNull();
    expect(next.legacy).toEqual(current.legacy);
  });
});
