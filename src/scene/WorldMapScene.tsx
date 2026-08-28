import type {LocationId} from './scene-types';
import './scene.css';

export type WorldMapDestination={
  location:LocationId;
  label:string;
  unlocked:boolean;
  detail?:string;
};

type Props={
  destinations:readonly WorldMapDestination[];
  onSelect:(location:LocationId)=>void;
  onClose:()=>void;
};

export default function WorldMapScene({destinations,onSelect,onClose}:Props){
  return <section className="v14-world-map" aria-label="월드맵">
    <header className="v14-world-map__header">
      <div><small>LIVING WORLD</small><h2>어디로 갈까요?</h2></div>
      <button type="button" className="v14-world-map__close" onClick={onClose} aria-label="월드맵 닫기">×</button>
    </header>
    <div className="v14-world-map__destinations">
      {destinations.map(destination=><button
        key={destination.location}
        type="button"
        className="v14-world-map__destination"
        data-location={destination.location}
        disabled={!destination.unlocked}
        aria-disabled={!destination.unlocked}
        onClick={()=>destination.unlocked&&onSelect(destination.location)}
      >
        <b>{destination.label}</b>
        {destination.detail?<small>{destination.detail}</small>:null}
        <span aria-hidden="true">{destination.unlocked?'›':'🔒'}</span>
      </button>)}
    </div>
  </section>;
}
