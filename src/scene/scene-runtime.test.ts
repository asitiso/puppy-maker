import {describe,expect,it} from 'vitest';
import {advanceSceneRuntime,beginSceneInteraction,claimSceneCommit,createSceneRuntime,selectSceneBehavior} from './scene-runtime';

describe('V14 scene runtime phases',()=>{
  it('runs one interaction through the canonical phase sequence',()=>{
    const idle=createSceneRuntime();
    const approaching=beginSceneInteraction(idle,'bed');
    expect(approaching.phase).toBe('approaching');
    expect(approaching.activeInteractionId).toBe('bed');
    const acting=advanceSceneRuntime(approaching);
    expect(acting.phase).toBe('acting');
    const committing=advanceSceneRuntime(acting);
    expect(committing.phase).toBe('committing');
    const claimed=claimSceneCommit(committing);
    expect(claimed.commit?.interactionId).toBe('bed');
    const presenting=advanceSceneRuntime(claimed.state);
    expect(presenting.phase).toBe('presenting');
    expect(advanceSceneRuntime(presenting)).toEqual(createSceneRuntime());
  });

  it('ignores a second tap after approach begins and exposes commit once',()=>{
    const approaching=beginSceneInteraction(createSceneRuntime(),'runa');
    expect(beginSceneInteraction(approaching,'door')).toEqual(approaching);
    const committing=advanceSceneRuntime(advanceSceneRuntime(approaching));
    const first=claimSceneCommit(committing);
    const second=claimSceneCommit(first.state);
    expect(first.commit).toEqual({interactionId:'runa'});
    expect(second.commit).toBeNull();
  });

  it('uses Story > player > activity > state > autonomous > idle behavior priority',()=>{
    expect(selectSceneBehavior({story:true,player:true,activity:true,stateReaction:true,autonomous:true})).toBe('story');
    expect(selectSceneBehavior({player:true,activity:true,stateReaction:true,autonomous:true})).toBe('player');
    expect(selectSceneBehavior({activity:true,stateReaction:true,autonomous:true})).toBe('activity');
    expect(selectSceneBehavior({stateReaction:true,autonomous:true})).toBe('state');
    expect(selectSceneBehavior({autonomous:true})).toBe('autonomous');
    expect(selectSceneBehavior({})).toBe('idle');
  });
});
