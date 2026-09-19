import {Fragment,type CSSProperties,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import MobileJoystick from './MobileJoystick';
import StoryFrameOverlay from './StoryFrameOverlay';
import {explorationKeyboardIntent,isMovementKey,keyboardDirection} from './exploration-keyboard';
import {cameraForPlayer,interactionIsUnlocked,moveWithCollisions,nearestInteractable,normalizeDirection} from './exploration-runtime';
import type {ExplorationStoryFrame,ExplorationWorldDefinition,Vec2,WorldBounds} from './exploration-types';
import './exploration.css';

type Props={
  world:ExplorationWorldDefinition;
  storyFrames:Readonly<Record<string,ExplorationStoryFrame>>;
  playerArtSrc:string;
  onProgress:()=>void;
  onExit:()=>void;
  onPortal?:(destinationId:string)=>void;
  completedInteractionIds?:readonly string[];
  onInteractionComplete?:(interactionId:string)=>void;
  showExitButton?:boolean;
};

export default function MobileExplorationScene({
  world,storyFrames,playerArtSrc,onProgress,onExit,onPortal,
  completedInteractionIds=[],onInteractionComplete,showExitButton=true,
}:Props){
  const viewportRef=useRef<HTMLElement|null>(null);
  const actionButtonRef=useRef<HTMLButtonElement|null>(null);
  const joystickRef=useRef<Vec2>({x:0,y:0});
  const pressedKeysRef=useRef(new Set<string>());
  const blockedMovementKeysRef=useRef(new Set<string>());
  const activeFrameRef=useRef<ExplorationStoryFrame|null>(null);
  const committedRef=useRef(false);
  const [viewport,setViewport]=useState<WorldBounds>({width:390,height:844});
  const [position,setPosition]=useState<Vec2>(world.start);
  const [moving,setMoving]=useState(false);
  const [facing,setFacing]=useState<'left'|'right'>('right');
  const [activeFrame,setActiveFrame]=useState<ExplorationStoryFrame|null>(null);
  const [activeInteractionId,setActiveInteractionId]=useState<string|null>(null);
  const [completed,setCompleted]=useState<Set<string>>(()=>new Set(completedInteractionIds));

  useEffect(()=>{activeFrameRef.current=activeFrame;},[activeFrame]);
  useEffect(()=>{
    if(!activeFrame) return;
    for(const code of pressedKeysRef.current) blockedMovementKeysRef.current.add(code);
    pressedKeysRef.current.clear();
    joystickRef.current={x:0,y:0};
    setMoving(false);
  },[activeFrame]);
  useEffect(()=>{
    pressedKeysRef.current.clear();
    blockedMovementKeysRef.current.clear();
    joystickRef.current={x:0,y:0};
    setPosition(world.start);
    setMoving(false);
    setCompleted(new Set(completedInteractionIds));
    setActiveFrame(null);
    setActiveInteractionId(null);
    committedRef.current=false;
  },[world.id]);

  useEffect(()=>{
    const node=viewportRef.current;
    if(!node) return;
    const measure=()=>setViewport({width:Math.max(1,node.clientWidth||window.innerWidth),height:Math.max(1,node.clientHeight||window.innerHeight)});
    measure();
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);
    observer?.observe(node);
    window.addEventListener('resize',measure,{passive:true});
    return ()=>{observer?.disconnect();window.removeEventListener('resize',measure);};
  },[]);

  const unlockedInteractables=useMemo(
    ()=>world.interactables.filter(interaction=>interactionIsUnlocked(interaction,completed)),
    [completed,world.interactables],
  );
  const availableInteractables=useMemo(
    ()=>unlockedInteractables.map(interaction=>{
      const shouldDisable=completed.has(interaction.id)&&!interaction.repeatable;
      return shouldDisable?{...interaction,enabled:false}:interaction;
    }),
    [completed,unlockedInteractables],
  );
  const nearby=useMemo(()=>nearestInteractable(position,availableInteractables),[availableInteractables,position]);
  const camera=useMemo(()=>cameraForPlayer(position,world,viewport),[position,viewport,world]);

  const setJoystickDirection=useCallback((direction:Vec2)=>{joystickRef.current=direction;},[]);

  useEffect(()=>{
    let frameId=0;
    let lastTime=performance.now();
    const tick=(time:number)=>{
      const dt=Math.min(.05,Math.max(0,(time-lastTime)/1000));
      lastTime=time;
      if(!activeFrameRef.current){
        const keyboard=keyboardDirection(pressedKeysRef.current);
        const stick=joystickRef.current;
        const direction=normalizeDirection({x:keyboard.x+stick.x,y:keyboard.y+stick.y});
        const isMoving=Math.abs(direction.x)>.001||Math.abs(direction.y)>.001;
        setMoving(isMoving);
        if(isMoving){
          if(Math.abs(direction.x)>.06) setFacing(direction.x<0?'left':'right');
          setPosition(previous=>moveWithCollisions(previous,{x:direction.x*world.playerSpeed*dt,y:direction.y*world.playerSpeed*dt},world));
        }
      }else setMoving(false);
      frameId=requestAnimationFrame(tick);
    };
    frameId=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frameId);
  },[world]);

  const openInteraction=useCallback(()=>{
    if(activeFrameRef.current||!nearby) return;
    if(nearby.kind==='exit'){onExit();return;}
    if(nearby.kind==='portal'&&nearby.destinationId){onPortal?.(nearby.destinationId);return;}
    if(nearby.kind==='story'&&nearby.storyFrameId){
      const frame=storyFrames[nearby.storyFrameId];
      if(frame){
        activeFrameRef.current=frame;
        setActiveInteractionId(nearby.id);
        setActiveFrame(frame);
      }
    }
  },[nearby,onExit,onPortal,storyFrames]);

  const closeStory=useCallback((focusAction=true)=>{
    activeFrameRef.current=null;
    setActiveFrame(null);
    setActiveInteractionId(null);
    requestAnimationFrame(()=>{
      if(focusAction&&!actionButtonRef.current?.disabled) actionButtonRef.current?.focus();
      else viewportRef.current?.focus();
    });
  },[]);

  const finishStory=useCallback((frame:ExplorationStoryFrame)=>{
    if(activeFrameRef.current!==frame) return;
    activeFrameRef.current=null;
    if(activeInteractionId){
      setCompleted(current=>new Set(current).add(activeInteractionId));
      onInteractionComplete?.(activeInteractionId);
    }
    if(frame.progression&&!committedRef.current){
      committedRef.current=true;
      onProgress();
    }
    closeStory(false);
  },[activeInteractionId,closeStory,onInteractionComplete,onProgress]);

  useEffect(()=>{
    const keyDown=(event:KeyboardEvent)=>{
      const intent=explorationKeyboardIntent(event.code,event.repeat,event.target);
      if(intent==='movement'){
        event.preventDefault();
        if(activeFrameRef.current){
          blockedMovementKeysRef.current.add(event.code);
          return;
        }
        if(blockedMovementKeysRef.current.has(event.code)) return;
        pressedKeysRef.current.add(event.code);
        return;
      }
      if(intent==='action'){
        event.preventDefault();
        const frame=activeFrameRef.current;
        if(frame) finishStory(frame); else openInteraction();
        return;
      }
      if(intent==='exit'){
        event.preventDefault();
        if(activeFrameRef.current) closeStory(); else onExit();
      }
    };
    const keyUp=(event:KeyboardEvent)=>{
      if(!isMovementKey(event.code)) return;
      pressedKeysRef.current.delete(event.code);
      blockedMovementKeysRef.current.delete(event.code);
    };
    const clear=()=>{pressedKeysRef.current.clear();blockedMovementKeysRef.current.clear();joystickRef.current={x:0,y:0};setMoving(false);};
    const clearWhenHidden=()=>{if(document.hidden) clear();};
    window.addEventListener('keydown',keyDown);
    window.addEventListener('keyup',keyUp);
    window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',clearWhenHidden);
    return ()=>{
      window.removeEventListener('keydown',keyDown);
      window.removeEventListener('keyup',keyUp);
      window.removeEventListener('blur',clear);
      document.removeEventListener('visibilitychange',clearWhenHidden);
    };
  },[closeStory,finishStory,onExit,openInteraction]);

  const worldStyle={
    width:`${world.width}px`,height:`${world.height}px`,
    transform:`translate3d(${-camera.x}px,${-camera.y}px,0)`,
  } as CSSProperties;
  const playerStyle={left:`${position.x}px`,top:`${position.y}px`} as CSSProperties;
  const idlePrompt=committedRef.current
    ?'핵심 흔적을 확인했어요. 주변을 더 탐험하거나 돌아갈 수 있어요.'
    :completed.size>0
      ?'새로 나타난 흔적이 있는지 주변을 살펴보세요.'
      :'직접 움직여 주변의 단서를 찾아보세요.';
  const actionText=nearby?.id.startsWith('district-quest-npc:')?'대화':nearby?.kind==='portal'?'이동':nearby?.kind==='exit'?'돌아가기':nearby?'조사':'···';

  return <section ref={viewportRef} tabIndex={-1} className="mobile-exploration" aria-label={`${world.label} 탐험`}>
    <div className="mobile-exploration__viewport" aria-hidden="true">
      <div className="mobile-exploration__world" style={worldStyle}>
        {world.layers.map(layer=><img key={layer.id} className="mobile-exploration__layer" src={layer.src} alt="" draggable={false} style={{zIndex:layer.zIndex}}/>)}
        {unlockedInteractables.map(interaction=><Fragment key={interaction.id}>
          {interaction.artSrc?<img
            className="mobile-exploration__landmark"
            data-interaction={interaction.id}
            data-kind={interaction.kind}
            data-completed={(completed.has(interaction.id)&&!interaction.repeatable)||undefined}
            src={interaction.artSrc}
            alt=""
            draggable={false}
            style={{left:interaction.position.x,top:interaction.position.y}}
          />:interaction.kind==='portal'?<span
            className="mobile-exploration__portal-marker"
            data-interaction={interaction.id}
            style={{left:interaction.position.x,top:interaction.position.y}}
            aria-hidden="true"
          >◎</span>:interaction.kind==='exit'?<span className="mobile-exploration__exit-marker" style={{left:interaction.position.x,top:interaction.position.y}} aria-hidden="true">↩</span>:null}
          {interaction.badge?<span
            className="mobile-exploration__interaction-badge"
            data-tone={interaction.badgeTone}
            style={{left:interaction.position.x,top:interaction.position.y}}
            aria-hidden="true"
          >{interaction.badge}</span>:null}
        </Fragment>)}
        {unlockedInteractables.filter(interaction=>interaction.kind==='portal').map(interaction=><span
          key={`${interaction.id}:label`}
          className="mobile-exploration__portal-label"
          style={{left:interaction.position.x,top:interaction.position.y}}
          aria-hidden="true"
        >{interaction.label}</span>)}
        <img className="mobile-exploration__player" data-moving={moving||undefined} data-facing={facing} src={playerArtSrc} alt="" draggable={false} style={playerStyle}/>
      </div>
    </div>

    <div className="mobile-exploration__hud"><small>EXPLORATION</small><strong>{world.label}</strong><span>{world.objective}</span></div>
    {showExitButton?<button type="button" className="mobile-exploration__exit" disabled={Boolean(activeFrame)} onClick={onExit} aria-label={`${world.label} 탐험 종료`}>×</button>:null}
    <div className="mobile-exploration__prompt" role="status" aria-live="polite">{nearby?nearby.label:idlePrompt}</div>
    <MobileJoystick disabled={Boolean(activeFrame)} onDirection={setJoystickDirection}/>
    <button ref={actionButtonRef} type="button" className="mobile-exploration__action" disabled={!nearby||Boolean(activeFrame)} onClick={openInteraction} aria-label={nearby?.label??'주변에 조사할 대상이 없습니다'}>{actionText}</button>
    {activeFrame?<StoryFrameOverlay frame={activeFrame} onComplete={()=>finishStory(activeFrame)} onCancel={()=>closeStory()}/>:null}
  </section>;
}