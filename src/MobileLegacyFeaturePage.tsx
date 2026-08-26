import {useState} from 'react';
import {
  discoveryIds,explorationLevel,explorationXpForNextLevel,giftDefinitions,giftItemIds,outingDefinitions,outingLocationIds,
  type DiscoveryId,type ExplorationEventId,type GiftItemId,type OutingLocationId,
} from './adventure';
import {attendanceKey,attendanceReward} from './attendance';
import {talentDefinitions} from './advanced-talents';
import {careerTitleDefinitions} from './career-records';
import {
  achievementDefinitions,collectionProgress,currentAdvancedTalents,currentAvailableMail,currentCareerTitles,currentGuardianStatus,
  currentStoryChapters,eligibleAchievements,masteryLevel,relationshipRank,type AchievementId,type GameState,type MailRewardId,
} from './game';
import {guardianRankDefinitions} from './guardian-rank';
import {mailDefinitions} from './mail-rewards';
import MobileFeedback from './MobileFeedback';
import MobilePageShell from './MobilePageShell';
import MobilePrimaryAction from './MobilePrimaryAction';
import {monthlyFocusDefinitions} from './monthly-focus';
import {monthlyMissionDefinitions} from './monthly-missions';
import type {MobileFeatureId} from './mobile-router';
import type {MobileVisualSlot} from './mobile-visual-assets';
import {storyChapterDefinitions} from './story-chapters';

type Props={
  feature:MobileFeatureId;
  state:GameState;
  onBack:()=>void;
  onClaimAchievement:(achievement:AchievementId)=>void;
  onOuting:(location:OutingLocationId)=>void;
  onGift:(item:GiftItemId)=>void;
  onAttendance:()=>void;
  onMail:(mail:MailRewardId)=>void;
  onMonthlyFocus:(focus:GameState['monthlyFocus'])=>void;
};

const relationshipLabels={acquaintance:'낯선 사이',familiar:'익숙한 사이',friend:'친구',close_friend:'가까운 친구',precious:'소중한 사람'} as const;
const explorationEventLabels:Record<ExplorationEventId,string>={
  glowing_tracks:'빛나는 발자국을 따라가 50G를 발견했어요.',ancient_tree:'오래된 나무의 선물로 별빛 쿠키를 얻었어요.',
  street_performance:'마을 공연을 도와 50G를 받았어요.',wand_repair:'마법 지팡이를 고쳐주고 여우 부적을 받았어요.',
  silver_fish:'은빛 물고기가 숨겨둔 50G를 발견했어요.',quiet_breeze:'고요한 바람 속에서 허브티를 발견했어요.',
};
const discoveryLabels:Record<DiscoveryId,string>={
  moon_feather:'달빛 깃털',star_mushroom:'별무늬 버섯',tiny_bell:'작은 마법 종',old_spellbook:'낡은 주문서',
  glass_shell:'유리빛 조개',wind_crystal:'바람 결정',
};

type FeatureMeta={eyebrow:string;title:string;description:string;backgroundSlot:MobileVisualSlot};
const featureMeta:Partial<Record<MobileFeatureId,FeatureMeta>>={
  achievements:{eyebrow:'ACHIEVEMENTS',title:'성장 업적',description:'달성한 성장 목표와 보상을 확인해요.',backgroundSlot:'category.growth.background'},
  mission:{eyebrow:'MONTHLY CHALLENGES',title:'이번 달 도전',description:'월간 집중과 도전 진행도를 확인해요.',backgroundSlot:'category.life.background'},
  attendance:{eyebrow:'MONTHLY CHECK-IN',title:'월간 출석',description:'이번 달 출석 보상을 확인해요.',backgroundSlot:'category.life.background'},
  mail:{eyebrow:'MILESTONE MAIL',title:'우편함',description:'도착한 편지와 보상을 확인해요.',backgroundSlot:'category.life.background'},
  inventory:{eyebrow:'INVENTORY',title:'능력과 보유품',description:'보유한 선물과 성장 기록을 함께 확인해요.',backgroundSlot:'category.growth.background'},
  gifts:{eyebrow:'GIFTS',title:'선물',description:'보유한 선물을 루나에게 건네요.',backgroundSlot:'category.bond.background'},
  outing:{eyebrow:'ADVENTURE',title:'외출',description:'마을과 주변 지역으로 나가 탐험해요.',backgroundSlot:'category.adventure.background'},
  bond:{eyebrow:'BOND & COLLECTION',title:'루나와의 교감',description:'관계와 장기 성장 기록을 확인해요.',backgroundSlot:'category.bond.background'},
  stories:{eyebrow:'STORY ARCHIVE',title:'루나 이야기',description:'열린 캐릭터 이야기와 이벤트를 다시 봐요.',backgroundSlot:'category.bond.background'},
};

