import {useCallback,useMemo,useState,type MouseEvent} from 'react';
import type {GiftItemId,OutingLocationId} from './adventure';
import {attendanceKey} from './attendance';
import {currentAvailableMail,eligibleAchievements,relationshipRank,type AchievementId,type GameState,type MailRewardId} from './game';
import {hubGuidedActionStack} from './hub-next-action';
import type {HomeMenuId} from './home-panels';
import LayeredHome from './LayeredHome';
import MobileCategorySheet,{mobileCategories,type MobileCategoryId} from './MobileCategorySheet';
import MobileHomeStatus from './MobileHomeStatus';
import MobileNavIcon from './MobileNavIcon';
import type {WeeklyFocusId} from './weekly-life';
import './layered-home-v7.css';

type Props={
  state:GameState;
  onSchedule:()=>void;
  onClaimAchievement:(achievement:AchievementId)=>void;
  onOuting:(location:OutingLocationId)=>void;
  onGift:(item:GiftItemId)=>void;
  onAttendance:()=>void;
  onMail:(mail:MailRewardId)=>void;
  onMonthlyFocus:(focus:GameState['monthlyFocus'])=>void;
  onWeeklyFocus?:(focus:WeeklyFocusId)=>void;
  onCompleteWeek?:()=>void;
  onAdvanceWeek?:()=>void;
  onExpedition?:()=>void;
  onSeason?:()=>void;
  onRaising?:()=>void;
  onSanctuary?:()=>void;
  onWorldProgress?:()=>void;
  onArchive?:()=>void;
  onAmbition?:()=>void;
  onMenuReady?:(openMenu:(id:HomeMenuId)=>void)=>void;
};

const relationshipLabels={acquaintance:'낯선 사이',familiar:'익숙한 사이',friend:'친구',close_friend:'가까운 친구',precious:'소중한 사람'} as const;
const conditionCopy:Record<GameState['condition'],string>={
  energetic:'오늘은 몸이 가벼워요. 새로운 일에 도전해볼까요?',
  normal:'오늘의 흐름을 천천히 골라봐요.',
  focused:'집중하기 좋은 날이에요. 중요한 일을 해볼까요?',
  tired:'조금 지쳐 보여요. 무리하지 않아도 괜찮아요.',
};

export default function LayeredHomeV7(props:Props){
  const {state,onMenuReady}=props;
  const [category,setCategory]=useState<MobileCategoryId>('home');
  const [legacyOpenMenu,setLegacyOpenMenu]=useState<((id:HomeMenuId)=>void)|null>(null);
  const primaryTask=hubGuidedActionStack(state).primary;
  const relationship=relationshipLabels[relationshipRank(state.stats.affection)];

  const captureMenu=useCallback((openMenu:(id:HomeMenuId)=>void)=>{
    setLegacyOpenMenu(()=>openMenu);
    onMenuReady?.(openMenu);
  },[onMenuReady]);

  const openLegacy=useCallback((id:HomeMenuId)=>{
    setCategory('home');
    legacyOpenMenu?.(id);
  },[legacyOpenMenu]);

  const leaveSheet=useCallback((action?:()=>void)=>{
    setCategory('home');
    action?.();
  },[]);

  const notificationCount=useMemo(()=>{
    const mail=new Set(currentAvailableMail(state));
    const unclaimedMail=[...mail].filter(id=>!state.claimedMailRewards.includes(id)).length;
    const attendanceId=attendanceKey(state.year,state.month);
    const attendance=state.claimedAttendanceMonths.includes(attendanceId)?0:1;
    const achievement=new Set(eligibleAchievements(state));
    const achievements=[...achievement].filter(id=>!state.claimedAchievements.includes(id)).length;
    return unclaimedMail+attendance+achievements;
  },[state]);

  const openNotifications=useCallback(()=>{
    const mail=new Set(currentAvailableMail(state));
    const hasMail=[...mail].some(id=>!state.claimedMailRewards.includes(id));
    if(hasMail)return openLegacy('mail');
    const attendanceId=attendanceKey(state.year,state.month);
    if(!state.claimedAttendanceMonths.includes(attendanceId))return openLegacy('attendance');
    const achievement=new Set(eligibleAchievements(state));
    if([...achievement].some(id=>!state.claimedAchievements.includes(id)))return openLegacy('quest');
    setCategory('life');
  },[state,openLegacy]);

  const handleCapture=(event:MouseEvent<HTMLDivElement>)=>{
    const target=event.target;
    if(!(target instanceof Element)||!target.closest('.v10-command-primary .v10-guided-cta'))return;
    if(primaryTask.route!=='weekly_planner')return;
    event.preventDefault();
    event.stopPropagation();
    setCategory('life');
  };

  const activeSheet=category==='home'?null:category;

  return <div className="v7-home-shell" onClickCapture={handleCapture}>
    <LayeredHome {...props} onMenuReady={captureMenu}/>
    <MobileHomeStatus state={state} notificationCount={notificationCount} onNotifications={openNotifications}/>
    <div className="v7-luna-context" aria-label="루나 상태">
      <b>루나 · {relationship}</b><span>{conditionCopy[state.condition]}</span>
    </div>

    <nav className="v7-bottom-nav" aria-label="주요 메뉴">
      {mobileCategories.map(item=><button
        key={item.id}
        type="button"
        className={category===item.id?'is-active':''}
        aria-current={category===item.id?'page':undefined}
        aria-pressed={category===item.id}
        onClick={()=>setCategory(item.id)}
      >
        <span><MobileNavIcon name={item.icon}/></span><b>{item.label}</b>
      </button>)}
    </nav>

    {activeSheet&&<MobileCategorySheet
      category={activeSheet}
      state={state}
      onClose={()=>setCategory('home')}
      onOpenMenu={openLegacy}
      onSchedule={()=>leaveSheet(props.onSchedule)}
      onExpedition={()=>leaveSheet(props.onExpedition)}
      onSeason={()=>leaveSheet(props.onSeason)}
      onRaising={()=>leaveSheet(props.onRaising)}
      onSanctuary={()=>leaveSheet(props.onSanctuary)}
      onWorldProgress={()=>leaveSheet(props.onWorldProgress)}
      onArchive={()=>leaveSheet(props.onArchive)}
      onAmbition={()=>leaveSheet(props.onAmbition)}
      onWeeklyFocus={props.onWeeklyFocus}
      onCompleteWeek={props.onCompleteWeek}
      onAdvanceWeek={props.onAdvanceWeek}
    />}
  </div>;
}
