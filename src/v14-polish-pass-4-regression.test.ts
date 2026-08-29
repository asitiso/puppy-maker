import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

test('global overlays share complete modal focus lifecycle', () => {
  const hook = source('src/useOverlayFocusManagement.ts')
  assert.match(hook, /event\.key === 'Escape'/)
  assert.match(hook, /event\.key !== 'Tab'/)
  assert.match(hook, /initialFocusRef\.current\?\.focus\(\)/)
  assert.match(hook, /restoreTarget\?\.focus\(\)/)

  for (const file of [
    'src/SanctuaryOverlay.tsx',
    'src/RaisingIdentityOverlay.tsx',
    'src/SeasonLiveOpsOverlay.tsx',
    'src/WorldProgressOverlay.tsx',
  ]) {
    const overlay = source(file)
    assert.match(overlay, /useOverlayFocusManagement/)
    assert.match(overlay, /dialogRef/)
    assert.match(overlay, /initialFocusRef/)
  }
})
