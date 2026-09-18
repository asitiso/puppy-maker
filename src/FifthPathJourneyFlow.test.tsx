import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {
  FIFTH_PATH_JOURNEY_STORAGE_KEY,
  fifthPathJourneyActionForLabel,
  restoreFifthPathJourney,
} from './FifthPathJourneyFlow';
import {fifthPathJourneyReducer,serializeFifthPathJourney} from './fifth-path-journey';

const source=readFileSync(new URL('./FifthPathJourneyFlow.tsx',import.meta.url),'utf8');

function choose(state:ReturnType<typeof restoreFifthPathJourney>,label:string,outcome:'victory'|'costly_victory'|'defeat'='victory'){
  const action=fifthPathJourneyActionForLabel(label,outcome);
  expect(action,'missing action').not.toBeNull();
  return fifthPathJourneyReducer(state,action!);
}

describe('FifthPathJourneyFlow integration contract',()=>{
  it('runs the playable journey and persists the real winter outcome',()=>{
    let state=restoreFifthPathJourney(null);
    state=choose(state,'이 가능성을 선택한다');
    state=choose(state,'신호를 따라간다');
    state=choose(state,'정답을 반복하지 않고 새로운 합의를 만든다');
    state=choose(state,'긴 밤과 마주한다','costly_victory');
    state=choose(state,'기억을 다음 봄으로 가져간다');

    expect(state.stage).toBe('true_ending');
    expect(state.winterOutcome).toBe('costly_victory');
    expect(state.completed).toBe(true);
    expect(state.choices).toEqual(['true_path','follow_the_signal','rewrite_the_pattern','face_the_long_night','carry_the_memory']);
    expect(JSON.parse(serializeFifthPathJourney(state))).toMatchObject({winterOutcome:'costly_victory',completed:true});
    expect(source).toContain('window.localStorage.setItem(FIFTH_PATH_JOURNEY_STORAGE_KEY, serializeFifthPathJourney(journey))');
    expect(FIFTH_PATH_JOURNEY_STORAGE_KEY).toBe('puppy-maker:fifth-path-journey:v1');
  });

  it('restores an unfinished journey instead of replaying completed choices',()=>{
    const restored=restoreFifthPathJourney(JSON.stringify({
      version:1,
      stage:'autumn',
      selected:true,
      choices:['true_path','follow_the_signal'],
      winterOutcome:null,
      completed:false,
    }));
    expect(restored.stage).toBe('autumn');
    expect(fifthPathJourneyActionForLabel('신호를 따라간다','victory')).toMatchObject({choice:'follow_the_signal'});
    const replay=fifthPathJourneyReducer(restored,fifthPathJourneyActionForLabel('신호를 따라간다','victory')!);
    expect(replay).toBe(restored);
    const continued=choose(restored,'정답을 반복하지 않고 새로운 합의를 만든다');
    expect(continued.stage).toBe('winter');
  });

  it('recovers from corrupt storage and starts from Spring',()=>{
    const restored=restoreFifthPathJourney(JSON.stringify({
      version:1,
      stage:'winter',
      selected:true,
      choices:[],
      winterOutcome:'victory',
      completed:true,
    }));
    expect(restored.stage).toBe('spring');
    expect(restored.selected).toBe(false);
    expect(restored.choices).toEqual([]);
    expect(fifthPathJourneyActionForLabel('긴 밤과 마주한다','victory')).toMatchObject({choice:'face_the_long_night',outcome:'victory'});
  });
});
