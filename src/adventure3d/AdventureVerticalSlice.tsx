import {useCallback,useEffect,useRef,useState,type PointerEvent} from 'react';
import type {GameState} from '../game';
import MobileJoystick from '../exploration/MobileJoystick';
import {DEFAULT_ADVENTURE_CAMERA,followAdventureCamera,rotateAdventureCamera,zoomAdventureCamera} from './camera-controller';
import {
  DEFAULT_PLAYER_COMBAT,
  PLAYER_ATTACK_DAMAGE,
  applyDodgeMotion,
  applyPlayerDamage,
  playerAttackConnects,
  playerAttackWindowOpen,
  stepPlayerCombat,
  tryStartPlayerAttack,
  tryStartPlayerDodge,
  type PlayerCombatState,
} from './combat-system';
import {alertNearbyEnemies,applyEnemyDamage,stepEnemyAi,type AdventureEnemyState} from './enemy-ai';
import {cameraRelativeMove,DEFAULT_PLAYER_STATE,stepPlayerMotion} from './player-controller';
import {createStartingCampEnemies} from './starting-encounter';
import {nearestStartingFieldDiscovery,STARTING_FIELD,startingFieldHeight} from './starting-field';
import {renderAdventureField} from './software-renderer';
import type {AdventureCameraState,PlayerMotionState} from './types';
import '../exploration/exploration.css';
import './adventure-vertical-slice.css';

type Props={state:GameState;onExit:()=>void};

const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
const engagedModes=new Set(['suspicious','chase','windup','recover','stagger']);

