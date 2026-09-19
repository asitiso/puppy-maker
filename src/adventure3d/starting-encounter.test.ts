import {describe,expect,it} from 'vitest';
import {createStartingCampEnemies,isStartingCampEnemy} from './starting-encounter';
import {STARTING_FIELD} from './starting-field';

describe('V18 Dawnreach camp encounter',()=>{
  it('places a small readable encounter around the visible camp landmark',()=>{
    const camp=STARTING_FIELD.discoveries.find(item=>item.id==='ember-camp')!;
    const enemies=createStartingCampEnemies();
    expect(enemies.every(enemy=>isStartingCampEnemy(enemy))).toBe(true);
    expect(isStartingCampEnemy('roadside-raider-a')).toBe(false);
    expect(enemies).toHaveLength(3);
    expect(enemies.filter(enemy=>enemy.archetype==='rusher')).toHaveLength(2);
    expect(enemies.filter(enemy=>enemy.archetype==='guard')).toHaveLength(1);
    for(const enemy of enemies){
      expect(Math.hypot(enemy.position.x-camp.position.x,enemy.position.z-camp.position.z)).toBeLessThan(12);
      expect(enemy.patrol.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the camp avoidable instead of spawning enemies on the player',()=>{
    const enemies=createStartingCampEnemies();
    for(const enemy of enemies){
      expect(Math.hypot(enemy.position.x-STARTING_FIELD.spawn.x,enemy.position.z-STARTING_FIELD.spawn.z)).toBeGreaterThan(60);
    }
  });
});
