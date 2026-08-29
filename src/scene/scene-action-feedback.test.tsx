import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {sceneActionFeedback} from './scene-action-feedback';
import type {ResolvedSceneInteraction} from './scene-types';

const restInteraction={
  id:'bed',
  label:'잠깐 쉬기',
  mode:'rest',
  anchorId:'bed',
  enabled:true,
  hint:'accessible-idle',
} satisfies ResolvedSceneInteraction;

const stageSource=readFileSync(new URL('./SceneStage.tsx',import.meta.url),'utf8');
const interactionCss=readFileSync(new URL('./scene-interaction.css',import.meta.url),'utf8');

describe('V14 scene action feedback',()=>{
  it('turns runtime phases into concise progress and result copy without game-state coupling',()=>{
    expect(sceneActionFeedback(restInteraction,'idle')).toBeNull();
    expect(sceneActionFeedback(restInteraction,'approaching')).toEqual({
      message:'잠깐 쉬기 · 이동 중',
      tone:'info',
      busy:true,
    });
    expect(sceneActionFeedback(restInteraction,'acting')).toEqual({
      message:'잠깐 쉬기 · 진행 중',
      tone:'info',
      busy:true,
    });
    expect(sceneActionFeedback(restInteraction,'committing')).toEqual({
      message:'잠깐 쉬기 · 반영 중',
      tone:'info',
      busy:true,
    });
    expect(sceneActionFeedback(restInteraction,'presenting')).toEqual({
      message:'잠깐 쉬기 · 휴식 선택을 확인했어요.',
      tone:'success',
      busy:false,
    });
  });

  it('connects feedback to the shared stage with accessible live semantics',()=>{
    expect(stageSource).toContain('sceneActionFeedback(');
    expect(stageSource).toContain('v14-scene-action-feedback');
    expect(stageSource).toContain('role="status"');
    expect(stageSource).toContain('aria-live="polite"');
    expect(stageSource).toContain('aria-atomic="true"');
    expect(stageSource).toContain('aria-busy={actionFeedback.busy}');
  });

  it('keeps feedback readable and compact across scene layouts',()=>{
    expect(interactionCss).toContain('.v14-scene-action-feedback');
    expect(interactionCss).toContain('data-feedback-tone="success"');
    expect(interactionCss).toContain('@media(max-width:430px)');
    expect(interactionCss).toContain('@media(max-height:640px)');
    expect(interactionCss).toContain('env(safe-area-inset-bottom)');
  });
});
