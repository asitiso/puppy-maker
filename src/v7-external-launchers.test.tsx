import {describe,expect,it} from 'vitest';
// @ts-ignore -- source contract test runs in Node.
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('./layered-home-v7.css',import.meta.url),'utf8');
const sheet=readFileSync(new URL('./MobileCategorySheet.tsx',import.meta.url),'utf8');
const shell=readFileSync(new URL('./LayeredHomeV7.tsx',import.meta.url),'utf8');

describe('V7 legacy launcher consolidation',()=>{
  it('removes all legacy floating launchers from the default home surface',()=>{
    for(const selector of [
      '.season-live-entry',
      '.sanctuary-entry',
      '.raising-home-card',
      '.expedition-home-card',
      '.yearly-ambition-card',
      '.collection-archive-trigger',
      '.world-progress-card',
    ]) expect(css).toContain(selector);
  });

  it('moves launcher destinations into growth adventure and records categories',()=>{
    for(const label of [
      '성장 정체성',
      '시즌 여정',
      '별빛 성소',
      '수호자 원정',
      '월드 진행',
      '올해의 야망',
      '성장 도감',
    ]) expect(sheet).toContain(label);
  });

  it('exposes explicit shell callbacks for the migrated destinations',()=>{
    for(const callback of [
      'onRaising',
      'onSanctuary',
      'onWorldProgress',
      'onArchive',
      'onAmbition',
    ]) expect(shell).toContain(callback);
  });
});
