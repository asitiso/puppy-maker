// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const tacticalSource=readFileSync(new URL('./TacticalExpeditionFlow.tsx',import.meta.url),'utf8');
const trainingSource=readFileSync(new URL('./TrainingActivityMinigame.tsx',import.meta.url),'utf8');
const buildSource=readFileSync(new URL('./V12BuildEditor.tsx',import.meta.url),'utf8');
const loadoutSource=readFileSync(new URL('./V12LoadoutPanel.tsx',import.meta.url),'utf8');

describe('V14 polish pass 2 mobile play-flow contracts',()=>{
  it('explains Guardian Expedition readiness beside the persistent Start CTA',()=>{
    expect(tacticalSource).toContain('aria-live="polite"');
    expect(tacticalSource).toContain('동료를 1명 이상 선택해야 원정을 시작할 수 있어요.');
    expect(tacticalSource).toContain('출발 준비 완료');
    expect(tacticalSource).toContain('인 파티');
  });

  it('uses one accessible live feedback contract across training activities',()=>{
    expect(trainingSource).toContain('className="training-minigame__feedback"');
    expect(trainingSource).toContain('role="status"');
    expect(trainingSource).toContain('aria-live="polite"');
  });

  it('makes the training completion handoff explicit and preserves run context',()=>{
    expect(trainingSource).toContain('현재 점수');
    expect(trainingSource).toContain('최고 콤보');
    expect(trainingSource).toContain('성장 결과 확인');
  });

  it('prevents no-op current-Leader re-selection while retaining explicit current semantics',()=>{
    expect(buildSource).toContain('disabled={locked || current}');
    expect(buildSource).toContain("aria-current={current ? 'true' : undefined}");
  });

  it('keeps loadout affinity and instant-apply/run-lock semantics textual rather than color-only',()=>{
    expect(loadoutSource).toContain("'전용 장비'");
    expect(loadoutSource).toContain("'선호 장비'");
    expect(loadoutSource).toContain("'공용 장비'");
    expect(loadoutSource).toContain('현재 런은 출발 시점의 로드아웃을 사용합니다.');
  });
});
