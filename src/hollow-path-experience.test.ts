import { describe, expect, it } from 'vitest';
import {
  buildHollowCampaignPresentation,
  buildHollowChoiceAftermathPresentation,
  buildHollowEndingPresentation,
  buildHollowTemptationPresentation,
} from './hollow-path-experience';

describe('Hollow Path temptation presentation contract', () => {
  it('keeps the current route playable while the atmosphere shifts without exposing hidden danger internals', () => {
    const stable = buildHollowTemptationPresentation({
      dangerTier: 'stable',
      currentRouteLabel: 'Caretaker',
      inheritedEcho: false,
      finalChoiceAvailable: false,
    });
    const fractured = buildHollowTemptationPresentation({
      dangerTier: 'fractured',
      currentRouteLabel: 'Caretaker',
      inheritedEcho: false,
      finalChoiceAvailable: false,
    });

    expect(stable.routeLabel).toBe('Caretaker');
    expect(fractured.routeLabel).toBe('Caretaker');
    expect(stable.autoSelectedRoute).toBeNull();
    expect(fractured.autoSelectedRoute).toBeNull();
    expect(stable.finalChoice).toBeNull();
    expect(fractured.finalChoice).toBeNull();
    expect(fractured.atmosphere).not.toBe(stable.atmosphere);
    expect(fractured.temptation.shortTermBenefit.length).toBeGreaterThan(0);
    expect(fractured.veyr.length).toBeGreaterThan(0);

    const visible = JSON.stringify({
      routeLabel: fractured.routeLabel,
      atmosphere: fractured.atmosphere,
      veyr: fractured.veyr,
      temptation: fractured.temptation,
      inheritedEcho: fractured.inheritedEcho,
      finalChoice: fractured.finalChoice,
    });
    expect(visible).not.toMatch(/stable|fractured|hollow_candidate|danger|score|threshold|\d+\s*\/\s*100/i);
  });

  it('surfaces a diegetic explicit accept/refuse choice only when the authoritative final opportunity is available', () => {
    const candidate = buildHollowTemptationPresentation({
      dangerTier: 'hollow_candidate',
      currentRouteLabel: 'True Path',
      inheritedEcho: true,
      finalChoiceAvailable: true,
    });

    expect(candidate.routeLabel).toBe('True Path');
    expect(candidate.autoSelectedRoute).toBeNull();
    expect(candidate.inheritedEcho).toContain('지난 삶');
    expect(candidate.finalChoice).toEqual({
      id: 'veyr_final_offer',
      prompt: '베이르가 마지막으로 손을 내밀어요. 지금의 길을 버릴지, 여기서 멈출지는 아직 당신의 선택이에요.',
      accept: { id: 'accept_hollow', label: '베이르의 손을 잡는다' },
      refuse: { id: 'refuse_hollow', label: '여기서 멈추고 지금의 길을 지킨다' },
    });
  });
});

describe('Hollow Path explicit choice aftermath', () => {
  it('makes refusal meaningful while preserving the authoritative current route', () => {
    const refused = buildHollowChoiceAftermathPresentation({
      result: 'refused',
      activeRoute: 'true_path',
      currentRouteLabel: 'True Path',
    });

    expect(refused.hollowActive).toBe(false);
    expect(refused.routeLabel).toBe('True Path');
    expect(refused.title).toBe('손을 놓은 뒤');
    expect(refused.summary).toContain('지금의 길');
    expect(refused.bondConsequence).toContain('리라');
    expect(refused.autoSelectedRoute).toBeNull();
  });

  it('does not present Hollow from an accept result until the authoritative route is Hollow', () => {
    const pending = buildHollowChoiceAftermathPresentation({
      result: 'accepted',
      activeRoute: 'true_path',
      currentRouteLabel: 'True Path',
    });
    const committed = buildHollowChoiceAftermathPresentation({
      result: 'accepted',
      activeRoute: 'hollow',
      currentRouteLabel: 'True Path',
    });

    expect(pending.hollowActive).toBe(false);
    expect(pending.routeLabel).toBe('True Path');
    expect(pending.title).not.toMatch(/Hollow/i);

    expect(committed.hollowActive).toBe(true);
    expect(committed.routeLabel).toBe('Hollow Path');
    expect(committed.title).toBe('Hollow Path · 첫 번째 균열');
    expect(committed.veyr).toContain('이제');
    expect(committed.bondConsequence).toContain('리라');
    expect(committed.autoSelectedRoute).toBeNull();
  });
});

