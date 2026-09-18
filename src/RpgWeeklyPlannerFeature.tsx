import type {GameState} from './game';
import MobilePageShell from './MobilePageShell';
import WeeklyPlannerCard from './WeeklyPlannerCard';
import type {WeeklyFocusId} from './weekly-life';
import './weekly-planner.css';

type Props={
  state:GameState;
  onBack:()=>void;
  onWeeklyFocus:(focus:WeeklyFocusId)=>void;
  onCompleteWeek:()=>void;
  onAdvanceWeek:()=>void;
};

export default function RpgWeeklyPlannerFeature({state,onBack,onWeeklyFocus,onCompleteWeek,onAdvanceWeek}:Props){
  return <MobilePageShell
    title="주간 작전판"
    subtitle="이번 주 집중 목표와 진행을 정리하세요."
    backgroundSlot="category.life.background"
    scrollKey="feature:weekly_planner"
    onBack={onBack}
    className="rpg-weekly-planner-feature"
  >
    <section aria-label="이번 주 계획">
      <WeeklyPlannerCard
        state={state}
        onSelectFocus={onWeeklyFocus}
        onComplete={onCompleteWeek}
        onAdvance={onAdvanceWeek}
        showChronicles={false}
      />
    </section>
  </MobilePageShell>;
}
