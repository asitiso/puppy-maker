import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import V12EquipmentCompare from './V12EquipmentCompare'

describe('V12 equipment compare', () => {
  it('compares behavior and affinity instead of reducing equipment to one power number', () => {
    const html = renderToStaticMarkup(<V12EquipmentCompare characterId="runa" currentId="training_blade" candidateId="star_staff" />)
    expect(html).toContain('현재 장비')
    expect(html).toContain('비교 장비')
    expect(html).toContain('기본 공격 훈련')
    expect(html).toContain('연쇄 마법')
    expect(html).toContain('선호')
    expect(html).toContain('Chain')
    expect(html).toContain('Burst')
  })

  it('warns when signature equipment cannot be equipped by the selected character', () => {
    const html = renderToStaticMarkup(<V12EquipmentCompare characterId="owl" currentId={null} candidateId="guardian_shield" />)
    expect(html).toContain('장착 불가')
    expect(html).toContain('Bear 전용')
  })
})
