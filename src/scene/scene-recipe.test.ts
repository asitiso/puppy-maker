import {describe,expect,it} from 'vitest';
import {LOCATION_IDS} from './scene-types';
import {SCENE_RECIPES,resolveSceneRecipe} from './scene-recipe';

describe('V14 scene identity recipes',()=>{
  it('defines a complete presentation recipe for every canonical location',()=>{
    for(const location of LOCATION_IDS){
      const recipe=SCENE_RECIPES[location];
      expect(recipe.location).toBe(location);
      expect(recipe.composition).toBeTruthy();
      expect(recipe.camera.focalPoint).toHaveLength(2);
      expect(recipe.actor.scale).toBeGreaterThan(0);
      expect(recipe.depth.background).toBeTruthy();
      expect(recipe.depth.midground).toBeTruthy();
      expect(recipe.depth.foreground).toBeTruthy();
      expect(recipe.interactionSkin).toBeTruthy();
      expect(recipe.chrome.material).toBeTruthy();
      expect(recipe.lighting).toBeTruthy();
      expect(recipe.ambient).toBeTruthy();
      expect(recipe.compact.actorScale).toBeGreaterThan(0);
    }
  });

  it('gives the core locations recognizably different spatial identities',()=>{
    expect(SCENE_RECIPES.home.composition).toBe('lived-in-room');
    expect(SCENE_RECIPES.training_ground.composition).toBe('target-lane');
    expect(SCENE_RECIPES.magic_classroom.composition).toBe('ritual-chamber');
    expect(SCENE_RECIPES.herb_garden.composition).toBe('greenhouse-workbench');
    expect(SCENE_RECIPES.forest.composition).toBe('deep-path');
    expect(SCENE_RECIPES.village.composition).toBe('street-plaza');
    expect(SCENE_RECIPES.lakeside.composition).toBe('wide-horizon');
    expect(SCENE_RECIPES.old_shrine.composition).toBe('symmetric-altar');
    expect(SCENE_RECIPES.expedition_field.composition).toBe('expedition-route');
  });

  it('uses environment props instead of tint-only state changes',()=>{
    expect(resolveSceneRecipe({location:'village',weather:'rain'}).props).toEqual(expect.arrayContaining(['rain-eaves','wet-street']));
    expect(resolveSceneRecipe({location:'forest',season:'winter'}).props).toContain('snow-branches');
    expect(resolveSceneRecipe({location:'expedition_field',worldFacts:['rift_unstable']}).props).toContain('rift-distortion');
    expect(resolveSceneRecipe({location:'village',worldFacts:['festival_saved']}).props).toContain('festival-lanterns');
  });

  it('does not give expedition the same depth identity as the forest outing',()=>{
    expect(SCENE_RECIPES.expedition_field.depth).not.toEqual(SCENE_RECIPES.forest.depth);
    expect(SCENE_RECIPES.expedition_field.interactionSkin).not.toBe(SCENE_RECIPES.forest.interactionSkin);
  });

  it('maps semantic expedition checkpoints to preparation, exploration, tactical, and debrief presentation',()=>{
    const preparation=resolveSceneRecipe({location:'expedition_field',presentationTags:['expedition:node','node:camp']});
    const exploration=resolveSceneRecipe({location:'expedition_field',presentationTags:['expedition:node','node:ruin']});
    const tactical=resolveSceneRecipe({location:'expedition_field',presentationTags:['expedition:encounter','node:encounter']});
    const debrief=resolveSceneRecipe({location:'expedition_field',presentationTags:['expedition:reward','node:return']});

    expect(preparation.composition).toBe('expedition-camp');
    expect(preparation.props).toEqual(expect.arrayContaining(['camp-tent','route-map','field-gear']));
    expect(exploration.composition).toBe('expedition-route');
    expect(exploration.props).toContain('ruin-marker');
    expect(tactical.composition).toBe('expedition-battlefield');
    expect(tactical.depth.midground).toBe('battle-center');
    expect(tactical.props).toEqual(expect.arrayContaining(['enemy-markers','battle-cover','command-lines']));
    expect(tactical.interactionSkin).toBe('expedition-tactical');
    expect(debrief.composition).toBe('expedition-debrief');
    expect(debrief.props).toEqual(expect.arrayContaining(['record-scroll','return-map']));
  });
});