export default function AdventureVerticalSlice({state,onExit}:Props){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const playerRef=useRef<PlayerMotionState>({...DEFAULT_PLAYER_STATE,position:{...STARTING_FIELD.spawn}});
  const combatRef=useRef<PlayerCombatState>({...DEFAULT_PLAYER_COMBAT});
  const enemiesRef=useRef<AdventureEnemyState[]>(createStartingCampEnemies());
  const cameraRef=useRef<AdventureCameraState>({...DEFAULT_ADVENTURE_CAMERA,target:{x:STARTING_FIELD.spawn.x,y:2,z:STARTING_FIELD.spawn.z}});
  const pressedRef=useRef(new Set<string>());
  const stickRef=useRef({x:0,y:0});
  const jumpRef=useRef(false);
  const attackRef=useRef(false);
  const dodgeRef=useRef(false);
  const sprintTouchRef=useRef(false);
  const nearbyRef=useRef<ReturnType<typeof nearestStartingFieldDiscovery>>(null);
  const dragRef=useRef<{pointerId:number;x:number;y:number}|null>(null);
  const visitedRef=useRef(new Set<string>());
  const campClearedRef=useRef(false);
  const [stamina,setStamina]=useState(100);
  const [hp,setHp]=useState(DEFAULT_PLAYER_COMBAT.hp);
  const [nearby,setNearby]=useState<ReturnType<typeof nearestStartingFieldDiscovery>>(null);
  const [visitedCount,setVisitedCount]=useState(0);
  const [notice,setNotice]=useState('멀리 보이는 세 곳 중 마음이 가는 방향으로 움직여 보세요.');
  const [sprinting,setSprinting]=useState(false);
  const [combatEngaged,setCombatEngaged]=useState(false);
  const [livingEnemies,setLivingEnemies]=useState(enemiesRef.current.length);

  const discover=useCallback(()=>{
    const target=nearbyRef.current;
    if(!target||visitedRef.current.has(target.id))return;
    visitedRef.current=new Set(visitedRef.current).add(target.id);
    setVisitedCount(visitedRef.current.size);
    setNotice(target.kind==='vista'
      ?'높은 곳에서 시야가 열렸습니다. 아래를 둘러보고 다음 목적지를 직접 정하세요.'
      :`${target.label} 발견 · ${target.hint}`);
  },[]);

  const recoverAtEntrance=useCallback(()=>{
    playerRef.current={...DEFAULT_PLAYER_STATE,position:{...STARTING_FIELD.spawn}};
    combatRef.current={...DEFAULT_PLAYER_COMBAT};
    enemiesRef.current=createStartingCampEnemies();
    cameraRef.current={...DEFAULT_ADVENTURE_CAMERA,target:{x:STARTING_FIELD.spawn.x,y:2,z:STARTING_FIELD.spawn.z}};
    attackRef.current=false;
    dodgeRef.current=false;
    jumpRef.current=false;
    campClearedRef.current=false;
    setHp(DEFAULT_PLAYER_COMBAT.hp);
    setStamina(DEFAULT_PLAYER_STATE.stamina);
    setLivingEnemies(enemiesRef.current.length);
    setCombatEngaged(false);
    setNotice('들판 입구에서 다시 일어났습니다. 정면 전투 대신 다른 길로 우회해도 됩니다.');
  },[]);

  useEffect(()=>{
    const down=(event:KeyboardEvent)=>{
      if(movementKeys.has(event.code)){event.preventDefault();pressedRef.current.add(event.code);return;}
      if(event.code==='ShiftLeft'||event.code==='ShiftRight'){sprintTouchRef.current=true;return;}
      if(event.code==='Space'&&!event.repeat){event.preventDefault();jumpRef.current=true;return;}
      if(event.code==='KeyJ'&&!event.repeat){event.preventDefault();attackRef.current=true;return;}
      if(event.code==='KeyK'&&!event.repeat){event.preventDefault();dodgeRef.current=true;return;}
      if(event.code==='KeyR'&&!event.repeat&&combatRef.current.hp<=0){event.preventDefault();recoverAtEntrance();return;}
      if((event.code==='KeyE'||event.code==='KeyF')&&!event.repeat){event.preventDefault();discover();return;}
      if(event.code==='Escape'){event.preventDefault();onExit();}
    };
    const up=(event:KeyboardEvent)=>{
      pressedRef.current.delete(event.code);
      if(event.code==='ShiftLeft'||event.code==='ShiftRight')sprintTouchRef.current=false;
    };
    const clear=()=>{pressedRef.current.clear();stickRef.current={x:0,y:0};sprintTouchRef.current=false;attackRef.current=false;dodgeRef.current=false;};
    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    window.addEventListener('blur',clear);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
  },[discover,onExit,recoverAtEntrance]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const context=canvas.getContext('2d');
    if(!context)return;
    let frame=0;
    let last=performance.now();
    let lastHud=0;

    const resize=()=>{
      const rect=canvas.getBoundingClientRect();
      const ratio=Math.min(2,window.devicePixelRatio||1);
      const width=Math.max(1,Math.round(rect.width*ratio));
      const height=Math.max(1,Math.round(rect.height*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      context.setTransform(ratio,0,0,ratio,0,0);
    };

    const tick=(time:number)=>{
      resize();
      const dt=Math.min(.05,Math.max(0,(time-last)/1000));
      last=time;

      const keys=pressedRef.current;
      const keyboardX=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
      const keyboardForward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
      const stick=stickRef.current;
      const strafe=keyboardX+stick.x;
      const forward=keyboardForward-stick.y;
      const move=cameraRelativeMove(strafe,forward,cameraRef.current.yaw);

      let combat=stepPlayerCombat(combatRef.current,dt);
      if(attackRef.current){
        combat=tryStartPlayerAttack(combat);
        attackRef.current=false;
      }

      if(dodgeRef.current){
        const dodge=tryStartPlayerDodge(combat,playerRef.current.stamina,move,playerRef.current.facingYaw);
        combat=dodge.state;
        if(dodge.started)playerRef.current={...playerRef.current,stamina:dodge.stamina};
        dodgeRef.current=false;
      }

      const incapacitated=combat.hp<=0||combat.hitstun>0;
      const wantsSprint=!incapacitated&&combat.attackClock<0&&combat.dodgeClock<0&&sprintTouchRef.current;
      const movementInput=incapacitated||combat.dodgeClock>=0?{x:0,z:0}:move;
      playerRef.current=stepPlayerMotion(playerRef.current,{
        moveX:movementInput.x,
        moveZ:movementInput.z,
        sprint:wantsSprint,
        jump:!incapacitated&&combat.dodgeClock<0&&jumpRef.current,
      },dt,startingFieldHeight,STARTING_FIELD.halfSize);
      jumpRef.current=false;
      playerRef.current=applyDodgeMotion(playerRef.current,combat,dt,startingFieldHeight,STARTING_FIELD.halfSize);

      if(playerAttackWindowOpen(combat)){
        enemiesRef.current=enemiesRef.current.map(enemy=>{
          if(!playerAttackConnects(playerRef.current.position,playerRef.current.facingYaw,enemy.position,1))return enemy;
          const result=applyEnemyDamage(enemy,PLAYER_ATTACK_DAMAGE,combat.attackSerial);
          if(result.damaged)setNotice(result.defeated?`${enemy.label} 격파`:`${enemy.label}에게 공격 적중`);
          return result.enemy;
        });
      }

      if(combat.hp>0){
        const stepped=enemiesRef.current.map(enemy=>stepEnemyAi(enemy,playerRef.current.position,dt,startingFieldHeight));
        enemiesRef.current=alertNearbyEnemies(stepped.map(result=>result.enemy));
        for(const result of stepped){
          if(!result.attack)continue;
          const hit=applyPlayerDamage(combat,result.attack.damage);
          combat=hit.state;
          if(hit.damaged)setNotice(combat.hp>0?'공격을 맞았습니다. 예고 동작을 보고 회피 타이밍을 잡으세요.':'쓰러졌습니다. R 또는 다시 일어나기로 들판 입구에서 재개할 수 있습니다.');
        }
      }

      combatRef.current=combat;
      cameraRef.current=followAdventureCamera(cameraRef.current,{
        x:playerRef.current.position.x,
        y:playerRef.current.position.y+1.8,
        z:playerRef.current.position.z,
      },dt);

      const nextNearby=nearestStartingFieldDiscovery(playerRef.current.position.x,playerRef.current.position.z,visitedRef.current);
      nearbyRef.current=nextNearby;
      renderAdventureField(
        context,
        canvas.clientWidth,
        canvas.clientHeight,
        STARTING_FIELD,
        playerRef.current,
        cameraRef.current,
        visitedRef.current,
        nextNearby?.id??null,
        enemiesRef.current,
        combat,
      );

      const living=enemiesRef.current.filter(enemy=>enemy.hp>0).length;
      if(living===0&&!campClearedRef.current){
        campClearedRef.current=true;
        setNotice('재빛 야영지의 위협이 사라졌습니다. 주변 흔적과 남겨진 물건을 직접 살펴보세요.');
      }

      if(time-lastHud>80){
        lastHud=time;
        setStamina(Math.round(playerRef.current.stamina));
        setHp(combat.hp);
        setSprinting(wantsSprint&&playerRef.current.stamina>.5&&Math.hypot(playerRef.current.velocity.x,playerRef.current.velocity.z)>5.8);
        setNearby(current=>current?.id===nextNearby?.id?current:nextNearby);
        setLivingEnemies(living);
        setCombatEngaged(enemiesRef.current.some(enemy=>enemy.hp>0&&engagedModes.has(enemy.mode)));
      }

      frame=requestAnimationFrame(tick);
    };

    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[]);

  const startLook=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    dragRef.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveLook=(event:PointerEvent<HTMLCanvasElement>)=>{
    const drag=dragRef.current;
    if(!drag||drag.pointerId!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    drag.x=event.clientX;drag.y=event.clientY;
    cameraRef.current=rotateAdventureCamera(cameraRef.current,-dx*.006,-dy*.0045);
  };
  const endLook=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(dragRef.current?.pointerId!==event.pointerId)return;
    dragRef.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const defeated=hp<=0;

  return <section className="adventure3d" data-combat={combatEngaged||undefined} aria-label="새벽들판 자유 탐험 Vertical Slice">
    <canvas
      ref={canvasRef}
      className="adventure3d__canvas"
      tabIndex={0}
      onPointerDown={startLook}
      onPointerMove={moveLook}
      onPointerUp={endLook}
      onPointerCancel={endLook}
      onWheel={event=>{event.preventDefault();cameraRef.current=zoomAdventureCamera(cameraRef.current,event.deltaY*.01);}}
      aria-label="3D 자유 탐험 필드. WASD 이동, 드래그 카메라, Shift 전력질주, Space 점프, J 공격, K 회피, E 조사"
    />

    <header className="adventure3d__hud">
      <div><small>{combatEngaged?'COMBAT':'OPEN ADVENTURE'} · {state.year}년차</small><strong>{STARTING_FIELD.label}</strong></div>
      {(combatEngaged||hp<DEFAULT_PLAYER_COMBAT.maxHp)&&<div className="adventure3d__health" aria-label={`체력 ${hp}`}><span style={{width:`${hp}%`}}/></div>}
      <div className="adventure3d__stamina" aria-label={`스태미나 ${stamina}`}><span style={{width:`${stamina}%`}}/></div>
      {combatEngaged&&<em>야영지 위협 {livingEnemies}</em>}
    </header>

    <div className="adventure3d__notice" role="status" aria-live="polite">
      <small>{visitedCount}/{STARTING_FIELD.discoveries.length} 발견</small>
      <span>{nearby&&!combatEngaged?nearby.hint:notice}</span>
    </div>

    <button type="button" className="adventure3d__exit" onClick={onExit} aria-label="새벽들판 나가기">×</button>
    <MobileJoystick disabled={defeated} onDirection={direction=>{stickRef.current=direction;}}/>
    <div className="adventure3d__actions">
      <button
        type="button"
        disabled={defeated}
        data-active={sprinting||undefined}
        onPointerDown={()=>{sprintTouchRef.current=true;}}
        onPointerUp={()=>{sprintTouchRef.current=false;}}
        onPointerCancel={()=>{sprintTouchRef.current=false;}}
      >달리기</button>
      <button type="button" disabled={defeated} onClick={()=>{jumpRef.current=true;}}>점프</button>
      <button type="button" className="is-combat" disabled={defeated} onClick={()=>{attackRef.current=true;}}>공격</button>
      <button type="button" className="is-combat" disabled={defeated} onClick={()=>{dodgeRef.current=true;}}>회피</button>
      <button type="button" className="is-primary" disabled={!nearby||combatEngaged||defeated} onClick={discover}>{nearby?'살펴보기':'주변 관찰'}</button>
      {defeated&&<button type="button" className="is-recover" onClick={recoverAtEntrance}>다시 일어나기</button>}
    </div>
    <div className="adventure3d__controls" aria-hidden="true">WASD 이동 · 드래그 시점 · Shift 달리기 · Space 점프 · J 공격 · K 회피 · E 발견</div>
  </section>;
}
