import {useState} from 'react';
import {getMobileVisualAsset,type MobileVisualSlot} from './mobile-visual-assets';
import './mobile-v9.css';

type Props={slot:MobileVisualSlot;className?:string};

export default function MobileSceneBackground({slot,className=''}:Props){
  const asset=getMobileVisualAsset(slot);
  const [failed,setFailed]=useState(false);
  const classes=['v9-scene-background',`v9-fallback-${asset.fallback}`,className].filter(Boolean).join(' ');

  return <span className={classes} aria-hidden="true" data-visual-slot={slot}>
    <span className="v9-scene-fallback"/>
    {asset.src&&!failed&&<img
      className="v9-scene-image"
      src={asset.src}
      alt=""
      draggable={false}
      style={{objectFit:asset.fit,objectPosition:asset.position}}
      onError={()=>setFailed(true)}
    />}
    <span className={`v9-scene-overlay is-${asset.overlay}`}/>
  </span>;
}
