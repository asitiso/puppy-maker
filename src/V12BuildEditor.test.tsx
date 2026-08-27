import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import V12BuildEditor from './V12BuildEditor'
import { acquireEquipment, createDefaultV12State } from './v12-character-builds'

describe('V12 build editor', () => {
  it('lets the player choose a Leader only from the current three-person party', () => {
    const state=createDefaultV12State()
    const html=renderToStaticMarkup(<V12BuildEditor mode="party" state={state} unlockedOutfitIds={['runa_classic']} onLeaderChange={vi.fn()} onOutfitChange={vi.fn()} onEquipmentChange={vi.fn()} onClose={vi.fn()} />)
    expect(html).toContain('Leader 선택')
    expect(html).toContain('Runa')
    expect(html).toContain('Bear')
    expect(html).toContain('Owl')
    expect(html).not.toContain('Wolf')
    expect(html).not.toContain('Cat')
  })

  it('shows only outfits unlocked by the existing wardrobe progression', () => {
    const state=createDefaultV12State()
    const html=renderToStaticMarkup(<V12BuildEditor mode="outfit" state={state} unlockedOutfitIds={['runa_classic','forest_charm']} onLeaderChange={vi.fn()} onOutfitChange={vi.fn()} onEquipmentChange={vi.fn()} onClose={vi.fn()} />)
    expect(html).toContain('루나의 기본 리본')
    expect(html).toContain('숲길 부적')
    expect(html).not.toContain('달빛 브로치')
  })

  it('shows owned equipment for the selected slot and keeps incompatible Signature gear disabled', () => {
    let state=createDefaultV12State()
    state=acquireEquipment(state,'star_staff')
    state=acquireEquipment(state,'guardian_shield')
    const weapon=renderToStaticMarkup(<V12BuildEditor mode="weapon" state={state} unlockedOutfitIds={['runa_classic']} onLeaderChange={vi.fn()} onOutfitChange={vi.fn()} onEquipmentChange={vi.fn()} onClose={vi.fn()} />)
    expect(weapon).toContain('Training Blade')
    expect(weapon).toContain('Star Staff')
    expect(weapon).not.toContain('Guardian Shield')
    const defense=renderToStaticMarkup(<V12BuildEditor mode="defenseSupport" state={state} unlockedOutfitIds={['runa_classic']} onLeaderChange={vi.fn()} onOutfitChange={vi.fn()} onEquipmentChange={vi.fn()} onClose={vi.fn()} />)
    expect(defense).toContain('Guardian Shield')
    expect(defense).toContain('장착 불가')
    expect(defense).toContain('disabled=""')
  })
})