function Row({marker,title,description,status,disabled=false,disabledReason,onClick}:{
  marker:string|number;
  title:string;
  description?:string;
  status?:string;
  disabled?:boolean;
  disabledReason?:string;
  onClick?:()=>void;
}){
  return <MobilePrimaryAction className="v8-feature-row v9-feature-action" disabled={disabled} reason={disabled?disabledReason:undefined} onClick={onClick}>
    <span className="v8-feature-marker">{marker}</span>
    <span className="v8-feature-copy"><b>{title}</b>{description&&<small>{description}</small>}</span>
    {status&&<i>{status}</i>}
  </MobilePrimaryAction>;
}

export default function MobileLegacyFeaturePage({feature,state,onBack,onClaimAchievement,onOuting,onGift,onAttendance,onMail,onMonthlyFocus}:Props){
  const info=featureMeta[feature]??{eyebrow:'FEATURE',title:'기능',description:'선택한 기능을 확인해요.',backgroundSlot:'category.records.background' as const};
  const [feedback,setFeedback]=useState<string|null>(null);
  const eligible=new Set(eligibleAchievements(state));
  const availableMail=new Set(currentAvailableMail(state));
  const attendanceId=attendanceKey(state.year,state.month);
  const attendanceClaimed=state.claimedAttendanceMonths.includes(attendanceId);
  const attendance=attendanceReward(state.year,state.month);
  const storyOpen=new Set([...currentStoryChapters(state),...state.expeditionStoryEntries]);
  const collection=collectionProgress(state);
  const guardian=currentGuardianStatus(state);
  const guardianDefinition=guardianRankDefinitions.find(item=>item.id===guardian.rank)??guardianRankDefinitions[0];
  const rank=relationshipRank(state.stats.affection);
  const talents=currentAdvancedTalents(state);
  const titles=currentCareerTitles(state);
  const currentTitle=careerTitleDefinitions.find(item=>item.id===titles[titles.length-1]);
  const talentLabels=talents.map(id=>talentDefinitions.find(item=>item.id===id)?.label).filter(Boolean);
  const highestMastery=Math.max(...Object.values(state.mastery).map(entry=>masteryLevel(entry.xp)));

  return <MobilePageShell
    title={info.title}
    subtitle={info.description}
    backgroundSlot={info.backgroundSlot}
    scrollKey={`feature:${feature}`}
    onBack={onBack}
    className="v8-feature-page v9-feature-page"
  >
    <div className="v8-feature-heading" aria-hidden="true"><small>{info.eyebrow}</small></div>
    {feedback&&<MobileFeedback tone="success">{feedback}</MobileFeedback>}
    <div className="v8-feature-list">
      {feature==='achievements'&&achievementDefinitions.map((item,index)=>{
        const claimed=state.claimedAchievements.includes(item.id);
        const canClaim=eligible.has(item.id)&&!claimed;
        const reward=item.reward.gold?`${item.reward.gold}G`:`보석 ${item.reward.gems}`;
        const disabledReason=claimed?'수령 완료':'조건을 달성하면 받을 수 있어요.';
        return <Row key={item.id} marker={claimed?'✓':canClaim?'!':index+1} title={item.title} description={`${item.description} · ${reward}`} status={claimed?'완료':canClaim?'받기':'진행중'} disabled={!canClaim} disabledReason={disabledReason} onClick={()=>{
          if(!canClaim)return;
          onClaimAchievement(item.id);
          setFeedback('업적 보상을 받았어요.');
        }}/>;
      })}

      {feature==='attendance'&&<>
        <Row marker={attendanceClaimed?'✓':'!'} title={`${state.year}년차 ${state.month}월 출석 보상`} description={`기본 150G${attendance.gems>0?` · 분기 보너스 보석 ${attendance.gems}개`:' · 다음 분기월에는 보석 보너스'}`} status={attendanceClaimed?'수령 완료':'받기'} disabled={attendanceClaimed} disabledReason="수령 완료" onClick={()=>{
          if(attendanceClaimed)return;
          onAttendance();
          setFeedback('출석 보상을 받았어요.');
        }}/>
        <Row marker="◆" title="누적 출석 기록" description="월이 바뀌어도 이전 수령 기록은 유지돼요." status={`${state.claimedAttendanceMonths.length}개월`} disabled disabledReason="현재까지의 누적 기록이에요."/>
      </>}

      {feature==='mail'&&mailDefinitions.map((mail,index)=>{
        const unlocked=availableMail.has(mail.id);
        const claimed=state.claimedMailRewards.includes(mail.id);
        const reward=[mail.reward.gold?`${mail.reward.gold}G`:'',mail.reward.gems?`보석 ${mail.reward.gems}`:''].filter(Boolean).join(' · ');
        const disabledReason=claimed?'수령 완료':'조건을 달성하면 편지가 도착해요.';
        return <Row key={mail.id} marker={claimed?'✓':unlocked?'!':index+1} title={mail.title} description={unlocked?`${mail.message} · ${reward}`:'진행 조건을 달성하면 편지가 도착해요.'} status={claimed?'수령 완료':unlocked?'받기':'잠김'} disabled={!unlocked||claimed} disabledReason={disabledReason} onClick={()=>{
          if(!unlocked||claimed)return;
          onMail(mail.id);
          setFeedback('우편 보상을 받았어요.');
        }}/>;
      })}

      {feature==='mission'&&<>
        {monthlyFocusDefinitions.map((focus,index)=>{
          const selected=state.monthlyFocus===focus.id;
          return <Row key={focus.id} marker={selected?'✓':index+1} title={focus.label} description={focus.description} status={selected?'선택됨':'선택'} onClick={()=>{
            onMonthlyFocus(focus.id);
            setFeedback('이번 달 집중 목표를 바꿨어요.');
          }}/>;
        })}
        <Row marker="🔥" title="연속 성장" description="3개월마다 보석 3개 추가 보상" status={`${state.growthStreak}개월`} disabled disabledReason="주간 진행에 따라 자동으로 갱신돼요."/>
        {monthlyMissionDefinitions.map((item,index)=>{
          const value=state.monthlyCounters[item.counter];
          const completed=state.rewardedMonthlyMissions.includes(item.id);
          const reward=item.reward.gold?`${item.reward.gold}G`:`보석 ${item.reward.gems}`;
          return <Row key={item.id} marker={completed?'✓':index+1} title={item.title} description={`${Math.min(value,item.target)} / ${item.target} · 보상 ${reward}`} status={completed?'보상 완료':'진행중'} disabled disabledReason={completed?'보상 완료':'플레이 진행에 따라 자동으로 갱신돼요.'}/>;
        })}
      </>}

      {(feature==='inventory'||feature==='gifts')&&<>
        {feature==='inventory'&&<div className="v8-feature-summary"><b>현재 성장 기록</b><span>최고 숙련 Lv.{highestMastery} · 기억 {collection.memories}개 · 기술 {collection.skills}개</span></div>}
        {giftItemIds.map((id,index)=>{
          const item=giftDefinitions[id];
          const quantity=state.inventory[id];
          return <Row key={id} marker={index+1} title={item.name} description={item.description} status={quantity>0?`선물하기 · ${quantity}개`:'없음'} disabled={quantity<=0} disabledReason="보유한 선물이 없어요" onClick={()=>{
            if(quantity<=0)return;
            onGift(id);
            setFeedback('선물을 전했어요.');
          }}/>;
        })}
      </>}

      {feature==='stories'&&storyChapterDefinitions.map((chapter,index)=>{
        const opened=storyOpen.has(chapter.id);
        const reward=chapter.rewardGems>0?` · 보상 보석 ${chapter.rewardGems}`:'';
        return <Row key={chapter.id} marker={opened?'✓':index+1} title={chapter.title} description={`${opened?chapter.summary:chapter.unlockHint}${reward}`} status={opened?'열림':'잠김'} disabled disabledReason={opened?'열린 이야기 기록이에요.':'조건을 달성하면 이야기가 열려요.'}/>;
      })}

      {feature==='bond'&&<>
        <Row marker="★" title="수호 등급" description={guardian.next?`다음 ${guardianRankDefinitions.find(item=>item.id===guardian.next?.rank)?.label??''}까지 ${guardian.next.threshold-guardian.points}점`:'최고 등급 달성'} status={guardianDefinition.label} disabled disabledReason="현재 수호 성장 상태예요."/>
        <Row marker="◆" title="커리어 칭호" description={titles.length?`${titles.length}개 해금 · ${currentTitle?.description??''}`:'장기 플레이 기록으로 새로운 칭호가 열려요.'} status={currentTitle?.label??'도전 중'} disabled disabledReason="장기 플레이 기록으로 갱신돼요."/>
        <Row marker="✦" title="고급 훈련 재능" description={talentLabels.length?talentLabels.join(' · '):'숙련 Lv.3부터 계열별 재능이 열려요.'} status={`${talents.length} / ${talentDefinitions.length}`} disabled disabledReason="숙련 조건에 따라 자동으로 열려요."/>
        <Row marker="↗" title="커리어 기록" description={`훈련 ${state.careerRecords.trainings}회 · S등급 ${state.careerRecords.sGrades}회 · 외출 ${state.careerRecords.outings}회 · 선물 ${state.careerRecords.gifts}회`} status={`BEST ${state.careerRecords.bestScore}`} disabled disabledReason="현재까지의 플레이 기록이에요."/>
        <Row marker="♥" title="현재 관계" status={relationshipLabels[rank]} disabled disabledReason="교감과 선택에 따라 변해요."/>
        <Row marker="1" title="호감도" status={`${state.stats.affection} / 100`} disabled disabledReason="교감과 선물로 변화해요."/>
        <Row marker="2" title="수집한 기억" status={`${collection.memories}개`} disabled disabledReason="플레이 중 기억을 모으면 갱신돼요."/>
        <Row marker="3" title="해금한 기술" status={`${collection.skills}개`} disabled disabledReason="성장 조건을 달성하면 갱신돼요."/>
        <Row marker="4" title="외출 기억" status={`${state.visitedOutings.length} / ${outingLocationIds.length}`} disabled disabledReason="외출을 다녀오면 갱신돼요."/>
        <Row marker="5" title="숨겨진 발견물" status={`${state.discoveries.length} / ${discoveryIds.length}`} disabled disabledReason="탐험 중 발견하면 갱신돼요."/>
        <Row marker="6" title="최고 숙련도" status={`Lv.${highestMastery}`} disabled disabledReason="훈련으로 숙련도를 올리면 갱신돼요."/>
      </>}

      {feature==='outing'&&<>
        {state.lastExploration&&<Row marker="★" title={`${outingDefinitions[state.lastExploration.location].name} 탐험 기록`} description={state.lastExploration.discovery?`숨겨진 발견 · ${discoveryLabels[state.lastExploration.discovery]}`:state.lastExploration.event?explorationEventLabels[state.lastExploration.event]:'이번에는 특별한 일 없이 평화롭게 다녀왔어요.'} status={state.lastExploration.discovery?'발견!':state.lastExploration.event?'사건':'기록'} disabled disabledReason="가장 최근 탐험 기록이에요."/>}
        {outingLocationIds.map((id,index)=>{
          const location=outingDefinitions[id];
          const visited=state.visitedOutings.includes(id);
          const xp=state.explorationXp[id];
          const level=explorationLevel(xp);
          const nextXp=explorationXpForNextLevel(xp);
          return <Row key={id} marker={visited?'✓':index+1} title={location.name} description={`탐험 Lv.${level} · ${nextXp===null?'MAX':`${xp} / ${nextXp} XP`} · ${location.description}`} status={visited?'탐험':'출발'} onClick={()=>{
            onOuting(id);
            setFeedback(`${location.name}으로 외출했어요.`);
          }}/>;
        })}
      </>}
    </div>
  </MobilePageShell>;
}
