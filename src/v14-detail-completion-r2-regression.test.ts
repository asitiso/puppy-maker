import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const tactical=readFileSync(new URL('./TacticalBattleScreen.tsx',import.meta.url),'utf8');

describe('V14 Detail Completion R2 — tactical guided play',()=>{
  it('exposes active and selected tactical state semantically',()=>{
    expect(tactical).toContain('aria-pressed={auto}');
    expect(tactical).toContain("aria-current={id===v.activeActorId?'true':undefined}");
    expect(tactical).toContain('aria-pressed={selectedUltimate===ultimate.companionId}');
    expect(tactical).toContain('aria-pressed={selectedAction===id}');
  });

  it('presents battle results as a modal with Korean next actions',()=>{
    expect(tactical).toContain('className="tactical-result" role="dialog" aria-modal="true" aria-label="전투 결과"');
    expect(tactical).toContain("continuationLabel={onExit?'홈으로 돌아가기':'다시 도전'}");
    expect(tactical).toContain('>다시 도전</button>');
    expect(tactical).not.toContain("continuationLabel={onExit?'EXIT':'RETRY'}");
    expect(tactical).not.toContain('>RETRY</button>');
  });

  it('keeps the existing exit and retry callback behavior unchanged',()=>{
    expect(tactical).toContain('onContinue={onExit??onRetry!}');
    expect(tactical).toContain('onExit&&onRetry?<button');
    expect(tactical).toContain('onClick={onRetry}');
  });
});
