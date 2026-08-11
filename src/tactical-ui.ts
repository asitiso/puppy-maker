import type {BattlePosition,BattleSession,TacticalUnit} from './tactical-battle';
export type TacticalUnitView={id:string;hp:number;maxHp:number;shield:number;position:BattlePosition;alive:boolean};
const view=(u:TacticalUnit):TacticalUnitView=>({id:u.id,hp:u.hp,maxHp:u.maxHp,shield:u.shield,position:u.position,alive:u.hp>0});
export function battleSpeedLabel(speed:1|2){return `${speed}x`;}
export function formationSlotLabel(position:BattlePosition){return position.toUpperCase();}
export function buildTacticalBattleView(session:BattleSession,auto:boolean,speed:1|2){return {round:session.round,allies:session.units.filter(u=>u.side==='ally').map(view),enemies:session.units.filter(u=>u.side==='enemy').map(view),timeline:session.timeline.slice(),autoLabel:auto?'AUTO ON':'AUTO OFF',speedLabel:battleSpeedLabel(speed)};}
