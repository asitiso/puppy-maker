import {describe,expect,it} from 'vitest';
import {EXPEDITION_NODES,reconcileExpeditionCheckpoint,sanitizeExpeditionNode} from './expedition-adapter';

describe('V14 expedition scene adapter',()=>{
  it('uses semantic expedition nodes and safely falls back from malformed input',()=>{
    expect(EXPEDITION_NODES).toEqual(['camp','path','crossroads','ruin','rift','treasure','encounter','return']);
    expect(sanitizeExpeditionNode('rift')).toBe('rift');
    expect(sanitizeExpeditionNode('frame-22')).toBe('camp');
    expect(sanitizeExpeditionNode(null)).toBe('camp');
  });

  it('resumes an encounter until canonical battle proof exists, then advances after it',()=>{
    const checkpoint={activity:'expedition',activityId:'starlight_forest',phase:'encounter',step:'encounter'} as const;
    expect(reconcileExpeditionCheckpoint(checkpoint,false)).toEqual(checkpoint);
    expect(reconcileExpeditionCheckpoint(checkpoint,true)).toEqual({...checkpoint,phase:'post_encounter'});
  });

  it('does not trust a persisted post-encounter checkpoint without canonical proof',()=>{
    const checkpoint={activity:'expedition',activityId:'starlight_forest',phase:'post_encounter',step:'encounter'} as const;
    expect(reconcileExpeditionCheckpoint(checkpoint,false)).toEqual({...checkpoint,phase:'encounter'});
  });
});
