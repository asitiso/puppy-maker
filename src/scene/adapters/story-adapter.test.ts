import {describe,expect,it,vi} from 'vitest';
import {commitStoryChoice} from './story-adapter';

describe('V14 story adapter',()=>{
  it('commits a valid current story choice exactly once through EVENT_CHOICE',()=>{
    const dispatch=vi.fn();
    expect(commitStoryChoice('lost_bird','help',dispatch)).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({type:'EVENT_CHOICE',eventId:'lost_bird',choiceId:'help'});
  });

  it('rejects unknown choices without dispatching',()=>{
    const dispatch=vi.fn();
    expect(commitStoryChoice('lost_bird','unknown',dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
