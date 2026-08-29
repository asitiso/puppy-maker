import fs from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

it('global overlays share complete modal focus lifecycle', () => {
  const hook = source('src/useOverlayFocusManagement.ts');
  expect(hook).toMatch(/event\.key === 'Escape'/);
  expect(hook).toMatch(/event\.key !== 'Tab'/);
  expect(hook).toMatch(/initialFocusRef\.current\?\.focus\(\)/);
  expect(hook).toMatch(/restoreTarget\?\.focus\(\)/);

  for (const file of [
    'src/SanctuaryOverlay.tsx',
    'src/RaisingIdentityOverlay.tsx',
    'src/SeasonLiveOpsOverlay.tsx',
    'src/WorldProgressOverlay.tsx',
  ]) {
    const overlay = source(file);
    expect(overlay).toMatch(/useOverlayFocusManagement/);
    expect(overlay).toMatch(/dialogRef/);
    expect(overlay).toMatch(/initialFocusRef/);
  }
});
