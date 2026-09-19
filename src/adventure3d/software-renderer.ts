import {adventureCameraBasis} from './camera-controller';
import {startingFieldHeight} from './starting-field';
import type {AdventureCameraState,AdventureDiscovery,AdventureFieldDefinition,PlayerMotionState,Vec3} from './types';
import type {AdventureEnemyState} from './enemy-ai';
import type {PlayerCombatState} from './combat-system';

type Projected={x:number;y:number;depth:number;scale:number};

function dot(a:Vec3,b:Vec3){return a.x*b.x+a.y*b.y+a.z*b.z;}

export function projectAdventurePoint(point:Vec3,camera:AdventureCameraState,width:number,height:number):Projected|null{
  const {eye,forward,right,up}=adventureCameraBasis(camera);
  const relative={x:point.x-eye.x,y:point.y-eye.y,z:point.z-eye.z};
  const depth=dot(relative,forward);
  if(depth<=.25)return null;
  const focal=Math.min(width,height)/(2*Math.tan(65*Math.PI/360));
  return {
    x:width/2+dot(relative,right)/depth*focal,
    y:height/2-dot(relative,up)/depth*focal,
    depth,
    scale:focal/depth,
  };
}

function line(ctx:CanvasRenderingContext2D,a:Projected|null,b:Projected|null,stroke:string,width=1){
  if(!a||!b)return;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();
}

function discoveryPalette(kind:AdventureDiscovery['kind']){
  if(kind==='vista')return {body:'#d9c47d',glow:'#fff0ae'};
  if(kind==='ruin')return {body:'#7d86a6',glow:'#bfc9ff'};
  if(kind==='camp')return {body:'#b56742',glow:'#ffbe73'};
  if(kind==='resource')return {body:'#67a9ad',glow:'#9cecf0'};
  if(kind==='secret')return {body:'#6f668e',glow:'#c9b8ff'};
  if(kind==='puzzle')return {body:'#9a8c66',glow:'#f2dc9b'};
  if(kind==='npc')return {body:'#9b775e',glow:'#f1c8a6'};
  return {body:'#788b70',glow:'#b7d6ac'};
}

