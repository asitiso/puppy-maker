import{describe,expect,it}from'vitest';import{applyFinisher,FINISHER_COMBO_THRESHOLD}from'./finisher';
describe('training finisher (combo charge -> release)',()=>{
 it('builds combo on successful hits with no bonus below the threshold',()=>{const r=applyFinisher({combo:0,finisherCharged:false},'attack',.9,140);expect(r.combo).toBe(1);expect(r.finisherCharged).toBe(false);expect(r.bonus).toBe(0)});
 it('resets combo and charge on a miss',()=>{const r=applyFinisher({combo:4,finisherCharged:false},'attack',.3,140);expect(r.combo).toBe(0);expect(r.finisherCharged).toBe(false)});
 it('charges the finisher on a successful charge press once combo reaches the threshold',()=>{const r=applyFinisher({combo:FINISHER_COMBO_THRESHOLD,finisherCharged:false},'charge',.8,80);expect(r.finisherCharged).toBe(true);expect(r.combo).toBe(FINISHER_COMBO_THRESHOLD+1)});
 it('does not charge on a charge press before the threshold',()=>{const r=applyFinisher({combo:FINISHER_COMBO_THRESHOLD-1,finisherCharged:false},'charge',.8,80);expect(r.finisherCharged).toBe(false)});
 it('lands the finisher on the next successful attack, granting a bonus and resetting combo',()=>{const r=applyFinisher({combo:FINISHER_COMBO_THRESHOLD+1,finisherCharged:true},'attack',.9,140);expect(r.bonus).toBe(Math.round(140*1.2));expect(r.finisherCharged).toBe(false);expect(r.combo).toBe(0)});
 it('drops a charged finisher if the next hit is a miss',()=>{const r=applyFinisher({combo:FINISHER_COMBO_THRESHOLD+1,finisherCharged:true},'attack',.3,140);expect(r.finisherCharged).toBe(false);expect(r.bonus).toBe(0)});
 it('keeps the charge alive through an unrelated successful dodge in between',()=>{const r=applyFinisher({combo:FINISHER_COMBO_THRESHOLD+1,finisherCharged:true},'dodge',.9,110);expect(r.finisherCharged).toBe(true);expect(r.bonus).toBe(0)});
});
