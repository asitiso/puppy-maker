import type {KeyboardEvent} from 'react';
import type {ExplorationStoryFrame} from './exploration-types';

type Props={
  frame:ExplorationStoryFrame;
  onComplete:()=>void;
  onCancel:()=>void;
};

export default function StoryFrameOverlay({frame,onComplete,onCancel}:Props){
  const keepDialogFocus=(event:KeyboardEvent<HTMLElement>)=>{
    if(event.key!=='Tab') return;
    const controls=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    if(controls.length===0) return;
    const first=controls[0];
    const last=controls[controls.length-1];
    if(!event.shiftKey&&document.activeElement===last){
      event.preventDefault();
      first.focus();
    }else if(event.shiftKey&&document.activeElement===first){
      event.preventDefault();
      last.focus();
    }
  };

  return <div className="exploration-story-backdrop">
    <section
      className="exploration-story-frame"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`exploration-story-title-${frame.id}`}
      aria-describedby={`exploration-story-text-${frame.id}`}
      onKeyDown={keepDialogFocus}
    >
      <button type="button" className="exploration-story-frame__close" aria-label="스토리 닫기" onClick={onCancel}>×</button>
      <div className="exploration-story-frame__visual">
        <img className="exploration-story-frame__art" src={frame.artSrc} alt="" draggable={false}/>
        <img className="exploration-story-frame__ornament" src={frame.frameSrc} alt="" aria-hidden="true" draggable={false}/>
      </div>
      <div className="exploration-story-frame__copy">
        {frame.eyebrow?<small>{frame.eyebrow}</small>:null}
        <h2 id={`exploration-story-title-${frame.id}`}>{frame.title}</h2>
        {frame.speaker?<b>{frame.speaker}</b>:null}
        <p id={`exploration-story-text-${frame.id}`}>{frame.text}</p>
        <button type="button" className="exploration-story-frame__continue" autoFocus onClick={onComplete}>{frame.actionLabel}</button>
      </div>
    </section>
  </div>;
}
