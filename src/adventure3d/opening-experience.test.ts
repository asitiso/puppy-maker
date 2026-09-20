import {describe,expect,it} from 'vitest';
import {DEFAULT_ADVENTURE_CAMERA} from './camera-controller';
import {
  DAWNREACH_OPENING,
  completeDawnreachOpening,
  createDawnreachOpeningState,
  createDiscoveryReveal,
  dawnreachOpeningCamera,
  dawnreachOpeningGuidance,
  freshDawnreachOpeningEligible,
  markDawnreachOpeningLooked,
  stepDawnreachOpening,
  stepDiscoveryReveal,
} from './opening-experience';
import {STARTING_FIELD} from './starting-field';

describe('V18 first ten minutes opening experience',()=>{
  it('only runs for a genuinely fresh Dawnreach state',()=>{
    expect(freshDawnreachOpeningEligible({
      discoveredCount:0,
      campCleared:false,
      echoSenseUnlocked:false,
      skybreakBeaconReached:false,
      cloudGardenRestored:false,
      tempestWardenDefeated:false,
    })).toBe(true);
    expect(freshDawnreachOpeningEligible({
      discoveredCount:1,
      campCleared:false,
      echoSenseUnlocked:false,
      skybreakBeaconReached:false,
      cloudGardenRestored:false,
      tempestWardenDefeated:false,
    })).toBe(false);
  });

  it('widens the starting camera without mutating canonical camera and yields instantly to input',()=>{
    const opening=createDawnreachOpeningState(true,STARTING_FIELD.spawn);
    const wide=dawnreachOpeningCamera(DEFAULT_ADVENTURE_CAMERA,opening);
    expect(wide.distance).toBeGreaterThan(DEFAULT_ADVENTURE_CAMERA.distance);
    expect(DEFAULT_ADVENTURE_CAMERA.distance).toBe(12);

    const looked=markDawnreachOpeningLooked(opening);
    expect(dawnreachOpeningCamera(DEFAULT_ADVENTURE_CAMERA,looked)).toBe(DEFAULT_ADVENTURE_CAMERA);

    const moved=stepDawnreachOpening(
      opening,
      {...STARTING_FIELD.spawn,x:STARTING_FIELD.spawn.x+DAWNREACH_OPENING.moveDistance+1},
      .05,
    );
    expect(moved.moved).toBe(true);
    expect(dawnreachOpeningCamera(DEFAULT_ADVENTURE_CAMERA,moved)).toBe(DEFAULT_ADVENTURE_CAMERA);
  });

  it('teaches through environmental choices rather than a single quest destination',()=>{
    const opening=createDawnreachOpeningState(true,STARTING_FIELD.spawn);
    expect(dawnreachOpeningGuidance(opening,null)).toContain('전망대');
    expect(dawnreachOpeningGuidance(opening,null)).toContain('폐허');
    expect(dawnreachOpeningGuidance(opening,null)).toContain('연기');

    const completed=completeDawnreachOpening(opening);
    expect(dawnreachOpeningGuidance(completed,null)).toBeNull();
  });

  it('creates a short discovery reveal that expires independently of persistence',()=>{
    const discovery=STARTING_FIELD.discoveries[1];
    let reveal=createDiscoveryReveal(discovery);
    expect(reveal.label).toBe(discovery.label);
    expect(reveal.remaining).toBe(DAWNREACH_OPENING.revealDuration);
    reveal=stepDiscoveryReveal(reveal,.25)!;
    expect(reveal.remaining).toBeLessThan(DAWNREACH_OPENING.revealDuration);
    let current= reveal as ReturnType<typeof createDiscoveryReveal>|null;
    for(let i=0;i<12&&current;i++)current=stepDiscoveryReveal(current,.25);
    expect(current).toBeNull();
  });
});
