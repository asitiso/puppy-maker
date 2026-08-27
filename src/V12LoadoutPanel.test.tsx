// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import V12LoadoutPanel from './V12LoadoutPanel'
import { acquireEquipment, createDefaultV12State, equipItem } from './v12-character-builds'

const css = readFileSync(new URL('./mobile-v12-loadout.css', import.meta.url), 'utf8')

describe('V12 Loadout Panel', () => {
  it('shows party and leader before customization details with one clear run action', () => {
    const state = createDefaultV12State()
    const html = renderToStaticMarkup(<V12LoadoutPanel state={state} onStartRun={vi.fn()} />)
    expect(html.indexOf('파티 편성')).toBeLessThan(html.indexOf('의상'))
    expect(html).toContain('Leader')
    expect((html.match(/data-v12-primary-action="true"/g) ?? []).length).toBe(1)
    expect(html).toContain('원정 시작')
  })

  it('shows three equipment slots, ownership-aware identity text and affinity', () => {
    let state = acquireEquipment(createDefaultV12State(), 'star_staff')
    state = equipItem(state, 'star_staff')
    const html = renderToStaticMarkup(<V12LoadoutPanel state={state} onStartRun={vi.fn()} />)
    expect(html).toContain('무기')
    expect(html).toContain('방어 / 지원')
    expect(html).toContain('액세서리')
    expect(html).toContain('Star Staff')
    expect(html).toContain('선호 장비')
    expect(html).toContain('연쇄 마법')
  })

  it('communicates run lock and disables customization controls while a snapshot exists', () => {
    const state = { ...createDefaultV12State(), runLoadoutSnapshot: createDefaultV12State().loadout }
    const html = renderToStaticMarkup(<V12LoadoutPanel state={state} onStartRun={vi.fn()} />)
    expect(html).toContain('런 진행 중 · 편성 잠금')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('런 종료 후 변경 가능')
  })

  it('keeps the mobile contract for 430, 390 and short 640px viewports', () => {
    expect(css).toMatch(/max-width:\s*430px/)
    expect(css).toMatch(/max-width:\s*390px/)
    expect(css).toMatch(/max-height:\s*640px/)
    expect(css).toContain('min-height:44px')
    expect(css).toContain('env(safe-area-inset-bottom')
    expect(css).toContain('overflow-wrap:anywhere')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('prefers-reduced-motion')
  })
})
