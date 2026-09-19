import {createDryGrassPatch,type FieldHazardState} from './environment-combat';
import {startingFieldHeight} from './starting-field';
import type {Vec3} from './types';

const point=(x:number,z:number):Vec3=>({x,y:startingFieldHeight(x,z),z});

export function createStartingCampHazards():FieldHazardState[]{
  return [
    createDryGrassPatch('camp-grass-west',point(43,-41),4.1),
    createDryGrassPatch('camp-grass-center',point(51,-43),4.3),
    createDryGrassPatch('camp-grass-east',point(59,-39),4),
  ];
}
