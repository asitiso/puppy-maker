import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const css=readFileSync(new URL('./scene-interaction.css',import.meta.url),'utf8');
const stageSource=readFileSync(new URL('./SceneStage.tsx',import.meta.url),'utf8');

describe('V14 scene interaction environmental affordance styles',()=>{
  it('loads the dedicated interaction presentation layer after shared scene styles',()=>{
    expect(stageSource).toContain("import './scene-interaction.css';");
    expect(css).toContain('.v14-scene-object__marker');
    expect(css).toContain('.v14-scene-object__label');
    expect(css).toContain('.v14-scene-object__badge');
  });

  it('draws a distinct marker for every interaction icon token',()=>{
    for(const token of ['speech','inspect','collect','travel','rest','shop','target','choice','spark','compass','battle','reward']){
      expect(css).toContain(`data-icon-token="${token}"`);
    }
  });

  it('keeps required, new, recommended, disabled and keyboard focus states visually distinct',()=>{
    for(const emphasis of ['required','new','recommended','disabled']){
      expect(css).toContain(`data-emphasis="${emphasis}"`);
    }
    expect(css).toContain(':focus-visible');
  });

  it('keeps scene material identity and compact mobile targets',()=>{
    expect(css).toContain('data-interaction-skin="rune-socket"');
    expect(css).toContain('data-interaction-skin="botany-tag"');
    expect(css).toContain('data-interaction-skin="street-sign"');
    expect(css).toContain('min-width:44px');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-height:640px)');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  });
});
