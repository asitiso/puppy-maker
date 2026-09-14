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

  it('unifies thumb and keyboard navigation without requiring menu selection',()=>{
    expect(scene).toContain('<MobileJoystick');
    expect(scene).toContain("'ArrowUp'");
    expect(scene).toContain("'KeyW'");
    expect(scene).toContain("'Space'");
    expect(scene).toContain("'KeyE'");
    expect(scene).toContain('mobile-exploration__action');
  });

  it('uses illustrated frame stories and protects progression from double commits',()=>{
    expect(scene).toContain('<StoryFrameOverlay');
    expect(scene).toContain('committedRef');
    expect(scene).toContain('frame.progression&&!committedRef.current');
    expect(scene).toContain('onProgress()');
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

  it('renders authored landmarks at world coordinates and keeps an explicit exit path',()=>{
    expect(scene).toContain('interaction.artSrc');
    expect(scene).toContain('mobile-exploration__landmark');
    expect(scene).toContain('mobile-exploration__exit-marker');
    expect(scene).toContain('aria-label={`${world.label} 탐험 종료`}');
  });
});