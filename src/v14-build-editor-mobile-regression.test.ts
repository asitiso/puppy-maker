// @ts-ignore -- Vitest source-contract test reads app sources in Node.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const editorSource=readFileSync(new URL('./V12BuildEditor.tsx',import.meta.url),'utf8');
const editorCss=readFileSync(new URL('./v12-build-editor.css',import.meta.url),'utf8');
const routerCss=readFileSync(new URL('./mobile-router-v8.css',import.meta.url),'utf8');
const expeditionCss=readFileSync(new URL('./tactical-expedition-flow.css',import.meta.url),'utf8');

describe('V14 build editor mobile regression guard',()=>{
  it('escapes route stacking contexts so global chrome cannot cover the editor',()=>{
    expect(editorSource).toContain('createPortal');
    expect(editorSource).toContain('document.body');
  });

  it('provides a clear local back action and one dedicated scroll body',()=>{
    expect(editorSource).toContain("from './V14OverlayBackButton'");
    expect(editorSource).toContain('ariaLabel="편성 화면으로 돌아가기"');
    expect(editorSource).toContain('v12-build-editor__body');
    expect(editorCss).toMatch(/\.v12-build-editor__body\{[^}]*overflow-y:auto/);
    expect(editorCss).toMatch(/\.v12-build-editor\{[^}]*overflow:hidden/);
  });

  it('uses an opaque adventure-themed editor surface instead of inheriting translucent page panels',()=>{
    expect(editorCss).not.toContain('background:var(--panel-bg');
    expect(editorCss).toContain('--v12-editor-surface:');
    expect(editorCss).toContain('--v12-editor-accent:');
  });

  it('keeps expedition start controls above the persistent bottom navigation',()=>{
    expect(routerCss).toContain('--v8-bottom-nav-reserve:');
    expect(expeditionCss).toContain('var(--v8-bottom-nav-reserve');
    expect(expeditionCss).toMatch(/\.tactical-start\{[^}]*min-height:52px/);
  });
});
