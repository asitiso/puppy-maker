import { useState } from 'react';

const sprite = '/ui/home-ui-sprite.svg';

function Asset({ id, className = '' }: { id: string; className?: string }) {
  return <svg className={className} aria-hidden="true"><use href={`${sprite}#${id}`} /></svg>;
}

const iconPaths: Record<string, string> = {
  gift: 'M5 10h14v10H5zM4 7h16v4H4zM12 7v13M8.2 7C5.8 7 5.3 3.8 7.6 3.4 9.5 3 11 5.3 12 7c1-1.7 2.5-4 4.4-3.6 2.3.4 1.8 3.6-.6 3.6',
  event: 'M5 6h14v14H5zM8 3v5m8-5v5M5 10h14M9 14l2 2 4-4',
  mail: 'M4 7h16v11H4zM4 8l8 6 8-6',
  scroll: 'M7 4h10a2 2 0 012 2v12H7a2 2 0 010-4h10M7 4a2 2 0 000 4h10M10 10h5m-5 3h5',
  calendar: 'M5 6h14v14H5zM8 3v5m8-5v5M5 10h14M8 14h3m2 0h3m-8 3h3m2 0h3',
  bag: 'M6 9h12l1 11H5L6 9zm4 0V6a2 2 0 014 0v3',
  quest: 'M7 4h10v16H7zM10 8h4m-4 4h4m-4 4h3M5 7h2m-2 5h2m-2 5h2',
  map: 'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6zm5-2v14m6-12v14',
  heart: 'M12 20S4 15.5 4 9.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.5 12 20 12 20z',
  gems: 'M12 3l6 5-6 12L6 8l6-5zm-6 5h12M9 8l3 12 3-12',
  paw: 'M12 13c-4 0-7 3-7 6 0 2 2 3 4 2 2-1 4-1 6 0 2 1 4 0 4-2 0-3-3-6-7-6zM7 8a2 3 0 110-6 2 3 0 010 6zm10 0a2 3 0 110-6 2 3 0 010 6zm-6-2a2 3 0 110-6 2 3 0 010 6zm2 0a2 3 0 110-6 2 3 0 010 6z'
};

function GameIcon({ name }: { name: string }) {
  return <svg className="game-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]} /></svg>;
}

const shortcuts = [
  ['gift', '출석체크'], ['event', '이벤트'], ['mail', '우편함'], ['scroll', '미션']
];

const nav = [
  ['calendar', '스케줄'], ['bag', '가방'], ['quest', '퀘스트'], ['map', '외출'], ['heart', '교감']
];

export default function LayeredHome({ onSchedule }: { onSchedule: () => void }) {
  const [petted, setPetted] = useState(false);
  const [activeNav, setActiveNav] = useState(2);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x, y });
  };

  const handleNav = (index: number) => {
    setActiveNav(index);
    if (index === 0) onSchedule();
    if (index === 4) setPetted(true);
  };

  return <section
    className="layered-home"
    onPointerMove={handleMove}
    onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    style={{ '--px': tilt.x, '--py': tilt.y } as React.CSSProperties}
  >
    <div className="lh-scene-layer">
      <img className="lh-background" src="/assets/home/home_bg_layer.webp" alt="" />
      <div className="lh-window-light" />
      <div className="lh-fire-light" />
      <div className="lh-floor-glow" />
    </div>
    <div className="layered-vignette" />
    <div className="layered-particles" />

    <button className="lh-character" onClick={() => setPetted(true)} aria-label="루나와 교감">
      <span className="lh-character-rim" />
      <img src="/assets/home/runa_idle_layer.png" alt="수호 여우 루나" />
    </button>
    {petted && <div className="lh-heart">♥</div>}

    <div className="lh-level">
      <Asset id="level" />
      <div><small>Lv.</small><strong>10</strong><span>루나</span></div>
    </div>

    <div className="lh-currency">
      <Asset id="currency" />
      <div className="lh-currency-values">
        <span><i className="coin star">★</i><b>5,250</b></span>
        <span><i className="coin gold">●</i><b>22,000</b></span>
        <span><i className="coin gem">◆</i><b>220</b></span>
      </div>
      <div className="lh-hp"><i /><b>120 / 120</b></div>
    </div>

    <div className="lh-weather">
      <Asset id="weather" />
      <div><b>4월 2주차</b><span>☀ 맑음</span></div>
    </div>

    <div className="lh-shortcuts">
      {shortcuts.map(([icon, label]) => <button key={label}>
        <Asset id="shortcut" /><span className="lh-shortcut-icon"><GameIcon name={icon} /></span><b>{label}</b>
      </button>)}
    </div>

    <div className="lh-goal">
      <Asset id="goal" />
      <div><h3>이번 주 목표</h3><p>✓ 훈련 3회 완료 <b>(1/3)</b></p><p>□ 대화 2회 하기 <b>(1/2)</b></p><p>□ 요리 1회 하기 <b>(0/1)</b></p></div>
    </div>

    <div className="lh-promos">
      <button><span><GameIcon name="gems" /></span><b>초보자 패키지</b><small>23:59:59</small></button>
      <button><span><GameIcon name="paw" /></span><b>성장 보너스</b><small>11:42:18</small></button>
    </div>

    <div className="lh-dialogue">
      <Asset id="dialogue" />
      <span className="lh-name">루나</span>
      <p>{petted ? '헤헤… 주인님의 손은 정말 따뜻해요!' : '주인님! 오늘도 좋은 하루가 될 거예요!'}<br/>어디로 가볼까요? ✨</p>
      <i className="lh-dialogue-next">◆</i>
    </div>

    <nav className="lh-bottom-nav">
      {nav.map(([icon, label], index) => <button
        key={label}
        className={activeNav === index ? 'is-active' : ''}
        onClick={() => handleNav(index)}
        aria-pressed={activeNav === index}
      >
        <Asset id="nav" />
        <span><GameIcon name={icon} /></span><b>{label}</b>
      </button>)}
    </nav>
  </section>;
}
