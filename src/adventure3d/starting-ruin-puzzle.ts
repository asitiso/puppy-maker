import {startingFieldHeight} from './starting-field';
import type {RuinPuzzleLayout} from './environment-system';
import type {Vec3} from './types';

const point=(x:number,z:number):Vec3=>({x,y:startingFieldHeight(x,z),z});

export const STARTING_RUIN_PUZZLE:RuinPuzzleLayout={
  center:point(-54,-34),
  westPlate:point(-59,-39),
  eastPlate:point(-49,-39),
  brazier:point(-61,-32),
  stoneStart:point(-51,-28),
  reward:point(-54,-43),
};
