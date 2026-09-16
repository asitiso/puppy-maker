import type {KeyboardEvent} from 'react';
import type {ExplorationStoryFrame} from './exploration-types';

type Props={
  frame:ExplorationStoryFrame;
  onComplete:()=>void;
};

export default function StoryFrameOverlay({frame,onComplete}:Props){
  const keepDialogFocus=(event:KeyboardEvent<HTMLElement>)=>{
    if(event.key!=='Tab') return;
    const continueButton=event.currentTarget.querySelector<HTMLButtonElement>('.exploration-story-frame__continue');
    if(!continueButton) return;
    event.preventDefault();
    continueButton.focus();
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
