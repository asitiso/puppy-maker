import {useState} from 'react';
import {getMobileVisualAsset,type MobileVisualSlot} from './mobile-visual-assets';
import './mobile-v9.css';

type Props={slot:MobileVisualSlot;className?:string};

export default function MobileCharacterArt({slot,className=''}:Props){
  const asset=getMobileVisualAsset(slot);
  const [failed,setFailed]=useState(false);
  const classes=['v9-character-art',`v9-fallback-${asset.fallback}`,className].filter(Boolean).join(' ');

  return <span className={classes} data-visual-slot={slot}>
    <span className="v9-character-fallback" aria-hidden="true"/>
    {asset.src&&!failed&&<img
      className="v9-character-image"
      src={asset.src}
      alt={asset.alt??''}
      draggable={false}
      style={{objectFit:asset.fit,objectPosition:asset.position}}
      onError={()=>setFailed(true)}
    />}
    {!asset.src||failed?<span className="v9-character-fallback-label" aria-label={asset.alt??'캐릭터 이미지'}>{asset.alt?.slice(0,1)??'✦'}</span>:null}
  </span>;
}
