import {type CSSProperties,type PointerEvent,useCallback,useEffect,useRef,useState} from 'react';
import type {Vec2} from './exploration-types';

const MAX_KNOB_TRAVEL=38;
const DEAD_ZONE=.14;

type Props={
  disabled?:boolean;
  onDirection:(direction:Vec2)=>void;
};

export default function MobileJoystick({disabled=false,onDirection}:Props){
  const [knob,setKnob]=useState<Vec2>({x:0,y:0});
  const activePointerRef=useRef<number|null>(null);

  const neutralize=useCallback(()=>{
    setKnob({x:0,y:0});
    onDirection({x:0,y:0});
  },[onDirection]);

  const reset=useCallback(()=>{
    activePointerRef.current=null;
    neutralize();
  },[neutralize]);

  useEffect(()=>{
    if(disabled) reset();
  },[disabled,reset]);

  useEffect(()=>{
    const resetWhenHidden=()=>{if(document.hidden) reset();};
    window.addEventListener('blur',reset);
    document.addEventListener('visibilitychange',resetWhenHidden);
    return ()=>{
      window.removeEventListener('blur',reset);
      document.removeEventListener('visibilitychange',resetWhenHidden);
    };
  },[reset]);

  const update=useCallback((event:PointerEvent<HTMLDivElement>)=>{
    if(disabled||activePointerRef.current!==event.pointerId) return;
    const rect=event.currentTarget.getBoundingClientRect();
    const centerX=rect.left+rect.width/2;
    const centerY=rect.top+rect.height/2;
    const rawX=event.clientX-centerX;
    const rawY=event.clientY-centerY;
    const radius=Math.max(1,Math.min(rect.width,rect.height)*.36);
    const rawMagnitude=Math.hypot(rawX,rawY)/radius;
    if(rawMagnitude<=DEAD_ZONE){
      neutralize();
      return;
    }
    const clampedMagnitude=Math.min(1,rawMagnitude);
    const outputMagnitude=(clampedMagnitude-DEAD_ZONE)/(1-DEAD_ZONE);
    const sourceLength=Math.max(1,Math.hypot(rawX,rawY));
    const x=rawX/sourceLength*outputMagnitude;
    const y=rawY/sourceLength*outputMagnitude;
    setKnob({x:x*MAX_KNOB_TRAVEL,y:y*MAX_KNOB_TRAVEL});
    onDirection({x,y});
  },[disabled,neutralize,onDirection]);

  const start=(event:PointerEvent<HTMLDivElement>)=>{
    if(disabled||activePointerRef.current!==null) return;
    event.preventDefault();
    activePointerRef.current=event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event);
  };

  const finish=(event:PointerEvent<HTMLDivElement>)=>{
    if(activePointerRef.current!==event.pointerId) return;
    activePointerRef.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    neutralize();
  };

  const loseCapture=(event:PointerEvent<HTMLDivElement>)=>{
    if(activePointerRef.current===event.pointerId) reset();
  };

  const knobStyle={
    '--exploration-stick-x':`${knob.x}px`,
    '--exploration-stick-y':`${knob.y}px`,
  } as CSSProperties;

  return <div
    className="exploration-joystick"
    data-disabled={disabled||undefined}
    aria-label="이동 조이스틱"
    aria-disabled={disabled}
    role="application"
    onPointerDown={start}
    onPointerMove={event=>activePointerRef.current===event.pointerId&&update(event)}
    onPointerUp={finish}
    onPointerCancel={finish}
    onLostPointerCapture={loseCapture}
  >
    <span className="exploration-joystick__ring" aria-hidden="true"/>
    <span className="exploration-joystick__knob" style={knobStyle} aria-hidden="true"><i/></span>
  </div>;
}
