import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {ProductionErrorFallback} from './ProductionErrorBoundary';

describe('ProductionErrorFallback',()=>{
  it('offers an accessible non-destructive recovery action',()=>{
    const html=renderToStaticMarkup(<ProductionErrorFallback onReload={()=>undefined}/>);
    expect(html).toContain('role="alert"');
    expect(html).toContain('화면을 불러오지 못했습니다');
    expect(html).toContain('저장 데이터는 자동으로 삭제되지 않습니다');
    expect(html).toContain('다시 불러오기');
    expect(html).toContain('production-error-screen');
  });
});
