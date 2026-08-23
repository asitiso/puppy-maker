import { useEffect, useRef } from 'react';
import type {
  HollowCampaignPresentation,
  HollowChoiceAftermathPresentation,
  HollowEndingPresentation,
  HollowTemptationPresentation,
} from './hollow-path-experience';
import './hollow-path.css';

export type HollowPathHubViewModel = {
  temptation: HollowTemptationPresentation;
  aftermath: HollowChoiceAftermathPresentation | null;
  current: HollowCampaignPresentation | HollowEndingPresentation | null;
  vn: {
    portrait?: string;
    name: string;
    dialogue: string;
    choices: readonly string[];
  };
};

type HollowPathHubProps = {
  open: boolean;
  model: HollowPathHubViewModel;
  onOpen: () => void;
  onClose: () => void;
  onAcceptHollow: () => void;
  onRefuseHollow: () => void;
};

const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function renderCurrent(current: HollowPathHubViewModel['current']) {
  if (!current) return null;

  if ('id' in current) {
    return (
      <section className="hollow-path-panel hollow-path-ending" aria-labelledby="hollow-ending-title">
        <p className="hollow-path-kicker">HOLLOW ENDING</p>
        <h2 id="hollow-ending-title">{current.title}</h2>
        <p>{current.summary}</p>
        <div className="hollow-path-grid">
          <article>
            <h3>세계에 남은 것</h3>
            {current.worldLegacy.map((item) => <p key={item}>{item}</p>)}
          </article>
          <article>
            <h3>관계에 남은 것</h3>
            {current.bondLegacy.map((item) => <p key={item}>{item}</p>)}
          </article>
        </div>
        <p className="hollow-path-future">{current.future}</p>
      </section>
    );
  }

  const kicker = current.title.includes('Summer')
    ? 'SUMMER'
    : current.title.includes('Autumn')
      ? 'AUTUMN'
      : 'LONG NIGHT';

  return (
    <section className="hollow-path-panel" aria-label={current.title}>
      <p className="hollow-path-kicker">{kicker}</p>
      <h2>{current.title}</h2>
      <p className="hollow-path-objective">{current.objective}</p>
      <blockquote>{current.veyr}</blockquote>
      <div className="hollow-path-tension">
        <article>
          <h3>지금 얻는 것</h3>
          <p>{current.tension.shortTermGain}</p>
        </article>
        <article>
          <h3>남게 되는 것</h3>
          <p>{current.tension.longTermCost}</p>
        </article>
      </div>
      <div className="hollow-path-grid">
        <article>
          <h3>세계의 반응</h3>
          {current.world.map((item) => <p key={item}>{item}</p>)}
        </article>
        <article>
          <h3>관계의 변화</h3>
          {current.bond.map((item) => <p key={item}>{item}</p>)}
        </article>
      </div>
      {current.resolution ? <p className="hollow-path-resolution">{current.resolution}</p> : null}
    </section>
  );
}

export default function HollowPathHub({
  open,
  model,
  onOpen,
  onClose,
  onAcceptHollow,
  onRefuseHollow,
}: HollowPathHubProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(focusableSelector);
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusables.length === 0) return;
      const firstItem = focusables[0];
      const lastItem = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, onClose]);

  const currentTitle = model.current?.title
    ?? model.aftermath?.title
    ?? model.temptation.routeLabel;

  if (!open) {
    return (
      <section className="hollow-path-home" aria-label="Hollow Path 홈">
        <div>
          <p className="hollow-path-kicker">HOLLOW PATH</p>
          <h2>Hollow Path</h2>
          <p>{currentTitle}</p>
        </div>
        <button ref={triggerRef} type="button" onClick={onOpen}>Journey 열기</button>
      </section>
    );
  }

  return (
    <section
      ref={dialogRef}
      className="hollow-path-shell"
      role="dialog"
      aria-modal="true"
      aria-label="Hollow Path Journey"
    >
      <header className="hollow-path-header">
        <div>
          <p className="hollow-path-kicker">HOLLOW PATH · JOURNEY</p>
          <h1>{currentTitle}</h1>
        </div>
        <button type="button" onClick={onClose} aria-label="Hollow Path Journey 닫기">돌아가기</button>
      </header>

      <section className="hollow-path-panel hollow-path-route" aria-labelledby="hollow-current-route-title">
        <p className="hollow-path-kicker">현재 걷는 길</p>
        <h2 id="hollow-current-route-title">{model.aftermath?.routeLabel ?? model.temptation.routeLabel}</h2>
        <p>{model.temptation.atmosphere}</p>
        <blockquote>{model.temptation.veyr}</blockquote>
        <div className="hollow-path-tension">
          <article>
            <h3>{model.temptation.temptation.label}</h3>
            <p>{model.temptation.temptation.shortTermBenefit}</p>
          </article>
          <article>
            <h3>선택 뒤에 남는 것</h3>
            <p>{model.temptation.temptation.costHint}</p>
          </article>
        </div>
        {model.temptation.inheritedEcho ? (
          <p className="hollow-path-echo">{model.temptation.inheritedEcho}</p>
        ) : null}

        {model.temptation.finalChoice ? (
          <div className="hollow-path-offer" aria-labelledby="hollow-final-offer-title">
            <h3 id="hollow-final-offer-title">마지막 제안</h3>
            <p>{model.temptation.finalChoice.prompt}</p>
            <div className="hollow-path-actions">
              <button type="button" onClick={onAcceptHollow}>{model.temptation.finalChoice.accept.label}</button>
              <button type="button" onClick={onRefuseHollow}>{model.temptation.finalChoice.refuse.label}</button>
            </div>
          </div>
        ) : null}
      </section>

      {model.aftermath ? (
        <section className="hollow-path-panel hollow-path-aftermath" aria-labelledby="hollow-aftermath-title">
          <p className="hollow-path-kicker">선택 이후</p>
          <h2 id="hollow-aftermath-title">{model.aftermath.title}</h2>
          <p className="hollow-path-route-label">{model.aftermath.routeLabel}</p>
          <p>{model.aftermath.summary}</p>
          <blockquote>{model.aftermath.veyr}</blockquote>
          <p>{model.aftermath.bondConsequence}</p>
        </section>
      ) : null}

      {renderCurrent(model.current)}

      <section className="hollow-path-panel hollow-path-vn" aria-label="Hollow Path 이야기">
        <div className="hollow-path-vn-row">
          {model.vn.portrait ? <img src={model.vn.portrait} alt="" /> : null}
          <div>
            <p className="hollow-path-kicker">{model.vn.name}</p>
            <p>{model.vn.dialogue}</p>
          </div>
        </div>
        <div className="hollow-path-vn-choices">
          {model.vn.choices.map((choice) => <button type="button" key={choice}>{choice}</button>)}
        </div>
      </section>
    </section>
  );
}
