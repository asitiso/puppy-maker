import { describe, expect, it } from 'vitest';
import { buildHollowTemptationPresentation } from './hollow-path-experience';

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
    expect(fractured.vey r).toBeUndefined();

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
      id: 'vey r_final_offer',
      prompt: '베이르가 마지막으로 손을 내밀어요. 지금의 길을 버릴지, 여기서 멈출지는 아직 당신의 선택이에요.',
      accept: { id: 'accept_hollow', label: '베이르의 손을 잡는다' },
      refuse: { id: 'refuse_hollow', label: '여기서 멈추고 지금의 길을 지킨다' },
    });
  });
});
