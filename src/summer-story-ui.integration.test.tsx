import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import SummerHubOverlay from './SummerHubOverlay';
import { emptyCharacterBondsState } from './character-bonds';
import {
  applySummerStoryBondConsequence,
  resolveSummerCampaignStory,
  summerCampaignStoryPresentation,
} from './summer-campaign-story';
import { buildSummerStoryUiModel } from './summer-story-ui';

const cases = [
  { campaign: 'caretaker', outcome: 'defeat', label: 'Caretaker', character: '미라', title: '함께 지키는 여름', consequence: 'conflict' },
  { campaign: 'pathfinder', outcome: 'costly_victory', label: 'Pathfinder', character: '카엘', title: '경계 너머의 여름', consequence: 'conflict' },
  { campaign: 'vanguard', outcome: 'victory', label: 'Vanguard', character: '렉스', title: '승리 뒤에 남는 것', consequence: 'promise' },
  { campaign: 'arcanist', outcome: 'exceptional_victory', label: 'Arcanist', character: '셀레네', title: '힘을 멈출 줄 아는 지식', consequence: 'promise' },
] as const;

describe('Summer Lane A story + UI vertical slice', () => {
  it.each(cases)('$campaign / $outcome reflects story, Bond, Home, Journey and VN without raw scores', ({
    campaign,
    outcome,
    label,
    character,
    title,
    consequence,
  }) => {
    const result = resolveSummerCampaignStory(campaign, outcome);
    expect(result.resolved).toBe(true);

    const applied = applySummerStoryBondConsequence(emptyCharacterBondsState(), result);
    expect(applied.applied).toBe(true);

    const presentation = summerCampaignStoryPresentation(campaign, outcome, applied.bonds);
    const model = buildSummerStoryUiModel(presentation, '여름 · 1월');

    expect(model.campaign).toBe(label);
    expect(model.journey.title).toBe(title);
    expect(model.journey.framing).toContain('Guardian Festival');
    expect(model.journey.nextAction.length).toBeGreaterThan(0);
    expect(model.relationshipChange.length).toBeGreaterThan(0);
    expect(model.festivalResult.length).toBeGreaterThan(0);
    expect(model.bond?.name).toBe(character);
    expect(model.vn.name).toBe(character);
    expect(model.vn.dialogue.length).toBeGreaterThan(0);

    if (consequence === 'conflict') {
      expect(model.bond?.conflicts.length).toBeGreaterThan(0);
      expect(model.vn.dialogue).toMatch(/계속|다음|끝이 아니/);
    } else {
      expect(model.bond?.promises.length).toBeGreaterThan(0);
    }

    const home = renderToStaticMarkup(<SummerHubOverlay open={false} model={model} onOpen={() => undefined} onClose={() => undefined} />);
    const journey = renderToStaticMarkup(<SummerHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);

    expect(home).toContain(label);
    expect(home).toContain(model.relationshipChange);
    expect(home).toContain(model.festivalResult);
    expect((home.match(new RegExp(model.primaryCta, 'g')) ?? []).length).toBe(1);

    expect(journey).toContain(title);
    expect(journey).toContain('Guardian Festival');
    expect(journey).toContain(character);
    expect(journey).toContain('SUMMER SCENE');
    expect(journey).not.toContain('src=""');

    const serialized = JSON.stringify(model);
    expect(serialized).not.toMatch(/campaignAffinities|rawScore|affinity/i);
    expect(serialized).not.toMatch(/"trust"\s*:/i);
    expect(journey).not.toContain('/ 100');
  });

  it('does not emit a React warning when a Summer character portrait is unavailable', () => {
    const result = resolveSummerCampaignStory('caretaker', 'defeat');
    const applied = applySummerStoryBondConsequence(emptyCharacterBondsState(), result);
    const presentation = summerCampaignStoryPresentation('caretaker', 'defeat', applied.bonds);
    const model = buildSummerStoryUiModel(presentation, '여름 · 1월');
    const warnings: string[] = [];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      warnings.push(args.map(String).join(' '));
    });

    renderToStaticMarkup(<SummerHubOverlay open model={model} onOpen={() => undefined} onClose={() => undefined} />);
    errorSpy.mockRestore();

    expect(warnings.join('\n')).not.toMatch(/empty string.*src attribute/i);
  });
});
