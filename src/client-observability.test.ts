import {describe,expect,it,vi} from 'vitest';
import {collectPerformanceTelemetry,createClientTelemetryReporter} from './client-observability';

describe('client observability',()=>{
  it('collects only bounded navigation and first-contentful-paint metrics',()=>{
    const performanceLike={
      getEntriesByType(type:string){
        if(type==='navigation') return [{startTime:0,domContentLoadedEventEnd:320,loadEventEnd:480}];
        if(type==='paint') return [
          {name:'first-paint',startTime:90},
          {name:'first-contentful-paint',startTime:140},
          {name:'first-contentful-paint',startTime:Infinity},
        ];
        return [];
      },
    };
    expect(collectPerformanceTelemetry(performanceLike)).toEqual([
      {phase:'navigation',metric:'dom_content_loaded_ms',value:320},
      {phase:'navigation',metric:'load_ms',value:480},
      {phase:'paint',metric:'first_contentful_paint_ms',value:140},
    ]);
  });

  it('deduplicates semantic fault events without forwarding error details',()=>{
    const sender=vi.fn();
    const report=createClientTelemetryReporter(sender,()=>'/play');
    report('window_error','window');
    report('window_error','window');
    report('unhandled_rejection','unhandled_rejection');
    expect(sender).toHaveBeenCalledTimes(2);
    expect(sender.mock.calls[0][0]).toEqual({kind:'window_error',phase:'window',path:'/play'});
    expect(JSON.stringify(sender.mock.calls)).not.toContain('message');
    expect(JSON.stringify(sender.mock.calls)).not.toContain('stack');
  });
});
