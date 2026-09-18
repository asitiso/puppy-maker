import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const scene=readFileSync(new URL('./MobileExplorationScene.tsx',import.meta.url),'utf8');

describe('mobile exploration scene contract',()=>{
  it('runs real-time movement through the deterministic collision and camera helpers',()=>{
    expect(scene).toContain('requestAnimationFrame');
    expect(scene).toContain('moveWithCollisions');
    expect(scene).toContain('cameraForPlayer');
    expect(scene).toContain('nearestInteractable');
    expect(scene).toContain('world.playerSpeed');
  });

  it('unifies thumb and tested keyboard navigation without requiring menu selection',()=>{
    expect(scene).toContain('<MobileJoystick');
    expect(scene).toContain('explorationKeyboardIntent');
    expect(scene).toContain('keyboardDirection');
    expect(scene).toContain('isMovementKey');
    expect(scene).toContain('mobile-exploration__action');
  });

  it('keeps keyboard exit and focus-loss cleanup wired to the shared exploration runtime',()=>{
    expect(scene).toContain("intent==='exit'");
    expect(scene).toContain('else onExit()');
    expect(scene).toContain("window.addEventListener('blur',clear)");
    expect(scene).toContain("document.addEventListener('visibilitychange',clearWhenHidden)");
    expect(scene).toContain('document.hidden');
    expect(scene).toContain('pressedKeysRef.current.clear()');
    expect(scene).toContain('joystickRef.current={x:0,y:0}');
  });

  it('uses illustrated frame stories and protects progression from double commits',()=>{
    expect(scene).toContain('<StoryFrameOverlay');
    expect(scene).toContain('committedRef');
    expect(scene).toContain('frame.progression&&!committedRef.current');
    expect(scene).toContain('onProgress()');
  });

  it('keeps background exploration controls out of the modal story focus path',()=>{
    expect(scene).toContain('className="mobile-exploration__exit" disabled={Boolean(activeFrame)}');
    expect(scene).toContain('<MobileJoystick disabled={Boolean(activeFrame)}');
    expect(scene).toContain('disabled={!nearby||Boolean(activeFrame)}');
  });

  it('clears held movement when a story frame opens so closing it cannot resume stale movement',()=>{
    expect(scene).toContain('if(!activeFrame) return;');
    expect(scene).toContain('pressedKeysRef.current.clear()');
    expect(scene).toContain('joystickRef.current={x:0,y:0}');
    expect(scene).toContain('setMoving(false)');
  });

  it('does not queue movement keys pressed while a story modal owns exploration input',()=>{
    expect(scene).toContain("if(intent==='movement')");
    expect(scene).toContain('if(activeFrameRef.current){');
    expect(scene).toContain('blockedMovementKeysRef.current.add(event.code)');
    expect(scene.indexOf('blockedMovementKeysRef.current.add(event.code)')).toBeLessThan(scene.indexOf('pressedKeysRef.current.add(event.code)'));
  });

  it('requires a movement key held through a story modal to be released before movement resumes',()=>{
    expect(scene).toContain('blockedMovementKeysRef');
    expect(scene).toContain('blockedMovementKeysRef.current.add(code)');
    expect(scene).toContain('blockedMovementKeysRef.current.add(event.code)');
    expect(scene).toContain('if(blockedMovementKeysRef.current.has(event.code)) return;');
    expect(scene).toContain('blockedMovementKeysRef.current.delete(event.code)');
  });

  it('synchronizes story modal ownership before React effects and ignores duplicate completion',()=>{
    expect(scene).toContain('activeFrameRef.current=frame;\n        setActiveInteractionId(nearby.id);');
    expect(scene).toContain('activeFrameRef.current=null;\n    setActiveFrame(null);');
    expect(scene).toContain('if(activeFrameRef.current!==frame) return;');
    expect(scene).toContain('activeFrameRef.current=null;\n    if(activeInteractionId)');
  });

  it('gives touch users the same non-committing story cancel path as Escape',()=>{
    expect(scene).toContain('onCancel={()=>closeStory()}');
    expect(scene).toContain("if(activeFrameRef.current) closeStory(); else onExit();");
  });

  it('restores useful keyboard focus after story cancellation and completion',()=>{
    expect(scene).toContain('actionButtonRef');
    expect(scene).toContain('actionButtonRef.current?.focus()');
    expect(scene).toContain('viewportRef.current?.focus()');
    expect(scene).toContain('ref={actionButtonRef}');
    expect(scene).toContain('tabIndex={-1}');
    expect(scene).toContain('closeStory');
  });

  it('can restore persisted interaction completion and report newly completed interactions',()=>{
    expect(scene).toContain('completedInteractionIds?:readonly string[]');
    expect(scene).toContain('onInteractionComplete?:(interactionId:string)=>void');
    expect(scene).toContain('new Set(completedInteractionIds)');
    expect(scene).toContain('onInteractionComplete?.(activeInteractionId)');
  });

  it('keeps living repeatable interactions available after their story frame closes',()=>{
    expect(scene).toContain('interaction.repeatable');
    expect(scene).toContain('!interaction.repeatable');
  });

  it('reveals authored landmarks only when their prerequisite discoveries are complete',()=>{
    expect(scene).toContain('interactionIsUnlocked');
    expect(scene).toContain('unlockedInteractables');
    expect(scene).toContain('unlockedInteractables.map');
  });

  it('can open another authored world through an in-world portal interaction',()=>{
    expect(scene).toContain('onPortal?');
    expect(scene).toContain("nearby.kind==='portal'");
    expect(scene).toContain('nearby.destinationId');
    expect(scene).toContain('onPortal?.(nearby.destinationId)');
    expect(scene).toContain('data-kind={interaction.kind}');
    expect(scene).toContain('mobile-exploration__portal-label');
  });

  it('labels exit actions as returning instead of investigating',()=>{
    expect(scene).toContain("nearby?.kind==='exit'?'돌아가기'");
  });

  it('renders authored landmarks at world coordinates and keeps an explicit touch exit path',()=>{
    expect(scene).toContain('interaction.artSrc');
    expect(scene).toContain('mobile-exploration__landmark');
    expect(scene).toContain('mobile-exploration__exit-marker');
    expect(scene).toContain('aria-label={`${world.label} 탐험 종료`}');
    expect(scene).toContain('onClick={onExit}');
  });
});