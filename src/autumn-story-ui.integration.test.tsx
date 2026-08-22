import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AutumnHubOverlay from './AutumnHubOverlay';
import { emptyCharacterBondsState } from './character-bonds';
import {
  applyAutumnChoiceBondConsequence,
  autumnChoicePresentation,
  commitAutumnMajorChoice,
  resolveAutumnChoiceOptions,
} from './autumn-major-choice';
import { buildAutumnStoryUiModel } from './autumn-story-ui';

const cases = [
  { campaign: 'caretaker', choice: 'team_solution', outcome: 'defeat', character: '미라', thirdEligible: true },
  { campaign: 'pathfinder', choice: 'limited_access', outcome: 'costly_victory', character: '카엘', thirdEligible: true },
  { campaign: 'vanguard', choice: 'preserve_independence', outcome: 'victory', character: '렉스', thirdEligible: false },
  { campaign: 'arcanist', choice: 'controlled_use', outcome: 'exceptional_victory', character: '셀레네', thirdEligible: true },
] as const;

describe('Autumn Lane A story + Major Choice + UI vertical slice', () => {
  it.each(cases)('$campaign commits one semantic choice and reflects its aftermath without raw scores', ({ campaign, choice, outcome, character, thirdEligible }) => {
    const context = { thirdEligible, characterBonds: emptyCharacterBondsState() };
    const resolution = resolveAutumnChoiceOptions(campaign, context);
    expect(resolution.baseOptions).toHaveLength(2);
    expect(resolution.earned.available).toBe(thirdEligible);

    const committed = commitAutumnMajorChoice(campaign, choice, context, null, outcome);
    expect(committed.status).toBe('committed');
    expect(committed.commitment?.optionId).toBe(choice);
    expect(committed.aftermath?.outcome).toBe(outcome);

    const applied = applyAutumnChoiceBondConsequence(context.characterBonds, committed.aftermath);
    expect(applied.applied).toBe(true);

    const presentation = autumnChoicePresentation(resolution);
    const model = buildAutumnStoryUiModel({
      presentation,
      commitment: committed.commitment,
      aftermath: committed.aftermath,
      bonds: applied.bonds,
      greatExpeditionResult: `Great Expedition · ${outcome}`,
    }, '가을 · 1월');

    expect(model.majorChoice.options).toHaveLength(3);
    expect(model.majorChoice.options.filter(option => option.available)).toHaveLength(thirdEligible ? 3 : 2);
    expect(model.majorChoice.committedChoiceId).toBe(choice);
    expect(model.bond?.name).toBe(character);
    expect(model.relationshipChange.length).toBeGreaterThan(0);
    expect(model.journey.framing).toContain('Great Expedition');
    expect(model.vn.dialogue.length).toBeGreaterThan(0);

    const home = renderToStaticMarkup(<AutumnHubOverlay open={false} model={model} onOpen={() => undefined} onClose={() => undefined} onCommitChoice={() => undefined} />);
    const journey = renderToStaticMarkup(<AutumnHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} onCommitChoice={() => undefined} />);

    expect(home).toContain(model.campaign);
    expect(home).toContain(model.relationshipChange);
    expect(home).toContain('Great Expedition');
    expect((home.match(new RegExp(model.primaryCta, 'g')) ?? []).length).toBe(1);
    expect(journey).toContain('MAJOR CHOICE');
    expect(journey).toContain(character);
    expect(journey).toContain('AUTUMN SCENE');
    expect(journey).toContain('선택됨');

    const serialized = JSON.stringify(model);
    expect(serialized).not.toMatch(/campaignAffinities|rawScore|trustScore|requirementScore/i);
    expect(serialized).not.toMatch(/"trust"\s*:/i);
    expect(journey).not.toContain('/ 100');
  });

  it('keeps an unavailable earned third option visible as a qualitative hint rather than a hidden numeric checklist', () => {
    const context = { thirdEligible: false, characterBonds: emptyCharacterBondsState() };
    const resolution = resolveAutumnChoiceOptions('caretaker', context);
    const model = buildAutumnStoryUiModel({
      presentation: autumnChoicePresentation(resolution),
      commitment: null,
      aftermath: null,
      bonds: context.characterBonds,
      greatExpeditionResult: 'Great Expedition · costly_victory',
    }, '가을 · 1월');

    const earned = model.majorChoice.options[2];
    expect(earned.available).toBe(false);
    expect(earned.lockedHint?.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(<AutumnHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} onCommitChoice={() => undefined} />);
    expect(html).toContain(earned.lockedHint!);
    expect(html).toContain('아직 선택할 수 없음');
    expect(html).not.toMatch(/\b\d+\s*점|\d+\s*\/\s*100|affinity|trustScore/i);
  });
});
