import {describe,expect,it} from 'vitest';
// @ts-ignore -- Vitest executes this source-contract test in Node.
import {readFileSync} from 'node:fs';
import home from './LayeredHome.tsx?raw';
import stage from './scene/SceneStage.tsx?raw';
import actor from './scene/CharacterActor.tsx?raw';

const sceneCss=readFileSync(new URL('./scene/scene.css',import.meta.url),'utf8');

describe('V14 deep Living Home scene direction',()=>{
  it('routes Home scene objects through the reusable SceneDirector before canonical callbacks',()=>{
    expect(home).toContain('<SceneStage scene={homeScene} onInteraction={handleHomeSceneInteraction}/>');
    expect(stage).toContain("SceneDirector,{type SceneDirectorController} from './SceneDirector'");
    expect(stage).toContain('<SceneDirector scene={scene} onCommit={onInteraction}>');
    expect(stage).toContain('controller.start(interaction.id)');
  });

  it('keeps every existing Home interaction and quick navigation path available',()=>{
    for(const id of ['runa','bed','desk','wardrobe','bag','door','world_map']){
      expect(home).toContain(`case '${id}'`);
    }
    expect(home).toContain("['calendar', '스케줄', 'schedule']");
    expect(home).toContain("['map', '외출', 'outing']");
    expect(home).toContain('<HomeCommandCenter');
  });

  it('lets SceneStage move the existing Runa actor to a directed semantic anchor without remounting it',()=>{
    expect(stage).toContain('runtimeActorAnchorId?:string');
    expect(stage).toContain("actor.actorId==='runa'&&runtimeActorAnchorId");
    expect(stage).toContain('key={actor.actorId}');
    expect(actor).toContain('data-runtime-phase={runtimePhase}');
  });

  it('keeps motion semantic and reduced-motion safe without animation-end commits',()=>{
    expect(sceneCss).toMatch(/\.v14-scene-actor\{[^}]*transition:[^}]*left/);
    expect(sceneCss).toContain('@media(prefers-reduced-motion:reduce)');
    expect(sceneCss).toMatch(/@media\(prefers-reduced-motion:reduce\)\{[^}]*\.v14-scene-actor[^}]*transition:none/);
    expect(stage).not.toContain('onAnimationEnd');
    expect(stage).not.toContain('onTransitionEnd');
  });
});
