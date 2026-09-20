import {adventureCameraBasis} from './camera-controller';
import {startingFieldHeight} from './starting-field';
import type {AdventureCameraState,AdventureDiscovery,AdventureFieldDefinition,PlayerMotionState,Vec3} from './types';
import type {AdventureEnemyState} from './enemy-ai';
import type {PlayerCombatState} from './combat-system';
import type {RuinPuzzleLayout,RuinPuzzleState} from './environment-system';
import type {FieldHazardState} from './environment-combat';
import type {WorldConsequenceVisual,WorldEventVisual} from './world-events';
import type {RoamingWorldPresenceVisual} from './roaming-world';
import type {WildlifeTrailVisual,WildlifeVisual} from './wildlife';
import type {HollowCaveVisual} from './hollow-cave';
import {SKYBREAK_HIGHLAND,skybreakHighlandHeight,type SkybreakHighlandVisual} from './skybreak-highland';
import {WINDWALK_ROUTE,type WindwalkRouteVisual} from './windwalk-routes';

type Projected={x:number;y:number;depth:number;scale:number};

export type AdventureWorldOverlay={
  windwalkRoute?:WindwalkRouteVisual|null;
};

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
  locked=false,
){
  if(enemy.mode==='defeated')return;
  const base=projectAdventurePoint(enemy.position,camera,width,height);
  const top=projectAdventurePoint({...enemy.position,y:enemy.position.y+1.55},camera,width,height);
  if(!base||!top)return;
  const scale=Math.max(5,Math.min(24,base.scale*.62));
  ctx.save();

  if(locked){
    const ring=Math.max(16,Math.min(62,base.scale*2.7));
    ctx.strokeStyle='rgba(186,232,255,.92)';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.ellipse(base.x,base.y,ring,ring*.34,0,0,Math.PI*2);
    ctx.stroke();
    ctx.strokeStyle='rgba(186,232,255,.52)';
    ctx.lineWidth=2;
    const bracket=ring*.34;
    ctx.beginPath();
    ctx.moveTo(base.x-ring,base.y-bracket*.2);ctx.lineTo(base.x-ring,base.y-bracket);ctx.lineTo(base.x-ring+bracket,base.y-bracket);
    ctx.moveTo(base.x+ring,base.y-bracket*.2);ctx.lineTo(base.x+ring,base.y-bracket);ctx.lineTo(base.x+ring-bracket,base.y-bracket);
    ctx.stroke();
  }

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


function drawFieldHazards(
  ctx:CanvasRenderingContext2D,
  hazards:readonly FieldHazardState[],
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  for(const hazard of hazards){
    const p=projectAdventurePoint(hazard.position,camera,width,height);
    if(!p)continue;
    const radius=Math.max(9,Math.min(46,p.scale*hazard.radius*1.4));
    ctx.save();
    ctx.globalAlpha=hazard.spent?.5:1;
    ctx.fillStyle=hazard.burning?'rgba(154,89,43,.38)':hazard.spent?'rgba(55,51,43,.42)':'rgba(151,132,75,.26)';
    ctx.strokeStyle=hazard.burning?'rgba(255,151,72,.74)':'rgba(194,177,102,.28)';
    ctx.lineWidth=hazard.burning?2:1;
    ctx.beginPath();ctx.ellipse(p.x,p.y,radius,radius*.3,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(hazard.burning){
      ctx.fillStyle='rgba(255,101,45,.16)';
      ctx.beginPath();ctx.arc(p.x,p.y-radius*.22,radius*1.25,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffae55';
      for(const offset of [-.45,0,.45]){
        ctx.beginPath();
        ctx.moveTo(p.x+radius*offset,p.y-radius*.15);
        ctx.lineTo(p.x+radius*(offset-.18),p.y-radius*.88);
        ctx.lineTo(p.x+radius*(offset+.18),p.y-radius*.15);
        ctx.closePath();ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawWorldEvent(
  ctx:CanvasRenderingContext2D,
  event:WorldEventVisual,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  const base=projectAdventurePoint(event.position,camera,width,height);
  const top=projectAdventurePoint({...event.position,y:event.position.y+1.7},camera,width,height);
  if(!base||!top)return;
  const size=Math.max(7,Math.min(26,base.scale*.72));
  ctx.save();

  const ring=Math.max(18,Math.min(58,base.scale*2.4));
  ctx.strokeStyle=event.phase==='witnessed'?'rgba(255,207,115,.88)':'rgba(154,222,203,.78)';
  ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(base.x,base.y,ring,ring*.32,0,0,Math.PI*2);ctx.stroke();

  ctx.fillStyle='#d7c49d';
  ctx.strokeStyle='#544a3f';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.roundRect(top.x-size*.7,top.y,size*1.4,Math.max(size*2,base.y-top.y),size*.5);
  ctx.fill();ctx.stroke();
  ctx.fillStyle='#7b9a86';
  ctx.beginPath();ctx.arc(top.x,top.y+size*.25,size*.55,0,Math.PI*2);ctx.fill();

  if(event.phase==='witnessed'){
    ctx.fillStyle='rgba(126,61,54,.94)';
    for(const offset of [-1.45,1.45]){
      const x=base.x+size*offset;
      ctx.beginPath();ctx.roundRect(x-size*.42,base.y-size*1.55,size*.84,size*1.55,size*.3);ctx.fill();
    }
    ctx.fillStyle='#ffd38b';
    ctx.font=`900 ${Math.max(13,Math.min(24,size*1.25))}px system-ui`;
    ctx.textAlign='center';
    ctx.fillText('!',top.x,top.y-size*.7);
  }
  ctx.restore();
}

function drawWorldConsequence(
  ctx:CanvasRenderingContext2D,
  consequence:WorldConsequenceVisual,
  camera:AdventureCameraState,
  width:number,
  height:number,
  nearby:boolean,
){
  const base=projectAdventurePoint(consequence.position,camera,width,height);
  if(!base)return;
  ctx.save();
  const size=Math.max(7,Math.min(26,base.scale*.75));

  if(consequence.kind==='rescued-traveler'){
    const top=projectAdventurePoint({...consequence.position,y:consequence.position.y+1.72},camera,width,height);
    if(!top){ctx.restore();return;}
    ctx.fillStyle='#d8c5a0';
    ctx.strokeStyle=nearby?'#fff0af':'rgba(76,66,55,.9)';
    ctx.lineWidth=nearby?3:2;
    ctx.beginPath();ctx.roundRect(top.x-size*.7,top.y,size*1.4,Math.max(size*2,base.y-top.y),size*.5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#7f9f8f';
    ctx.beginPath();ctx.arc(top.x,top.y+size*.22,size*.56,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(216,235,189,.18)';
    ctx.beginPath();ctx.arc(base.x,base.y-size*.2,size*1.8,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle='#7b6045';
    ctx.strokeStyle=nearby?'#ffe2a1':'rgba(67,51,38,.9)';
    ctx.lineWidth=nearby?3:2;
    ctx.beginPath();ctx.roundRect(base.x-size*1.1,base.y-size*.85,size*2.2,size*.85,4);ctx.fill();ctx.stroke();
    ctx.fillStyle='#9f815c';
    ctx.beginPath();ctx.roundRect(base.x-size*.7,base.y-size*1.5,size*1.35,size*.72,4);ctx.fill();
    ctx.strokeStyle='rgba(52,41,33,.82)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(base.x-size*1.15,base.y-size*.12);ctx.lineTo(base.x+size*1.15,base.y-size*.12);
    ctx.moveTo(base.x-size*.35,base.y-size*1.5);ctx.lineTo(base.x+size*.35,base.y-size*.78);
    ctx.stroke();
  }

  if(nearby){
    ctx.fillStyle='#fff2bd';
    ctx.font=`900 ${Math.max(10,Math.min(18,size*.9))}px system-ui`;
    ctx.textAlign='center';
    ctx.fillText('E',base.x,base.y-size*2);
  }
  ctx.restore();
}

function drawRoamingWorldPresence(
  ctx:CanvasRenderingContext2D,
  presence:RoamingWorldPresenceVisual,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  const base=projectAdventurePoint(presence.position,camera,width,height);
  const top=projectAdventurePoint({...presence.position,y:presence.position.y+1.65},camera,width,height);
  if(!base||!top)return;
  const size=Math.max(7,Math.min(25,base.scale*.72));
  ctx.save();

  ctx.fillStyle=presence.familiar?'#89a98f':'#b79b69';
  ctx.strokeStyle=presence.nearby?'#fff1ae':'rgba(64,55,45,.9)';
  ctx.lineWidth=presence.nearby?3:2;
  ctx.beginPath();ctx.roundRect(top.x-size*.55,top.y,size*1.1,Math.max(size*1.9,base.y-top.y),size*.45);ctx.fill();ctx.stroke();

  const beastX=base.x+size*1.5;
  ctx.fillStyle='#8a7157';
  ctx.beginPath();ctx.ellipse(beastX,base.y-size*.62,size*.95,size*.55,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6b553f';
  ctx.beginPath();ctx.arc(beastX+size*.7,base.y-size*.9,size*.32,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#594534';
  ctx.lineWidth=2;
  for(const offset of [-.45,.4]){
    ctx.beginPath();
    ctx.moveTo(beastX+size*offset,base.y-size*.28);
    ctx.lineTo(beastX+size*offset,base.y+size*.22);
    ctx.stroke();
  }

  ctx.fillStyle='#7a6046';
  ctx.beginPath();ctx.roundRect(beastX-size*.45,base.y-size*1.18,size*.9,size*.48,3);ctx.fill();

  if(presence.nearby){
    ctx.fillStyle='#fff2bd';
    ctx.font=`900 ${Math.max(10,Math.min(18,size*.9))}px system-ui`;
    ctx.textAlign='center';
    ctx.fillText('E',base.x,top.y-size*.55);
  }
  ctx.restore();
}

function drawWildlifeTrail(
  ctx:CanvasRenderingContext2D,
  trail:WildlifeTrailVisual,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  const alpha=.28+Math.min(1,trail.secondsRemaining/6)*.5;
  ctx.save();
  ctx.fillStyle=`rgba(218,230,187,${alpha})`;
  ctx.strokeStyle=`rgba(91,112,78,${Math.min(.72,alpha+.12)})`;
  ctx.lineWidth=1.2;
  for(const [index,point] of trail.points.entries()){
    const p=projectAdventurePoint(point,camera,width,height);
    if(!p)continue;
    const size=Math.max(3,Math.min(8,p.scale*.28));
    const side=index%2===0?-1:1;
    ctx.beginPath();
    ctx.ellipse(p.x+side*size*.45,p.y-size*.18,size*.42,size*.72,side*.28,0,Math.PI*2);
    ctx.fill();ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(p.x-side*size*.15,p.y+size*.18,size*.32,size*.58,-side*.2,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWildlife(
  ctx:CanvasRenderingContext2D,
  wildlife:WildlifeVisual,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  ctx.save();
  for(const member of wildlife.members){
    const base=projectAdventurePoint(member,camera,width,height);
    const top=projectAdventurePoint({...member,y:member.y+1.1},camera,width,height);
    if(!base||!top)continue;
    const size=Math.max(5,Math.min(18,base.scale*.55));
    const fleeing=wildlife.behavior==='flee-player'||wildlife.behavior==='flee-fire';

    ctx.fillStyle=fleeing?'#9a7350':'#8b7659';
    ctx.beginPath();
    ctx.ellipse(base.x,base.y-size*.55,size*.95,size*.48,0,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle='#755f47';
    ctx.beginPath();
    ctx.arc(base.x+size*.72,base.y-size*.9,size*.3,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle='#67513c';
    ctx.lineWidth=Math.max(1,size*.12);
    for(const offset of [-.45,.35]){
      ctx.beginPath();
      ctx.moveTo(base.x+size*offset,base.y-size*.25);
      ctx.lineTo(base.x+size*offset-(fleeing?size*.2:0),base.y+size*.28);
      ctx.stroke();
    }

    if(fleeing){
      ctx.strokeStyle=wildlife.behavior==='flee-fire'
        ?'rgba(255,180,110,.72)'
        :'rgba(235,235,206,.58)';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(base.x-size*1.15,base.y-size*.72);
      ctx.lineTo(base.x-size*1.75,base.y-size*.72);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHollowCave(
  ctx:CanvasRenderingContext2D,
  cave:HollowCaveVisual,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  ctx.save();
  ctx.fillStyle='rgba(8,13,20,.84)';
  ctx.fillRect(0,0,width,height);

  const center=projectAdventurePoint(cave.center,camera,width,height);
  if(center){
    const glow=ctx.createRadialGradient(center.x,center.y,4,center.x,center.y,Math.min(width,height)*.42);
    glow.addColorStop(0,'rgba(67,94,107,.28)');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;
    ctx.fillRect(0,0,width,height);
  }

  const ringPoints=Array.from({length:18},(_,index)=>{
    const angle=index/18*Math.PI*2;
    const x=cave.center.x+Math.cos(angle)*9.2;
    const z=cave.center.z+Math.sin(angle)*9.2;
    return projectAdventurePoint({x,y:startingFieldHeight(x,z)+.05,z},camera,width,height);
  });
  ctx.strokeStyle='rgba(127,149,157,.34)';
  ctx.lineWidth=2;
  ctx.beginPath();
  ringPoints.forEach((point,index)=>{
    if(!point)return;
    if(index===0)ctx.moveTo(point.x,point.y);
    else ctx.lineTo(point.x,point.y);
  });
  const first=ringPoints.find(Boolean);
  if(first)ctx.lineTo(first.x,first.y);
  ctx.stroke();

  for(const [index,resonator] of cave.resonators.entries()){
    const base=projectAdventurePoint(resonator.position,camera,width,height);
    const top=projectAdventurePoint({...resonator.position,y:resonator.position.y+1.45},camera,width,height);
    if(!base||!top)continue;
    const size=Math.max(7,Math.min(25,base.scale*.72));
    const flashing=cave.pulseFlash>0&&cave.lastResonator===index;
    if(resonator.active||flashing){
      ctx.fillStyle=flashing?'rgba(188,241,255,.4)':'rgba(132,213,222,.23)';
      ctx.beginPath();ctx.arc(top.x,top.y+size*.5,size*(flashing?2:1.45),0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle=resonator.active?'#91c7c6':'#59626a';
    ctx.strokeStyle=resonator.active?'#d6ffff':'rgba(179,194,198,.6)';
    ctx.lineWidth=resonator.active?3:2;
    ctx.beginPath();
    ctx.roundRect(top.x-size*.55,top.y,size*1.1,Math.max(size*2,base.y-top.y),size*.3);
    ctx.fill();ctx.stroke();
  }

  const drawGate=(position:Vec3,open:boolean,nearby:boolean,label:string)=>{
    const base=projectAdventurePoint(position,camera,width,height);
    const top=projectAdventurePoint({...position,y:position.y+2.2},camera,width,height);
    if(!base||!top)return;
    const size=Math.max(9,Math.min(34,base.scale*.9));
    ctx.strokeStyle=open?'#a9dfce':'#6b7078';
    ctx.lineWidth=open?4:3;
    ctx.beginPath();
    ctx.roundRect(top.x-size,top.y,size*2,Math.max(size*2.4,base.y-top.y),size*.8);
    ctx.stroke();
    if(open){
      ctx.fillStyle='rgba(118,194,184,.17)';
      ctx.fillRect(top.x-size*.75,top.y+size*.2,size*1.5,Math.max(size*1.6,base.y-top.y-size*.2));
    }
    if(nearby){
      ctx.fillStyle='#e8f7d5';
      ctx.font=`900 ${Math.max(11,Math.min(18,size*.65))}px system-ui`;
      ctx.textAlign='center';
      ctx.fillText('E',base.x,top.y-size*.28);
      ctx.font=`700 ${Math.max(9,Math.min(14,size*.48))}px system-ui`;
      ctx.fillText(label,base.x,base.y+size*.75);
    }
  };

  drawGate(cave.exit,true,cave.nearbyExit,'폭포 뒤로 돌아가기');
  drawGate(cave.shortcut,cave.shortcutOpen,cave.nearbyShortcut,cave.shortcutOpen?'돌다리 지름길':'닫힌 바위문');
  ctx.restore();
}

function drawSkybreakHighland(
  ctx:CanvasRenderingContext2D,
  highland:SkybreakHighlandVisual,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  ctx.save();

  const sky=ctx.createLinearGradient(0,0,0,height);
  sky.addColorStop(0,'#6e9eb4');
  sky.addColorStop(.55,'#b9d1c4');
  sky.addColorStop(1,'#5f735f');
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,width,height);

  for(let grid=-SKYBREAK_HIGHLAND.halfSize;grid<=SKYBREAK_HIGHLAND.halfSize;grid+=4){
    const xa=projectAdventurePoint({x:grid,y:skybreakHighlandHeight(grid,-SKYBREAK_HIGHLAND.halfSize),z:-SKYBREAK_HIGHLAND.halfSize},camera,width,height);
    const xb=projectAdventurePoint({x:grid,y:skybreakHighlandHeight(grid,SKYBREAK_HIGHLAND.halfSize),z:SKYBREAK_HIGHLAND.halfSize},camera,width,height);
    line(ctx,xa,xb,'rgba(236,246,229,.12)');
    const za=projectAdventurePoint({x:-SKYBREAK_HIGHLAND.halfSize,y:skybreakHighlandHeight(-SKYBREAK_HIGHLAND.halfSize,grid),z:grid},camera,width,height);
    const zb=projectAdventurePoint({x:SKYBREAK_HIGHLAND.halfSize,y:skybreakHighlandHeight(SKYBREAK_HIGHLAND.halfSize,grid),z:grid},camera,width,height);
    line(ctx,za,zb,'rgba(236,246,229,.12)');
  }

  for(const band of highland.gustBands){
    const p=projectAdventurePoint(band.position,camera,width,height);
    if(!p)continue;
    const radius=Math.max(18,Math.min(85,p.scale*3.7));
    ctx.strokeStyle=band.active?'rgba(209,243,255,.75)':'rgba(204,226,233,.2)';
    ctx.lineWidth=band.active?3:1.5;
    for(let offset=-1;offset<=1;offset++){
      ctx.beginPath();
      ctx.ellipse(p.x+offset*radius*.55,p.y-radius*.12,radius,radius*.22,-.08,0,Math.PI*2);
      ctx.stroke();
    }
  }

  const beacon=projectAdventurePoint(highland.beacon,camera,width,height);
  const beaconTop=projectAdventurePoint({...highland.beacon,y:highland.beacon.y+7},camera,width,height);
  if(beacon&&beaconTop){
    const size=Math.max(10,Math.min(40,beacon.scale*1.2));
    ctx.strokeStyle=highland.beaconReached?'#d6f7ff':'#d4d9c5';
    ctx.fillStyle=highland.beaconReached?'rgba(156,224,235,.34)':'rgba(109,121,119,.5)';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(beacon.x-size*.7,beacon.y);
    ctx.lineTo(beaconTop.x-size*.25,beaconTop.y);
    ctx.lineTo(beaconTop.x+size*.25,beaconTop.y);
    ctx.lineTo(beacon.x+size*.7,beacon.y);
    ctx.closePath();
    ctx.fill();ctx.stroke();
    if(highland.beaconReached){
      ctx.fillStyle='rgba(196,244,255,.3)';
      ctx.beginPath();ctx.arc(beaconTop.x,beaconTop.y,size*1.4,0,Math.PI*2);ctx.fill();
    }
    if(highland.nearbyBeacon){
      ctx.fillStyle='#f4ffd9';
      ctx.font=`900 ${Math.max(11,Math.min(18,size*.6))}px system-ui`;
      ctx.textAlign='center';
      ctx.fillText('E',beaconTop.x,beaconTop.y-size*.45);
    }
  }

  const drawGate=(position:Vec3,nearby:boolean,label:string,open=true)=>{
    const base=projectAdventurePoint(position,camera,width,height);
    const top=projectAdventurePoint({...position,y:position.y+2.4},camera,width,height);
    if(!base||!top)return;
    const size=Math.max(8,Math.min(30,base.scale*.82));
    ctx.strokeStyle=open?'rgba(201,242,237,.82)':'rgba(107,115,119,.7)';
    ctx.lineWidth=open?3:2;
    ctx.beginPath();ctx.roundRect(top.x-size,top.y,size*2,Math.max(size*2.1,base.y-top.y),size*.8);ctx.stroke();
    if(open){
      ctx.fillStyle='rgba(168,226,220,.13)';
      ctx.fillRect(top.x-size*.75,top.y+size*.2,size*1.5,Math.max(size*1.45,base.y-top.y-size*.2));
    }
    if(nearby){
      ctx.fillStyle='#f0f7d6';
      ctx.font=`900 ${Math.max(10,Math.min(17,size*.62))}px system-ui`;
      ctx.textAlign='center';
      ctx.fillText('E',base.x,top.y-size*.25);
      ctx.font=`700 ${Math.max(9,Math.min(13,size*.45))}px system-ui`;
      ctx.fillText(label,base.x,base.y+size*.7);
    }
  };

  drawGate(highland.entrance,highland.nearbyEntrance,'돌다리로 돌아가기');
  drawGate(highland.windLift,highland.nearbyWindLift,'별바람 전망대',highland.windLiftOpen);

  if(highland.calmActive){
    ctx.fillStyle='rgba(211,246,242,.08)';
    ctx.fillRect(0,0,width,height);
  }

  ctx.restore();
}

function drawWindwalkRoute(
  ctx:CanvasRenderingContext2D,
  route:WindwalkRouteVisual,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  ctx.save();
  for(const current of route.currents){
    const base=projectAdventurePoint(current.position,camera,width,height);
    const top=projectAdventurePoint({...current.position,y:current.position.y+WINDWALK_ROUTE.currentHeight},camera,width,height);
    if(!base||!top)continue;
    const radius=Math.max(10,Math.min(38,base.scale*1.15));
    ctx.strokeStyle=current.active?'rgba(205,250,255,.9)':'rgba(184,230,235,.36)';
    ctx.lineWidth=current.active?3:2;
    for(let i=0;i<4;i++){
      const t=i/3;
      const y=base.y+(top.y-base.y)*t;
      ctx.beginPath();
      ctx.ellipse(base.x,y,radius*(1-t*.25),radius*.28,0,0,Math.PI*2);
      ctx.stroke();
    }
  }

  for(const trace of route.traces){
    if(trace.collected)continue;
    const p=projectAdventurePoint(trace.position,camera,width,height);
    if(!p)continue;
    const radius=Math.max(8,Math.min(28,p.scale*.95));
    ctx.strokeStyle='rgba(228,251,255,.88)';
    ctx.fillStyle='rgba(184,236,242,.14)';
    ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(p.x,p.y,radius*.42,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}

function drawRuinPuzzle(
  ctx:CanvasRenderingContext2D,
  state:RuinPuzzleState,
  layout:RuinPuzzleLayout,
  camera:AdventureCameraState,
  width:number,
  height:number,
){
  const drawPlate=(position:Vec3,active:boolean)=>{
    const p=projectAdventurePoint(position,camera,width,height);
    if(!p)return;
    const radius=Math.max(8,Math.min(34,p.scale*1.55));
    ctx.save();
    ctx.fillStyle=active?'rgba(143,225,185,.3)':'rgba(105,111,105,.35)';
    ctx.strokeStyle=active?'rgba(176,255,211,.9)':'rgba(203,194,153,.45)';
    ctx.lineWidth=active?3:2;
    ctx.beginPath();
    ctx.ellipse(p.x,p.y,radius,radius*.35,0,0,Math.PI*2);
    ctx.fill();ctx.stroke();
    if(active){
      ctx.fillStyle='rgba(188,255,221,.32)';
      ctx.beginPath();ctx.arc(p.x,p.y-radius*.2,radius*.7,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  };

  drawPlate(layout.westPlate,state.westPlateActive);
  drawPlate(layout.eastPlate,state.eastPlateActive);

  const stoneBase=projectAdventurePoint(state.stonePosition,camera,width,height);
  const stoneTop=projectAdventurePoint({...state.stonePosition,y:state.stonePosition.y+1.2},camera,width,height);
  if(stoneBase&&stoneTop){
    const size=Math.max(7,Math.min(28,stoneBase.scale*.9));
    ctx.save();
    if(state.windPulseFlash>0){
      ctx.strokeStyle='rgba(162,232,244,.8)';
      ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(stoneBase.x,stoneBase.y,size*1.9,0,Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle='#8d8a79';ctx.strokeStyle='#d9d0a5';ctx.lineWidth=2;
    ctx.beginPath();
    ctx.roundRect(stoneTop.x-size,stoneTop.y,size*2,Math.max(size*1.8,stoneBase.y-stoneTop.y),4);
    ctx.fill();ctx.stroke();
    ctx.restore();
  }

  const brazier=projectAdventurePoint(layout.brazier,camera,width,height);
  if(brazier){
    const size=Math.max(6,Math.min(24,brazier.scale*.85));
    ctx.save();
    ctx.fillStyle='#69584a';
    ctx.beginPath();ctx.roundRect(brazier.x-size*.65,brazier.y-size,size*1.3,size,4);ctx.fill();
    if(state.brazierLit||state.emberFlash>0){
      const glow=state.emberFlash>0?1.5:1;
      ctx.fillStyle='rgba(255,141,66,.26)';
      ctx.beginPath();ctx.arc(brazier.x,brazier.y-size*1.1,size*1.7*glow,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffad59';
      ctx.beginPath();
      ctx.moveTo(brazier.x,brazier.y-size*2.2);
      ctx.lineTo(brazier.x-size*.6,brazier.y-size*.65);
      ctx.lineTo(brazier.x+size*.6,brazier.y-size*.65);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  const reward=projectAdventurePoint(layout.reward,camera,width,height);
  if(reward){
    const size=Math.max(7,Math.min(28,reward.scale*.9));
    ctx.save();
    ctx.globalAlpha=state.rewardClaimed ? .38 : 1;
    ctx.fillStyle=state.solved?'rgba(174,220,238,.42)':'rgba(65,69,72,.72)';
    ctx.strokeStyle=state.solved?'rgba(208,245,255,.9)':'rgba(144,139,118,.55)';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(reward.x,reward.y-size*.8,size,state.solved?0:Math.PI*.08,Math.PI*2);ctx.fill();ctx.stroke();
    if(state.solved&&!state.rewardClaimed){
      ctx.fillStyle='rgba(209,246,255,.28)';
      ctx.beginPath();ctx.arc(reward.x,reward.y-size*.8,size*1.8,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
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
  ruinPuzzle?:RuinPuzzleState,
  ruinLayout?:RuinPuzzleLayout,
  echoSenseUnlocked=false,
  hazards:readonly FieldHazardState[]=[],
  lockedTargetId:string|null=null,
  worldEvent:WorldEventVisual|null=null,
  worldConsequence:WorldConsequenceVisual|null=null,
  nearbyWorldConsequence=false,
  roamingPresence:RoamingWorldPresenceVisual|null=null,
  wildlife:WildlifeVisual|null=null,
  wildlifeTrail:WildlifeTrailVisual|null=null,
  hollowCave:HollowCaveVisual|null=null,
  skybreakHighland:SkybreakHighlandVisual|null=null,
  worldOverlay:AdventureWorldOverlay={},
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

  if(hollowCave?.active){
    drawHollowCave(ctx,hollowCave,camera,width,height);
    drawPlayer(ctx,player,camera,width,height);
    return;
  }

  if(skybreakHighland?.active){
    drawSkybreakHighland(ctx,skybreakHighland,camera,width,height);
    const enemyDepth=[...enemies].sort((a,b)=>{
      const pa=projectAdventurePoint(a.position,camera,width,height);
      const pb=projectAdventurePoint(b.position,camera,width,height);
      return (pb?.depth??0)-(pa?.depth??0);
    });
    for(const enemy of enemyDepth)drawEnemy(ctx,enemy,camera,width,height,enemy.id===lockedTargetId);
    if(combat)drawCombatEffects(ctx,player,combat,camera,width,height);
    drawPlayer(ctx,player,camera,width,height);
    return;
  }

  const sorted=[...field.discoveries].sort((a,b)=>{
    const pa=projectAdventurePoint({...a.position,y:startingFieldHeight(a.position.x,a.position.z)},camera,width,height);
    const pb=projectAdventurePoint({...b.position,y:startingFieldHeight(b.position.x,b.position.z)},camera,width,height);
    return (pb?.depth??0)-(pa?.depth??0);
  });
  for(const discovery of sorted){
    const nearby=nearbyId===discovery.id;
    const visitedDiscovery=visited.has(discovery.id);
    if(discovery.kind==='secret'&&!echoSenseUnlocked&&!nearby&&!visitedDiscovery)continue;
    drawDiscovery(ctx,discovery,camera,width,height,visitedDiscovery,nearby);
  }
  if(ruinPuzzle&&ruinLayout)drawRuinPuzzle(ctx,ruinPuzzle,ruinLayout,camera,width,height);
  drawFieldHazards(ctx,hazards,camera,width,height);
  if(worldEvent)drawWorldEvent(ctx,worldEvent,camera,width,height);
  if(worldConsequence)drawWorldConsequence(ctx,worldConsequence,camera,width,height,nearbyWorldConsequence);
  if(roamingPresence)drawRoamingWorldPresence(ctx,roamingPresence,camera,width,height);
  if(wildlifeTrail)drawWildlifeTrail(ctx,wildlifeTrail,camera,width,height);
  if(worldOverlay.windwalkRoute)drawWindwalkRoute(ctx,worldOverlay.windwalkRoute,camera,width,height);
  if(wildlife)drawWildlife(ctx,wildlife,camera,width,height);
  const enemyDepth=[...enemies].sort((a,b)=>{
    const pa=projectAdventurePoint(a.position,camera,width,height);
    const pb=projectAdventurePoint(b.position,camera,width,height);
    return (pb?.depth??0)-(pa?.depth??0);
  });
  for(const enemy of enemyDepth)drawEnemy(ctx,enemy,camera,width,height,enemy.id===lockedTargetId);
  if(combat)drawCombatEffects(ctx,player,combat,camera,width,height);
  drawPlayer(ctx,player,camera,width,height);
}
