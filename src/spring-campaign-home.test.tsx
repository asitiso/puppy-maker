import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import SpringCampaignHome from './SpringCampaignHome';

describe('V3 Spring campaign home', () => {
  it('shows the one-screen campaign summary without affinity gauge spam', () => {
    const html = renderToStaticMarkup(
      <SpringCampaignHome
        seasonLabel="봄"
        monthLabel="4월"
        campaignLabel="Pathfinder"
        primaryActionLabel="탐험 계속하기"
        relationshipChange="리오와 약속을 지켰어요"
        worldChange="고대 경로가 열렸어요"
        onPrimaryAction={vi.fn()}
      />,
    );

    expect(html).toContain('봄');
    expect(html).toContain('4월');
    expect(html).toContain('Pathfinder');
    expect(html).toContain('탐험 계속하기');
    expect(html).toContain('리오와 약속을 지켰어요');
    expect(html).toContain('고대 경로가 열렸어요');
    expect((html.match(/탐험 계속하기/g) ?? []).length).toBe(1);
    expect(html).not.toContain('affinity');
    expect(html).not.toContain('호감도 82');
  });
});
