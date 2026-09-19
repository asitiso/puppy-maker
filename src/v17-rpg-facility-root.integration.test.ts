// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const root=readFileSync(new URL('./Root.tsx',import.meta.url),'utf8');
const facility=readFileSync(new URL('./RpgFacilityFeature.tsx',import.meta.url),'utf8');

describe('V17 RPG facility routing and code splitting',()=>{
  it('routes growth management features through walkable facility rooms',()=>{
    expect(root).toContain('isRpgFacilityFeature(feature)');
    expect(root).toContain('<RpgFacilityFeature');
    expect(root).toContain('renderSystem={returnToRoom=>');
    expect(root).toContain("feature==='inventory'||feature==='achievements'");
    expect(root).toContain("feature==='raising'");
    expect(root).toContain("feature==='ambition'");
    expect(root).toContain("feature==='season'");
    expect(root).toContain('<SanctuaryOverlay');
    expect(root).toContain('onExit={handleBack}');
  });

  it('returns closable growth systems to their room instead of ejecting to the district',()=>{
    expect(root).toContain('onClose={returnToRoom}');
    expect(root).toContain('if(!open)returnToRoom()');
    expect(root).toContain('className="rpg-facility-system__return"');
    expect(facility).toContain('setSystemOpen(false)');
    expect(facility).toContain("if(destinationId===FACILITY_SYSTEM_DESTINATION)setSystemOpen(true)");
  });

  it('lazy-loads heavy feature systems behind the world route',()=>{
    for(const moduleName of [
      'CollectionArchiveOverlay',
      'GuardianExpeditionOverlay',
      'MobileLegacyFeaturePage',
      'RaisingIdentityOverlay',
      'SanctuaryOverlay',
      'SeasonLiveOpsOverlay',
      'TacticalExpeditionFlow',
      'WorldProgressOverlay',
      'YearlyAmbitionOverlay',
    ]) expect(root).toContain(`lazy(()=>import('./${moduleName}'))`);
    expect(root).toContain('<Suspense fallback=');
    expect(root).toContain('rpg-feature-loading');
  });
});
