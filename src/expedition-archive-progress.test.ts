import { describe, expect, it } from 'vitest';
import { emptyExpeditionRecords } from './expedition-regions';
import { expeditionArchiveProgress } from './expedition-archive-progress';

function recordsWithClears(ids: string[], sIds: string[] = []) {
  const records = emptyExpeditionRecords();
  for (const id of ids) {
    (records as any)[id] = { bestScore: 1000, bestGrade: sIds.includes(id) ? 'S' : 'B', cleared: true };
  }
  return records;
}

describe('expedition archive progression', () => {
  it('counts expedition collection categories from persistent state', () => {
    const records = recordsWithClears(['forest_path','forest_glade','forest_guardian'], ['forest_path','forest_glade','forest_guardian']);
    const progress = expeditionArchiveProgress({
      baseArchiveCurrent: 40,
      records,
      ownedRelics: ['moonfang_charm','mana_prism'],
      storyEntries: ['forest_path','forest_glade'],
      discoveries: ['forest_path_discovery'],
      craftingMilestones: ['crafted_star_cookie'],
      guardianRank: 'guardian',
      legacyId: 'first_page',
    });
    expect(progress).toMatchObject({
      expeditionStages:3,
      expeditionBosses:1,
      expeditionRelics:2,
      expeditionStories:2,
      expeditionDiscoveries:1,
      expeditionCrafting:1,
      expeditionRegions:1,
      expeditionSMilestones:1,
      guardianEvolution:2,
    });
  });

  it('unlocks star guardian when bosses and the 75-slot archive threshold are reached', () => {
    const records = recordsWithClears([
      'forest_path','forest_glade','forest_guardian','city_square','city_gallery','city_core','lake_channel','lake_cliff','lake_tempest',
    ]);
    const progress = expeditionArchiveProgress({
      baseArchiveCurrent: 50,
      records,
      ownedRelics: ['moonfang_charm','mana_prism','wind_feather','guardian_thread'],
      storyEntries: ['forest_path','forest_glade','forest_guardian','city_square','city_gallery','city_core','lake_channel'],
      discoveries: ['forest_path_discovery','forest_glade_discovery','forest_guardian_discovery','city_square_discovery'],
      craftingMilestones: ['crafted_star_cookie'],
      guardianRank: 'starlight',
      legacyId: 'living_legend',
    });
    expect(progress.guardianEvolution).toBeGreaterThanOrEqual(3);
  });

  it('lets legendary guardian become the 100th slot after the other 99 are ready', () => {
    const all = ['forest_path','forest_glade','forest_guardian','city_square','city_gallery','city_core','lake_channel','lake_cliff','lake_tempest'];
    const records = recordsWithClears(all, all);
    const progress = expeditionArchiveProgress({
      baseArchiveCurrent: 50,
      records,
      ownedRelics: ['moonfang_charm','mana_prism','wind_feather','guardian_thread','explorer_compass','bond_locket'],
      storyEntries: all as any,
      discoveries: [
        'forest_path_discovery','forest_glade_discovery','forest_guardian_discovery','city_square_discovery','city_gallery_discovery',
        'city_core_discovery','lake_channel_discovery','lake_cliff_discovery','lake_tempest_discovery',
      ],
      craftingMilestones: ['crafted_star_cookie','crafted_fox_charm','crafted_herb_tea','crafted_guardian_thread'],
      guardianRank: 'starlight',
      legacyId: 'eternal_guardian',
    });
    expect(Object.values(progress).reduce((sum, value) => sum + value, 0)).toBe(50);
    expect(progress.guardianEvolution).toBe(4);
  });
});
