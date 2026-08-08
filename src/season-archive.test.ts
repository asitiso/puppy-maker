import { describe, expect, it } from 'vitest';
import { seasonArchiveRecords } from './season-archive';

describe('season archive', () => {
  it('returns no records for an empty history', () => {
    expect(seasonArchiveRecords([])).toEqual([]);
  });

  it('derives compact newest-first season records with score ranks', () => {
    expect(seasonArchiveRecords([
      { key:'1-spring', score:49, tiersCompleted:0, tokensEarned:5 },
      { key:'1-summer', score:350, tiersCompleted:5, tokensEarned:60 },
      { key:'1-autumn', score:1250, tiersCompleted:10, tokensEarned:200 },
    ])).toEqual([
      { key:'1-autumn', label:'1년차 가을', score:1250, tiersCompleted:10, tokensEarned:200, rank:'전설' },
      { key:'1-summer', label:'1년차 여름', score:350, tiersCompleted:5, tokensEarned:60, rank:'수호' },
      { key:'1-spring', label:'1년차 봄', score:49, tiersCompleted:0, tokensEarned:5, rank:'새싹' },
    ]);
  });

  it('uses stable score boundaries for archive ranks', () => {
    const scores = [49,50,174,175,349,350,624,625,999,1000];
    const ranks = seasonArchiveRecords(scores.map((score,index) => ({
      key:`${index + 1}-spring` as `${number}-spring`, score, tiersCompleted:0, tokensEarned:0,
    }))).reverse().map(record => record.rank);
    expect(ranks).toEqual(['새싹','견습','견습','성장','성장','수호','수호','별빛','별빛','전설']);
  });
});
