import type {ExplorationInteractable,ExplorationWorldDefinition,Vec2,WorldBounds} from './exploration-types';

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export function normalizeDirection(input:Vec2):Vec2{
  const x=finite(input.x);
  const y=finite(input.y);
  const magnitude=Math.hypot(x,y);
  if(magnitude===0) return {x:0,y:0};
  if(magnitude<=1) return {x,y};
  return {x:x/magnitude,y:y/magnitude};
}

function collides(point:Vec2,world:ExplorationWorldDefinition):boolean{
  const radius=Math.max(0,finite(world.playerRadius));
  return world.obstacles.some(obstacle=>{
    const left=finite(obstacle.x)-radius;
    const right=finite(obstacle.x)+Math.max(0,finite(obstacle.width))+radius;
    const top=finite(obstacle.y)-radius;
    const bottom=finite(obstacle.y)+Math.max(0,finite(obstacle.height))+radius;
    return point.x>=left&&point.x<=right&&point.y>=top&&point.y<=bottom;
  });
}

function clampToWorld(point:Vec2,world:ExplorationWorldDefinition):Vec2{
  const radius=Math.max(0,finite(world.playerRadius));
  const maxX=Math.max(radius,finite(world.width)-radius);
  const maxY=Math.max(radius,finite(world.height)-radius);
  return {
    x:clamp(finite(point.x),radius,maxX),
    y:clamp(finite(point.y),radius,maxY),
  };
}

function moveCollisionStep(position:Vec2,delta:Vec2,world:ExplorationWorldDefinition):Vec2{
  const nextX=clampToWorld({x:position.x+finite(delta.x),y:position.y},world);
  const afterX=collides(nextX,world)?position:nextX;
  const nextY=clampToWorld({x:afterX.x,y:afterX.y+finite(delta.y)},world);
  return collides(nextY,world)?afterX:nextY;
}

export function moveWithCollisions(position:Vec2,delta:Vec2,world:ExplorationWorldDefinition):Vec2{
  let current=clampToWorld(position,world);
  const dx=finite(delta.x);
  const dy=finite(delta.y);
  const radius=Math.max(1,finite(world.playerRadius,1));
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/radius));
  const step={x:dx/steps,y:dy/steps};
  for(let index=0;index<steps;index+=1) current=moveCollisionStep(current,step,world);
  return current;
}

export function cameraForPlayer(player:Vec2,world:WorldBounds,viewport:WorldBounds):Vec2{
  const viewportWidth=Math.max(0,finite(viewport.width));
  const viewportHeight=Math.max(0,finite(viewport.height));
  const maxX=Math.max(0,finite(world.width)-viewportWidth);
  const maxY=Math.max(0,finite(world.height)-viewportHeight);
  return {
    x:clamp(finite(player.x)-viewportWidth/2,0,maxX),
    y:clamp(finite(player.y)-viewportHeight/2,0,maxY),
  };
}

export function interactionIsUnlocked(item:ExplorationInteractable,completed:ReadonlySet<string>):boolean{
  const requirements=item.requiresCompleted??[];
  return requirements.every(id=>completed.has(id));
}

export function nearestInteractable(player:Vec2,items:readonly ExplorationInteractable[]):ExplorationInteractable|null{
  let nearest:ExplorationInteractable|null=null;
  let nearestDistance=Number.POSITIVE_INFINITY;
  for(const item of items){
    if(item.enabled===false) continue;
    const dx=finite(item.position.x)-finite(player.x);
    const dy=finite(item.position.y)-finite(player.y);
    const distance=Math.hypot(dx,dy);
    if(distance<=Math.max(0,finite(item.radius))&&distance<nearestDistance){
      nearest=item;
      nearestDistance=distance;
    }
  }
  return nearest;
}
