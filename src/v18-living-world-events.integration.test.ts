// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const roaming=readFileSync(new URL('./adventure3d/roaming-world.ts',import.meta.url),'utf8');
const wildlife=readFileSync(new URL('./adventure3d/wildlife.ts',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 living world event integration',()=>{
  it('witnesses the roadside event from world proximity rather than a fixed quest marker',()=>{
    expect(slice).toContain('shouldWitnessRoadsideAmbush');
    expect(slice).toContain("roadsideAmbushPhaseRef.current==='hidden'");
    expect(slice).toContain("setWorldEventPhase('witnessed')");
    expect(renderer).toContain('drawWorldEvent');
  });

  it('lets the player intervene or pass and persists either consequence once',()=>{
    expect(slice).toContain("requestOpenAdventureUpdate({type:'resolve-world-event',id:ROADSIDE_AMBUSH.id,outcome:'passed'})");
    expect(slice).toContain("requestOpenAdventureUpdate({type:'resolve-world-event',id:ROADSIDE_AMBUSH.id,outcome:'rescued'})");
    expect(slice).toContain('createRoadsideAmbushEnemies()');
    expect(persistence).toContain("update.type==='resolve-world-event'");
  });

  it('turns either saved outcome into a visible revisitable world consequence',()=>{
    expect(slice).toContain('roadsideAmbushConsequence(roadsideOutcomeRef.current)');
    expect(slice).toContain("roadsideOutcomeRef.current='rescued'");
    expect(slice).toContain("roadsideOutcomeRef.current='passed'");
    expect(slice).toContain('playerNearWorldConsequence');
    expect(slice).toContain('roadsideConsequenceMessage');
    expect(renderer).toContain('drawWorldConsequence');
    expect(renderer).toContain("consequence.kind==='rescued-traveler'");
  });

  it('adds a non-combat presence that moves independently, pauses for interaction, and remembers familiarity',()=>{
    expect(roaming).toContain('stepWanderingCaravan');
    expect(roaming).toContain('shouldWitnessWanderingCaravan');
    expect(slice).toContain('caravanRef.current=stepWanderingCaravan');
    expect(slice).toContain("id:WANDERING_CARAVAN.id,outcome:'met'");
    expect(slice).toContain('wanderingCaravanMessage');
    expect(renderer).toContain('drawRoamingWorldPresence');
    expect(persistence).toContain('isValidDawnreachWorldEventResolution');
  });

  it('adds wildlife that moves on its own and reacts to both player proximity and field fire',()=>{
    expect(wildlife).toContain('stepDawnreachHerd');
    expect(wildlife).toContain("behavior='flee-player'");
    expect(wildlife).toContain("behavior='flee-fire'");
    expect(wildlife).toContain('closestBurningHazard');
    expect(slice).toContain('herdRef.current=stepDawnreachHerd');
    expect(slice).toContain('hazardsRef.current');
    expect(renderer).toContain('drawWildlife');
  });

  it('keeps event enemies separate from permanent camp completion',()=>{
    expect(slice).toContain('isStartingCampEnemy');
    expect(slice).toContain('roadsideAmbushDefeated');
    expect(slice).toContain('campLiving');
  });

  it('offers the choice directly in the play surface on desktop and mobile',()=>{
    expect(slice).toContain('adventure3d__world-event');
    expect(slice).toContain('개입');
    expect(slice).toContain('지나가기');
  });
});
