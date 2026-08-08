import type { SeasonStampId } from './game';
import { seasonalHomeSummary, seasonalStampSummary } from './seasonal-home';

type SeasonalHomeBadgeProps = {
  month: number;
  stamps: SeasonStampId[];
};

export default function SeasonalHomeBadge({ month, stamps }: SeasonalHomeBadgeProps) {
  const summary = seasonalHomeSummary(month);
  const stamp = seasonalStampSummary(month, stamps);
  return <aside className="seasonal-home-badge" aria-label="이번 달 계절 추천">
    <img src="/ui/info_card_frame.png" alt="" draggable={false} />
    <div>
      <small>SEASON GUIDE · {stamp.current}/{stamp.total}</small>
      <strong>{summary.title}</strong>
      <span>{summary.recommendation}</span>
      <em>{stamp.collected ? `✓ ${stamp.stampLabel} 획득 완료` : `${stamp.outingName}에서 ${stamp.stampLabel} 획득 가능`}</em>
    </div>
  </aside>;
}
