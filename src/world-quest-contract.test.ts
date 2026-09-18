import {describe,expect,it} from 'vitest';
import type {MobileWorldRecommendation} from './mobile-category-guidance';
import {clearWorldQuest,isQuestResolved,loadWorldQuest,questFromRecommendation,saveWorldQuest,WORLD_QUEST_STORAGE_KEY} from './world-quest-contract';

const reward:MobileWorldRecommendation={feature:'achievements',category:'growth',label:'성장 업적 수령',description:'보상 확인',reason:'바로 받을 보상이 있습니다.',priority:'reward'};
const routine:MobileWorldRecommendation={feature:'schedule',category:'life',label:'이번 주 스케줄',description:'일정 확인',reason:'이번 주 행동을 정합니다.',priority:'routine'};

function memoryStorage(){
  const values=new Map<string,string>();
  return {
    getItem:(key:string)=>values.get(key)??null,
    setItem:(key:string,value:string)=>{values.set(key,value);},
    removeItem:(key:string)=>{values.delete(key);},
  };
}

describe('world quest contracts',()=>{
  it('turns a recommendation into a stable accepted contract',()=>{
    const quest=questFromRecommendation(reward,new Date('2026-09-19T00:00:00.000Z'));
    expect(quest).toMatchObject({id:'growth:achievements',feature:'achievements',category:'growth',title:'성장 업적 수령'});
    expect(quest.acceptedAt).toBe('2026-09-19T00:00:00.000Z');
  });

  it('keeps the quest active until the recommended objective changes',()=>{
    const quest=questFromRecommendation(reward);
    expect(isQuestResolved(quest,reward)).toBe(false);
    expect(isQuestResolved(quest,routine)).toBe(true);
  });

  it('persists accepted quests across feature screens and clears completed quests',()=>{
    const storage=memoryStorage();
    const quest=questFromRecommendation(reward);
    saveWorldQuest(storage,quest);
    expect(loadWorldQuest(storage)).toEqual(quest);
    clearWorldQuest(storage);
    expect(storage.getItem(WORLD_QUEST_STORAGE_KEY)).toBeNull();
  });

  it('ignores corrupt persisted quest data instead of blocking the world hub',()=>{
    const storage=memoryStorage();
    storage.setItem(WORLD_QUEST_STORAGE_KEY,'{"feature":42}');
    expect(loadWorldQuest(storage)).toBeNull();
  });
});
