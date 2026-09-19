// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const hub=readFileSync(new URL('./RpgDistrictHub.tsx',import.meta.url),'utf8');
const scene=readFileSync(new URL('./exploration/MobileExplorationScene.tsx',import.meta.url),'utf8');

describe('V17 physical world quest loop',()=>{
  it('opens quest conversations from physical district NPC portals instead of tracker buttons',()=>{
    expect(hub).toContain("destination?.kind==='questNpc'");
    expect(hub).toContain('setNpcDialogOpen(true)');
    expect(hub).toContain('<WorldQuestNpcDialog');
    expect(hub).not.toContain('수락하고 바로 이동');
    expect(hub).not.toContain('목적지 열기');
    expect(scene).toContain('mobile-exploration__interaction-badge');
    expect(scene).toContain("nearby?.id.startsWith('district-quest-npc:')?'대화'");
    expect(hub).toContain("npcBadge=acceptedLocal?(questReady?'?':'·'):acceptedQuest?undefined:'!'");
    expect(hub).toContain("npcBadgeTone=acceptedLocal?(questReady?'ready':'active'):acceptedQuest?undefined:'quest'");
  });

  it('marks the target ready on world facility entry but records completion only on NPC turn-in',()=>{
    expect(hub).toContain("acceptedQuest.feature===feature");
    expect(hub).toContain('markWorldQuestReady(storage,acceptedQuest)');
    expect(hub).toContain('const turnInQuest=()=>');
    expect(hub).toContain('recordWorldQuestCompletion(storage,completed)');
    const markIndex=hub.indexOf('const enterFeature=');
    const turnInIndex=hub.indexOf('const turnInQuest=');
    expect(markIndex).toBeGreaterThan(-1);
    expect(turnInIndex).toBeGreaterThan(markIndex);
  });

  it('keeps continuous quest mode chained behind an explicit turn-in',()=>{
    const turnIn=hub.slice(hub.indexOf('const turnInQuest='),hub.indexOf('const toggleContinuous='));
    expect(turnIn).toContain('if(continuous)');
    expect(turnIn).toContain('questFromRecommendation(nextRecommendation)');
    expect(turnIn).toContain('saveWorldQuest(storage,nextQuest)');
  });
});
