import { seasonalHomeSummary } from './seasonal-home';

type SeasonalHomeBadgeProps = {
  month: number;
};

export default function SeasonalHomeBadge({ month }: SeasonalHomeBadgeProps) {
  const summary = seasonalHomeSummary(month);
  return <aside className="seasonal-home-badge" aria-label="이번 달 계절 추천">
    <img src="/ui/info_card_frame.png" alt="" draggable={false} />
    <div>
      <small>SEASON GUIDE</small>
      <strong>{summary.title}</strong>
      <span>{summary.recommendation}</span>
    </div>
  </aside>;
}
