import {describe,expect,it} from 'vitest';
import {
  initialMobileNavigationState,
  isGuardedActiveRoute,
  mobileNavigationReducer,
  type MobileNavigationState,
} from './mobile-router';

describe('V8 mobile router',()=>{
  it('opens a category from home with normalized home history',()=>{
    const next=mobileNavigationReducer(initialMobileNavigationState,{type:'OPEN_CATEGORY',category:'growth'});
    expect(next).toEqual({current:{kind:'category',category:'growth'},stack:[{kind:'home'}]});
  });

  it('opens a feature and returns it to its origin category',()=>{
    const category=mobileNavigationReducer(initialMobileNavigationState,{type:'OPEN_CATEGORY',category:'growth'});
    const feature=mobileNavigationReducer(category,{type:'OPEN_FEATURE',category:'growth',feature:'achievements'});
    expect(feature).toEqual({
      current:{kind:'feature',category:'growth',feature:'achievements'},
      stack:[{kind:'home'},{kind:'category',category:'growth'}],
    });
    expect(mobileNavigationReducer(feature,{type:'BACK'})).toEqual({
      current:{kind:'category',category:'growth'},
      stack:[{kind:'home'}],
    });
    expect(mobileNavigationReducer(feature,{type:'FINISH_FEATURE'})).toEqual({
      current:{kind:'category',category:'growth'},
      stack:[{kind:'home'}],
    });
  });

  it('switches categories without building a long category stack',()=>{
    const life=mobileNavigationReducer(initialMobileNavigationState,{type:'OPEN_CATEGORY',category:'life'});
    const adventure=mobileNavigationReducer(life,{type:'OPEN_CATEGORY',category:'adventure'});
    expect(adventure).toEqual({current:{kind:'category',category:'adventure'},stack:[{kind:'home'}]});
    expect(mobileNavigationReducer(adventure,{type:'OPEN_CATEGORY',category:'adventure'})).toBe(adventure);
  });

  it('backs from a category to home and HOME always clears history',()=>{
    const records=mobileNavigationReducer(initialMobileNavigationState,{type:'OPEN_CATEGORY',category:'records'});
    expect(mobileNavigationReducer(records,{type:'BACK'})).toEqual(initialMobileNavigationState);
    const archive=mobileNavigationReducer(records,{type:'OPEN_FEATURE',category:'records',feature:'archive'});
    expect(mobileNavigationReducer(archive,{type:'HOME'})).toEqual(initialMobileNavigationState);
  });

  it('tracks a play origin and FINISH_PLAY normalizes to home',()=>{
    const play=mobileNavigationReducer(initialMobileNavigationState,{type:'OPEN_PLAY',category:'life',screen:'training'});
    expect(play.current).toEqual({kind:'play',category:'life',screen:'training'});
    expect(play.stack).toEqual([{kind:'home'},{kind:'category',category:'life'}]);
    expect(mobileNavigationReducer(play,{type:'FINISH_PLAY'})).toEqual(initialMobileNavigationState);
  });

  it('falls back to home for malformed replacement data',()=>{
    const dirty={
      current:{kind:'category',category:'growth'},
      stack:[{kind:'home'}],
    } satisfies MobileNavigationState;
    expect(mobileNavigationReducer(dirty,{type:'REPLACE',route:{kind:'feature',category:'unknown',feature:'archive'}})).toEqual(initialMobileNavigationState);
    expect(mobileNavigationReducer(dirty,{type:'REPLACE',route:null})).toEqual(initialMobileNavigationState);
  });

  it('guards unfinished play routes and guardian expedition setup from global navigation overlap',()=>{
    expect(isGuardedActiveRoute({kind:'play',category:'life',screen:'training'})).toBe(true);
    expect(isGuardedActiveRoute({kind:'play',category:'life',screen:'dialogue'})).toBe(true);
    expect(isGuardedActiveRoute({kind:'play',category:'adventure',screen:'tactical'})).toBe(true);
    expect(isGuardedActiveRoute({kind:'feature',category:'adventure',feature:'expedition'})).toBe(true);
    expect(isGuardedActiveRoute({kind:'play',category:'life',screen:'schedule'})).toBe(false);
    expect(isGuardedActiveRoute({kind:'play',category:'life',screen:'result'})).toBe(false);
    expect(isGuardedActiveRoute({kind:'category',category:'life'})).toBe(false);
  });
});