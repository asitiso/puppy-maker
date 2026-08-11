import{describe,expect,it}from'vitest';import{hydrateGameState,initialState,reducer,type GameState}from'./game';import{FINISHER_COMBO_THRESHOLD}from'./game/finisher';
const train=(state:GameState,kind:'attack'|'dodge'|'charge',accuracy:number)=>reducer(state,{type:'TRAIN',kind,accuracy});
describe('TRAIN reducer wires the finisher mechanic end to end',()=>{
 it('builds combo through the reducer just like before, with finisherCharged staying false',()=>{let s=initialState;for(let i=0;i<3;i++)s=train(s,'attack',.9);expect(s.combo).toBe(3);expect(s.finisherCharged).toBe(false)});
 it('charges the finisher once combo reaches the threshold and a charge press lands',()=>{let s={...initialState,combo:FINISHER_COMBO_THRESHOLD};s=train(s,'charge',.9);expect(s.finisherCharged).toBe(true)});
 it('landing the finisher gives a bigger score jump than a normal attack at the same accuracy',()=>{const charged={...initialState,combo:FINISHER_COMBO_THRESHOLD+1,finisherCharged:true};const withFinisher=train(charged,'attack',.9);const withoutFinisher=train({...initialState,combo:FINISHER_COMBO_THRESHOLD+1,finisherCharged:false},'attack',.9);expect(withFinisher.trainingScore).toBeGreaterThan(withoutFinisher.trainingScore);expect(withFinisher.finisherCharged).toBe(false);expect(withFinisher.combo).toBe(0)});
 it('resets finisherCharged when a training week finishes',()=>{const s=reducer({...initialState,finisherCharged:true},{type:'FINISH_TRAINING'});expect(s.finisherCharged).toBe(false)});
 it('round-trips finisherCharged through save hydration as a strict boolean',()=>{const hydrated=hydrateGameState(JSON.stringify({...initialState,finisherCharged:'yes'}));expect(hydrated.finisherCharged).toBe(false)});
});
