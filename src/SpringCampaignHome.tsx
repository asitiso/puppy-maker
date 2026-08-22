type SpringCampaignHomeProps = {
  seasonLabel: string;
  monthLabel: string;
  campaignLabel: string;
  primaryActionLabel: string;
  relationshipChange: string;
  worldChange: string;
  onPrimaryAction: () => void;
};

export default function SpringCampaignHome({
  seasonLabel,
  monthLabel,
  campaignLabel,
  primaryActionLabel,
  relationshipChange,
  worldChange,
  onPrimaryAction,
}: SpringCampaignHomeProps) {
  return (
    <section aria-label="캠페인 홈">
      <header>
        <span>{seasonLabel}</span>
        <span>{monthLabel}</span>
      </header>
      <h1>{campaignLabel}</h1>
      <dl>
        <div>
          <dt>관계 변화</dt>
          <dd>{relationshipChange}</dd>
        </div>
        <div>
          <dt>월드 변화</dt>
          <dd>{worldChange}</dd>
        </div>
      </dl>
      <button type="button" onClick={onPrimaryAction}>
        {primaryActionLabel}
      </button>
    </section>
  );
}