function drawDiscovery(
  ctx:CanvasRenderingContext2D,
  discovery:AdventureDiscovery,
  camera:AdventureCameraState,
  width:number,
  height:number,
  visited:boolean,
  nearby:boolean,
){
  const ground=startingFieldHeight(discovery.position.x,discovery.position.z);
  const base=projectAdventurePoint({x:discovery.position.x,y:ground,z:discovery.position.z},camera,width,height);
  const top=projectAdventurePoint({x:discovery.position.x,y:ground+discovery.height,z:discovery.position.z},camera,width,height);
  if(!base||!top)return;
  const palette=discoveryPalette(discovery.kind);
  const apparent=Math.max(4,Math.min(52,base.scale*(discovery.importance===3?2.8:1.7)));
  ctx.save();
  ctx.globalAlpha=visited?.45:1;
  const gradient=ctx.createLinearGradient(base.x,top.y,base.x,base.y);
  gradient.addColorStop(0,palette.glow);gradient.addColorStop(1,palette.body);
  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.moveTo(base.x-apparent,base.y);
  ctx.lineTo(top.x-apparent*.45,top.y);
  ctx.lineTo(top.x+apparent*.45,top.y);
  ctx.lineTo(base.x+apparent,base.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle=nearby?'#fff7c2':'rgba(255,255,255,.28)';
  ctx.lineWidth=nearby?3:1;
  ctx.stroke();

  if(discovery.kind==='camp'){
    ctx.fillStyle='rgba(248,150,71,.32)';
    ctx.beginPath();ctx.arc(top.x,top.y-apparent*.8,apparent*1.2,0,Math.PI*2);ctx.fill();
  }
  if(discovery.kind==='vista'){
    ctx.strokeStyle='rgba(255,242,181,.62)';
    ctx.lineWidth=Math.max(1,apparent*.08);
    ctx.beginPath();ctx.moveTo(top.x,top.y);ctx.lineTo(top.x,top.y-apparent*1.8);ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(ctx:CanvasRenderingContext2D,player:PlayerMotionState,camera:AdventureCameraState,width:number,height:number){
  const base=projectAdventurePoint(player.position,camera,width,height);
  const top=projectAdventurePoint({...player.position,y:player.position.y+1.7},camera,width,height);
  if(!base||!top)return;
  const radius=Math.max(5,Math.min(24,base.scale*.55));
  ctx.save();
  ctx.fillStyle='#f2e5b7';
  ctx.strokeStyle='#4d5148';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.roundRect(top.x-radius,top.y,radius*2,Math.max(radius*2.1,base.y-top.y),radius);
  ctx.fill();ctx.stroke();
  ctx.fillStyle='#6f89a7';
  ctx.beginPath();ctx.arc(top.x,top.y+radius*.3,radius*.72,0,Math.PI*2);ctx.fill();
  ctx.restore();
}


function drawEnemy(
  ctx:CanvasRenderingContext2D,
  enemy:AdventureEnemyState,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  if(enemy.mode==='defeated')return;
  const base=projectAdventurePoint(enemy.position,camera,width,height);
  const top=projectAdventurePoint({...enemy.position,y:enemy.position.y+1.55},camera,width,height);
  if(!base||!top)return;
  const scale=Math.max(5,Math.min(24,base.scale*.62));
  ctx.save();

  if(enemy.mode==='windup'){
    const ring=Math.max(12,Math.min(54,base.scale*2.2));
    ctx.strokeStyle='rgba(255,101,73,.9)';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.ellipse(base.x,base.y,ring,ring*.36,0,0,Math.PI*2);
    ctx.stroke();
    ctx.fillStyle='rgba(255,83,57,.11)';
    ctx.fill();
  }

  const stagger=enemy.mode==='stagger';
  const body=enemy.archetype==='guard'?'#705a4f':'#84504b';
  ctx.fillStyle=stagger?'#f2d3b5':body;
  ctx.strokeStyle=enemy.mode==='suspicious'?'#f2d77b':enemy.mode==='windup'?'#ff765e':'rgba(45,36,32,.9)';
  ctx.lineWidth=enemy.mode==='windup'?3:2;
  ctx.beginPath();
  ctx.roundRect(top.x-scale,top.y,scale*2,Math.max(scale*2.1,base.y-top.y),scale*.7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=enemy.archetype==='guard'?'#d8c29d':'#c6a786';
  ctx.beginPath();
  ctx.arc(top.x,top.y+scale*.25,scale*.7,0,Math.PI*2);
  ctx.fill();

  if(enemy.mode==='suspicious'||enemy.mode==='chase'||enemy.mode==='windup'||enemy.mode==='recover'||enemy.hp<enemy.maxHp){
    const barWidth=Math.max(28,Math.min(70,scale*3.2));
    const ratio=Math.max(0,Math.min(1,enemy.hp/enemy.maxHp));
    ctx.fillStyle='rgba(20,20,18,.72)';
    ctx.fillRect(top.x-barWidth/2,top.y-12,barWidth,5);
    ctx.fillStyle=enemy.mode==='windup'?'#ff846f':'#d9b878';
    ctx.fillRect(top.x-barWidth/2,top.y-12,barWidth*ratio,5);
  }

  const mark=enemy.mode==='suspicious'?'?':enemy.mode==='chase'||enemy.mode==='windup'?'!':'';
  if(mark){
    ctx.fillStyle=enemy.mode==='windup'?'#ff8b73':'#ffe08a';
    ctx.font=`900 ${Math.max(11,Math.min(22,scale*1.1))}px system-ui`;
    ctx.textAlign='center';
    ctx.fillText(mark,top.x,top.y-18);
  }
  ctx.restore();
}

function drawCombatEffects(
  ctx:CanvasRenderingContext2D,
  player:PlayerMotionState,
  combat:PlayerCombatState,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  const base=projectAdventurePoint(player.position,camera,width,height);
  if(!base)return;
  ctx.save();
  if(combat.attackClock>=0){
    const progress=Math.min(1,combat.attackClock/.48);
    const radius=Math.max(18,Math.min(70,base.scale*2.6));
    ctx.strokeStyle=progress<.58?'rgba(255,244,183,.82)':'rgba(255,244,183,.18)';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(base.x,base.y-radius*.12,radius,-2.45,-.35);
    ctx.stroke();
  }
  if(combat.dodgeClock>=0){
    ctx.strokeStyle='rgba(174,225,238,.58)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.ellipse(base.x,base.y,Math.max(16,base.scale*1.5),Math.max(6,base.scale*.45),0,0,Math.PI*2);
    ctx.stroke();
  }
  if(combat.flash>0){
    ctx.fillStyle='rgba(255,88,70,.15)';
    ctx.fillRect(0,0,width,height);
  }
  ctx.restore();
}

export function renderAdventureField(
  ctx:CanvasRenderingContext2D,
  width:number,
  height:number,
  field:AdventureFieldDefinition,
  player:PlayerMotionState,
  camera:AdventureCameraState,
  visited:ReadonlySet<string>,
  nearbyId:string|null,
  enemies:readonly AdventureEnemyState[]=[],
  combat?:PlayerCombatState,
){
  ctx.clearRect(0,0,width,height);
  const sky=ctx.createLinearGradient(0,0,0,height);
  sky.addColorStop(0,'#7ba8c2');sky.addColorStop(.5,'#c4d7c0');sky.addColorStop(1,'#506d55');
  ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);

  const groundTop=projectAdventurePoint({x:0,y:0,z:-110},camera,width,height);
  const horizon=Math.max(0,Math.min(height,groundTop?.y??height*.46));
  const ground=ctx.createLinearGradient(0,horizon,0,height);
  ground.addColorStop(0,'rgba(104,135,91,.55)');ground.addColorStop(1,'rgba(42,74,55,.96)');
  ctx.fillStyle=ground;
  ctx.fillRect(0,horizon,width,height-horizon);

  for(let grid=-100;grid<=100;grid+=10){
    const xa=projectAdventurePoint({x:grid,y:startingFieldHeight(grid,-100),z:-100},camera,width,height);
    const xb=projectAdventurePoint({x:grid,y:startingFieldHeight(grid,100),z:100},camera,width,height);
    line(ctx,xa,xb,'rgba(226,239,205,.09)');
    const za=projectAdventurePoint({x:-100,y:startingFieldHeight(-100,grid),z:grid},camera,width,height);
    const zb=projectAdventurePoint({x:100,y:startingFieldHeight(100,grid),z:grid},camera,width,height);
    line(ctx,za,zb,'rgba(226,239,205,.09)');
  }

  const sorted=[...field.discoveries].sort((a,b)=>{
    const pa=projectAdventurePoint({...a.position,y:startingFieldHeight(a.position.x,a.position.z)},camera,width,height);
    const pb=projectAdventurePoint({...b.position,y:startingFieldHeight(b.position.x,b.position.z)},camera,width,height);
    return (pb?.depth??0)-(pa?.depth??0);
  });
  for(const discovery of sorted)drawDiscovery(ctx,discovery,camera,width,height,visited.has(discovery.id),nearbyId===discovery.id);
  const enemyDepth=[...enemies].sort((a,b)=>{
    const pa=projectAdventurePoint(a.position,camera,width,height);
    const pb=projectAdventurePoint(b.position,camera,width,height);
    return (pb?.depth??0)-(pa?.depth??0);
  });
  for(const enemy of enemyDepth)drawEnemy(ctx,enemy,camera,width,height);
  if(combat)drawCombatEffects(ctx,player,combat,camera,width,height);
  drawPlayer(ctx,player,camera,width,height);
}
