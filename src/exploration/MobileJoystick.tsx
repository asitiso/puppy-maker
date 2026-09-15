import {type CSSProperties,type PointerEvent,useCallback,useEffect,useState} from 'react';
import type {Vec2} from './exploration-types';

const MAX_KNOB_TRAVEL=38;

type Props={
  disabled?:boolean;
  onDirection:(direction:Vec2)=>void;
};

export default function MobileJoystick({disabled=false,onDirection}:Props){
  const [knob,setKnob]=useState<Vec2>({x:0,y:0});

  const reset=useCallback(()=>{
    setKnob({x:0,y:0});
    onDirection({x:0,y:0});
  },[onDirection]);

  useEffect(()=>{
    if(disabled) reset();
  },[disabled,reset]);

  const update=useCallback((event:PointerEvent<HTMLDivElement>)=>{
    if(disabled) return;
    const rect=event.currentTarget.getBoundingClientRect();
    const centerX=rect.left+rect.width/2;
    const centerY=rect.top+rect.height/2;
    const rawX=event.clientX-centerX;
    const rawY=event.clientY-centerY;
    const radius=Math.max(1,Math.min(rect.width,rect.height)*.36);
    const length=Math.hypot(rawX,rawY);
    const scale=length>radius?radius/length:1;
    const x=rawX*scale/radius;
    const y=rawY*scale/radius;
    setKnob({x:x*MAX_KNOB_TRAVEL,y:y*MAX_KNOB_TRAVEL});
    onDirection({x,y});
  },[disabled,onDirection]);

  const start=(event:PointerEvent<HTMLDivElement>)=>{
    if(disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event);
  };

  const finish=(event:PointerEvent<HTMLDivElement>)=>{
    if(event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    reset();
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
    onPointerMove={event=>event.currentTarget.hasPointerCapture(event.pointerId)&&update(event)}
    onPointerUp={finish}
    onPointerCancel={finish}
    onLostPointerCapture={reset}
  >
    <span className="exploration-joystick__ring" aria-hidden="true"/>
    <span className="exploration-joystick__knob" style={knobStyle} aria-hidden="true"><i/></span>
  </div>;
}
