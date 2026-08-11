import{describe,expect,it}from'vitest';import{applySkillCard,SKILL_CARDS}from'./skill-cards';
describe('adventure skill cards',()=>{
 it('lists exactly the four GDD-flavored cards',()=>{expect(SKILL_CARDS.map(c=>c.id)).toEqual(['fireball','heal','shield','focus'])});
 it('leaves modifiers untouched when no card is picked',()=>{const base={perfectWindow:.9,hazardPenalty:30};expect(applySkillCard(base,null)).toEqual(base)});
 it('fireball raises the assist bonus',()=>{expect(applySkillCard({assist:.1},'fireball').assist).toBeCloseTo(.15)});
 it('heal softens hazard and choice penalties',()=>{const out=applySkillCard({hazardPenalty:30,choicePenalty:20},'heal');expect(out.hazardPenalty).toBe(21);expect(out.choicePenalty).toBe(14)});
 it('shield widens the perfect window and balance tolerance',()=>{const out=applySkillCard({perfectWindow:.9,balanceTolerance:32},'shield');expect(out.perfectWindow).toBeCloseTo(.85);expect(out.balanceTolerance).toBe(40)});
 it('focus lowers the fever combo requirement but never below 2',()=>{expect(applySkillCard({feverCombo:4},'focus').feverCombo).toBe(3);expect(applySkillCard({feverCombo:2},'focus').feverCombo).toBe(2)});
});
