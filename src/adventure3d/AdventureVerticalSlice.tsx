import {useCallback,useEffect,useRef,useState} from 'react';
import type {GameState} from '../game';
import MobileJoystick from '../exploration/MobileJoystick';
import {DEFAULT_ADVENTURE_CAMERA,followAdventureCamera,rotateAdventureCamera,zoomAdventureCamera} from './camera-controller';
import {cameraRelativeMove,DEFAULT_PLAYER_STATE,stepPlayerMotion} from './player-controller';
import {nearestStartingFieldDiscovery,STARTING_FIELD,startingFieldHeight,visibleStartingLandmarks} from './starting-field';
import {renderAdventureField} from './software-renderer';
import type {AdventureCameraState,PlayerMotionState} from './types';
import '../exploration/exploration.css';
import './adventure-vertical-slice.css';

type Props={state:GameState;onExit:()=>void};

const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);

export default function AdventureVerticalSlice({state,onExit}:Props){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const playerRef=useRef<PlayerMotionState>({...DEFAULT_PLAYER_STATE,position:{...STARTING_FIELD.spawn}});
  const cameraRef=useRef<AdventureCameraState>({...DEFAULT_ADVENTURE_CAMERA,target:{x:STARTING_FIELD.spawn.x,y:2,z:STARTING_FIELD.spawn.z}});
  const pressedRef=useRef(new Set<string>());
  const stickRef=useRef({x:0,y:0});
  const jumpRef=useRef(false);
  const sprintTouchRef=useRef(false);
  const nearbyRef=useRef<ReturnType<typeof nearestStartingFieldDiscovery>>(null);
  const dragRef=useRef<{pointerId:number;x:number;y:number}|null>(null);
  const visitedRef=useRef(new Set<string>());
  const [stamina,setStamina]=useState(100);
  const [nearby,setNearby]=useState<ReturnType<typeof nearestStartingFieldDiscovery>>(null);
  const [visitedCount,setVisitedCount]=useState(0);
  const [notice,setNotice]=useState('멀리 보이는 세 곳 중 마음이 가는 방향으로 움직여 보세요.');
  const [sprinting,setSprinting]=useState(false);

  const discover=useCallback(()=>{
    const target=nearbyRef.current;
    if(!target||visitedRef.current.has(target.id))return;
    visitedRef.current=new Set(visitedRef.current).add(target.id);
    setVisitedCount(visitedRef.current.size);
    setNotice(target.kind==='vista'
      ?'높은 곳에서 시야가 열렸습니다. 아래를 둘러보고 다음 목적지를 직접 정하세요.'
      :`${target.label} 발견 · ${target.hint}`);
  },[]);

  useEffect(()=>{
    const down=(event:KeyboardEvent)=>{
      if(movementKeys.has(event.code)){event.preventDefault();pressedRef.current.add(event.code);return;}
      if(event.code==='ShiftLeft'||event.code==='ShiftRight'){sprintTouchRef.current=true;return;}
      if(event.code==='Space'&&!event.repeat){event.preventDefault();jumpRef.current=true;return;}
      if((event.code==='KeyE'||event.code==='KeyF')&&!event.repeat){event.preventDefault();discover();return;}
      if(event.code==='Escape'){event.preventDefault();onExit();}
    };
    const up=(event:KeyboardEvent)=>{
      pressedRef.current.delete(event.code);
      if(event.code==='ShiftLeft'||event.code==='ShiftRight')sprintTouchRef.current=false;
    };
    const clear=()=>{pressedRef.current.clear();stickRef.current={x:0,y:0};sprintTouchRef.current=false;};
    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    window.addEventListener('blur',clear);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
  },[discover,onExit]);

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
      const wantsSprint=sprintTouchRef.current;
      playerRef.current=stepPlayerMotion(playerRef.current,{
        moveX:move.x,moveZ:move.z,sprint:wantsSprint,jump:jumpRef.current,
      },dt,startingFieldHeight,STARTING_FIELD.halfSize);
      jumpRef.current=false;
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
      );
      if(time-lastHud>90){
        lastHud=time;
        setStamina(Math.round(playerRef.current.stamina));
        setSprinting(wantsSprint&&playerRef.current.stamina>.5&&Math.hypot(playerRef.current.velocity.x,playerRef.current.velocity.z)>5.8);
        setNearby(current=>current?.id===nextNearby?.id?current:nextNearby);
      }
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[]);

  const startLook=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    dragRef.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveLook=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    const drag=dragRef.current;
    if(!drag||drag.pointerId!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    drag.x=event.clientX;drag.y=event.clientY;
    cameraRef.current=rotateAdventureCamera(cameraRef.current,-dx*.006,-dy*.0045);
  };
  const endLook=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    if(dragRef.current?.pointerId!==event.pointerId)return;
    dragRef.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const landmarks=visibleStartingLandmarks();

  return <section className="adventure3d" aria-label="새벽들판 자유 탐험 Vertical Slice">
    <canvas
      ref={canvasRef}
      className="adventure3d__canvas"
      tabIndex={0}
      onPointerDown={startLook}
      onPointerMove={moveLook}
      onPointerUp={endLook}
      onPointerCancel={endLook}
      onWheel={event=>{event.preventDefault();cameraRef.current=zoomAdventureCamera(cameraRef.current,event.deltaY*.01);}}
      aria-label="3D 자유 탐험 필드. WASD 이동, 드래그 카메라, Shift 전력질주, Space 점프, E 조사"
    />

    <header className="adventure3d__hud">
      <div><small>OPEN ADVENTURE · {state.year}년차</small><strong>{STARTING_FIELD.label}</strong></div>
      <div className="adventure3d__stamina" aria-label={`스태미나 ${stamina}`}><span style={{width:`${stamina}%`}}/></div>
    </header>

    <aside className="adventure3d__glimpse" aria-label="처음 보이는 랜드마크">
      {landmarks.map(item=><span key={item.id}>{item.label}</span>)}
    </aside>

    <div className="adventure3d__notice" role="status" aria-live="polite">
      <small>{visitedCount}/{STARTING_FIELD.discoveries.length} 발견</small>
      <span>{nearby?nearby.hint:notice}</span>
    </div>

    <button type="button" className="adventure3d__exit" onClick={onExit} aria-label="새벽들판 나가기">×</button>
    <MobileJoystick onDirection={direction=>{stickRef.current=direction;}}/>
    <div className="adventure3d__actions">
      <button
        type="button"
        data-active={sprinting||undefined}
        onPointerDown={()=>{sprintTouchRef.current=true;}}
        onPointerUp={()=>{sprintTouchRef.current=false;}}
        onPointerCancel={()=>{sprintTouchRef.current=false;}}
      >달리기</button>
      <button type="button" onClick={()=>{jumpRef.current=true;}}>점프</button>
      <button type="button" className="is-primary" disabled={!nearby} onClick={discover}>{nearby?'살펴보기':'주변 관찰'}</button>
    </div>
    <div className="adventure3d__controls" aria-hidden="true">WASD 이동 · 드래그 시점 · Shift 전력질주 · Space 점프 · E 발견</div>
  </section>;
}
