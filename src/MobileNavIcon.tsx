export type MobileNavIconName='home'|'life'|'growth'|'adventure'|'bond'|'records'|'bell'|'chevron';

type Props={name:MobileNavIconName;className?:string};

const paths:Record<MobileNavIconName,string[]>={
  home:['M3.5 10.5 12 3.8l8.5 6.7','M5.5 9.6V20h13V9.6','M9.2 20v-6.4h5.6V20','M18.5 4.3v3.2'],
  life:['M5 5.5h14v15H5z','M8 3v5m8-5v5M5 9.5h14','M8.3 13h.1m3.6 0h.1m3.6 0h.1M8.3 16.5h.1m3.6 0h.1'],
  growth:['M12 20v-8','M12 13c-4.4 0-7-2.4-7-6 4.4 0 7 2.4 7 6Z','M12 11c4.4 0 7-2.4 7-6-4.4 0-7 2.4-7 6Z','M18.5 14.5v4m-2-2h4'],
  adventure:['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z','m15.7 8.3-2.2 5.2-5.2 2.2 2.2-5.2 5.2-2.2Z'],
  bond:['M12 20s-7.2-4.2-7.2-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.2 2.6C19.2 15.8 12 20 12 20Z','M8.3 7.2c-.8-.8-.5-2.2.5-2.7m2.1 1.8c-.5-1 .1-2.2 1.2-2.4m2 2.5c.1-1.1 1.2-1.8 2.2-1.4'],
  records:['M4.5 5.2c2.7-.7 5.1-.2 7.5 1.4v13c-2.4-1.6-4.8-2.1-7.5-1.4v-13Z','M19.5 5.2c-2.7-.7-5.1-.2-7.5 1.4v13c2.4-1.6 4.8-2.1 7.5-1.4v-13Z','m17.4 2 .5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5.5-1.1Z'],
  bell:['M6.5 17h11l-1.5-2.1V10a4 4 0 0 0-8 0v4.9L6.5 17Z','M10 19.2a2.2 2.2 0 0 0 4 0'],
  chevron:['m9 6 6 6-6 6'],
};

export default function MobileNavIcon({name,className}:Props){
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {paths[name].map((path,index)=><path key={index} d={path}/>) }
  </svg>;
}
