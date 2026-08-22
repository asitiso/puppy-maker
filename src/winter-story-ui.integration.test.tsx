import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import WinterEndingHub from './WinterEndingHub';
import { emptyCareerRecords, type CareerTitleId } from './career-records';
import { emptyCharacterBondsState } from './character-bonds';
import {
  applyWinterBondResolution,
  resolveWinterEndingStory,
  type WinterEndingStoryInput,
} from './winter-ending-story';
import { buildWinterStoryUiModel } from './winter-story-ui';

const cases: Array<{
  campaign: WinterEndingStoryInput['campaign'];
  autumnChoice: WinterEndingStoryInput['autumnChoice'];
  outcome: WinterEndingStoryInput['longNightOutcome'];
  character: string;
}> = [
  { campaign: 'caretaker', autumnChoice: 'team_solution', outcome: 'defeat', character: '미라' },
  { campaign: 'pathfinder', autumnChoice: 'limited_access', outcome: 'costly_victory', character: '카엘' },
  { campaign: 'vanguard', autumnChoice: 'coalition_command', outcome: 'victory', character: '렉스' },
  { campaign: 'arcanist', autumnChoice: 'controlled_use', outcome: 'exceptional_victory', character: '셀레네' },
];

const careerTitles: CareerTitleId[] = ['steady_trainer', 'seasoned_explorer', 'warm_giver', 'veteran_guardian'];

for (const route of cases) {
  describe(`Winter Lane A · ${route.campaign}`, () => {
    it('composes authoritative Long Night semantics into four qualitative Ending axes and final presentation', () => {
      const bonds = emptyCharacterBondsState();
      const result = resolveWinterEndingStory({
        campaign: route.campaign,
        autumnChoice: route.autumnChoice,
        longNightOutcome: route.outcome,
        characterBonds: bonds,
        careerRecords: { ...emptyCareerRecords(), trainings: 12, outings: 11, gifts: 6, monthsCompleted: 4 },
        careerTitles,
      });
      expect(result.status).toBe('resolved');

      const applied = applyWinterBondResolution(bonds, result.bondAftermath);
      expect(applied.applied).toBe(true);
      const replay = applyWinterBondResolution(applied.bonds, result.bondAftermath);
      expect(replay.applied).toBe(false);

      const model = buildWinterStoryUiModel(result, applied.bonds);
      expect(model.axes).toHaveLength(4);
      expect(model.axes.map(axis => axis.id)).toEqual(['campaign', 'bond', 'world', 'career']);
      expect(model.vn.name).toBe(route.character);
      expect(model.endingCommitted).toBe(true);
      expect(model.epilogue.body.length).toBeGreaterThan(0);

      const home = renderToStaticMarkup(<WinterEndingHub open={false} model={model} onOpen={() => undefined} onClose={() => undefined} />);
      const ending = renderToStaticMarkup(<WinterEndingHub open model={model} onOpen={() => undefined} onClose={() => undefined} />);
      expect(home).toContain('Long Night');
      expect(ending).toContain('Campaign Resolution');
      expect(ending).toContain('Character Bond Resolution');
      expect(ending).toContain('World Resolution');
      expect(ending).toContain('Career Resolution');
      expect(ending).toContain(route.character);
      expect(ending).not.toMatch(/affinity|trust\s*[:=]|rawScore|careerScore|requirementScore|\d+\s*\/\s*100/i);
      expect(JSON.stringify(model)).not.toMatch(/campaignAffinities|trustScore|careerScore|rawScore|requirementScore/i);

      if (route.outcome === 'defeat') {
        expect(model.longNightResult).toMatch(/패배|상처|밤/);
        expect(ending).toContain('결말 기록 완료');
      }
    });
  });
}

it('rejects malformed campaign/choice composition instead of inventing a valid ending presentation', () => {
  const result = resolveWinterEndingStory({
    campaign: 'caretaker',
    autumnChoice: 'controlled_use',
    longNightOutcome: 'victory',
    characterBonds: emptyCharacterBondsState(),
    careerRecords: emptyCareerRecords(),
    careerTitles: [],
  });
  expect(result.status).toBe('invalid_input');
  expect(() => buildWinterStoryUiModel(result, emptyCharacterBondsState())).toThrow(/invalid/i);
});
