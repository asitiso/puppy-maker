import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function memoryStorage() {
  const values = new Map<string,string>();
  return {
    get length(){ return values.size; },
    clear(){ values.clear(); },
    getItem(key:string){ return values.get(key) ?? null; },
    key(index:number){ return [...values.keys()][index] ?? null; },
    removeItem(key:string){ values.delete(key); },
    setItem(key:string,value:string){ values.set(key,String(value)); },
  } as Storage;
}

describe('App home rendering', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));

  it('renders the standalone hub with the core raising destinations', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('hub-screen');
    expect(html).toContain('스케줄');
    expect(html).toContain('가방');
    expect(html).toContain('퀘스트');
    expect(html).toContain('외출');
    expect(html).toContain('교감');
  });

  it('renders the current Runa presentation and essential resources', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('/assets/home/runa_idle_layer.png');
    expect(html).toContain('5,000');
    expect(html).toContain('220');
  });
});