describe('Hollow Path playable campaign presentation', () => {
  it('does not open Hollow campaign presentation until the authoritative route is Hollow', () => {
    expect(buildHollowCampaignPresentation({
      activeRoute: 'true_path',
      chapter: 'summer',
      objective: '무너진 피난로를 확보한다',
      worldSignals: ['주민들이 지름길의 대가를 기억해요.'],
      bondSignals: ['리라는 선택의 이유를 묻고 있어요.'],
    })).toBeNull();
  });

  it('presents Summer and Autumn as useful-but-costly Hollow chapters driven by Veyr, World and Bond consequences', () => {
    const summer = buildHollowCampaignPresentation({
      activeRoute: 'hollow',
      chapter: 'summer',
      objective: '무너진 피난로를 확보한다',
      worldSignals: ['구조는 빨라졌지만 남겨진 마을이 생겼어요.'],
      bondSignals: ['리라는 결과보다 누구를 남겼는지 기억해요.'],
    });
    const autumn = buildHollowCampaignPresentation({
      activeRoute: 'hollow',
      chapter: 'autumn',
      objective: '분열된 동맹을 다시 움직인다',
      worldSignals: ['동맹은 움직였지만 약속의 의미가 달라졌어요.'],
      bondSignals: ['리라는 베이르의 말이 점점 당신의 말과 닮아간다고 느껴요.'],
    });

    expect(summer?.title).toBe('Hollow Path · Summer');
    expect(summer?.veyr).toContain('빠르');
    expect(summer?.tension.shortTermGain.length).toBeGreaterThan(0);
    expect(summer?.tension.longTermCost.length).toBeGreaterThan(0);
    expect(summer?.next).toBe('autumn');

    expect(autumn?.title).toBe('Hollow Path · Autumn');
    expect(autumn?.world).toEqual(['동맹은 움직였지만 약속의 의미가 달라졌어요.']);
    expect(autumn?.bond).toEqual(['리라는 베이르의 말이 점점 당신의 말과 닮아간다고 느껴요.']);
    expect(autumn?.next).toBe('winter');
  });

  it.each(['victory', 'costly_victory', 'defeat'] as const)(
    'keeps Winter outcome %s fail-forward into the Hollow ending',
    (outcome) => {
      const winter = buildHollowCampaignPresentation({
        activeRoute: 'hollow',
        chapter: 'winter',
        objective: '베이르와 함께 마지막 균열을 통과한다',
        outcome,
        worldSignals: ['세계는 선택의 흔적을 그대로 안고 다음 날을 맞아요.'],
        bondSignals: ['리라는 끝까지 당신의 선택을 자신의 기억으로 남겨요.'],
      });

      expect(winter?.title).toBe('Hollow Path · Long Night');
      expect(winter?.outcome).toBe(outcome);
      expect(winter?.resolution?.length).toBeGreaterThan(0);
      expect(winter?.next).toBe('hollow_ending');
    },
  );
});

describe('Hollow Ending qualitative epilogue', () => {
  it('does not present an ending before the authoritative ending state is reached', () => {
    expect(buildHollowEndingPresentation({
      reachedHollowEnding: false,
      outcome: 'victory',
      worldLegacy: ['마을은 선택의 흔적을 기억해요.'],
      bondLegacy: ['리라는 마지막 선택을 기억해요.'],
    })).toBeNull();
  });

  it.each(['victory', 'costly_victory', 'defeat'] as const)(
    'presents %s as a qualitative fail-forward epilogue without hidden optimization values',
    (outcome) => {
      const ending = buildHollowEndingPresentation({
        reachedHollowEnding: true,
        outcome,
        worldLegacy: ['세계는 지름길로 바뀐 약속을 기억해요.'],
        bondLegacy: ['리라는 끝까지 당신을 선택의 주체로 기억해요.'],
      });

      expect(ending?.id).toBe('hollow_ending');
      expect(ending?.title).toBe('Hollow Ending · 빈자리 이후');
      expect(ending?.outcome).toBe(outcome);
      expect(ending?.summary.length).toBeGreaterThan(0);
      expect(ending?.worldLegacy).toEqual(['세계는 지름길로 바뀐 약속을 기억해요.']);
      expect(ending?.bondLegacy).toEqual(['리라는 끝까지 당신을 선택의 주체로 기억해요.']);
      expect(ending?.future).toContain('다음 삶');

      expect(JSON.stringify(ending)).not.toMatch(/danger|score|affinity|trust\s*[:=]?\s*\d|threshold|rank|\d+\s*\/\s*100/i);
    },
  );
});
