import { useState } from 'react';

const sprite = '/ui/home-ui-sprite.svg';

function Asset({ id, className = '' }: { id: string; className?: string }) {
  return <svg className={className} aria-hidden="true"><use href={`${sprite}#${id}`} /></svg>;
}

const shortcuts = [
  ['🎁', '출석체크'], ['⭐', '이벤트'], ['✉️', '우편함'], ['📜', '미션']
];

const nav = [
  ['📅', '스케줄'], ['🎒', '가방'], ['📋', '퀘스트'], ['🗺️', '외출'], ['💬', '교감']
];

export default function LayeredHome({ onSchedule }: { onSchedule: () => void }) {
  const [petted, setPetted] = useState(false);
  return <section className="layered-home">
    <div className="layered-vignette" />
    <div className="layered-particles" />

    <div className="lh-level">
      <Asset id="level" />
      <div><small>Lv.</small><strong>10</strong><span>루나</span></div>
    </div>

    <div className="lh-currency">
      <Asset id="currency" />
      <div className="lh-currency-values">
        <span>⭐ <b>5,250</b></span><span>◈ <b>22,000</b></span><span>◆ <b>220</b></span>
      </div>
      <div className="lh-hp"><i /><b>120 / 120</b></div>
    </div>

    <div className="lh-weather">
      <Asset id="weather" />
      <div><b>4월 2주차</b><span>☀ 맑음</span></div>
    </div>

    <div className="lh-shortcuts">
      {shortcuts.map(([icon, label]) => <button key={label}>
        <Asset id="shortcut" /><span className="lh-shortcut-icon">{icon}</span><b>{label}</b>
      </button>)}
    </div>

    <div className="lh-goal">
      <Asset id="goal" />
      <div><h3>이번 주 목표</h3><p>✓ 훈련 3회 완료 <b>(1/3)</b></p><p>□ 대화 2회 하기 <b>(1/2)</b></p><p>□ 요리 1회 하기 <b>(0/1)</b></p></div>
    </div>

    <button className="lh-character-hit" onClick={() => setPetted(true)} aria-label="루나와 교감" />
    {petted && <div className="lh-heart">♥</div>}

    <div className="lh-dialogue">
      <Asset id="dialogue" />
      <span className="lh-name">루나</span>
      <p>{petted ? '헤헤… 주인님의 손은 정말 따뜻해요!' : '주인님! 오늘도 좋은 하루가 될 거예요!'}<br/>어디로 가볼까요? ✨</p>
    </div>

    <nav className="lh-bottom-nav">
      {nav.map(([icon, label], index) => <button key={label} onClick={index === 0 ? onSchedule : index === 4 ? () => setPetted(true) : undefined}>
        <Asset id="nav" />
        <span>{icon}</span><b>{label}</b>
      </button>)}
    </nav>
  </section>;
}
