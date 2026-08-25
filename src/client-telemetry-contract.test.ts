import {describe,expect,it} from 'vitest';
import {parseClientTelemetryPayload} from './client-telemetry-contract';

describe('parseClientTelemetryPayload',()=>{
  it('accepts an allowlisted semantic fault payload',()=>{
    expect(parseClientTelemetryPayload({kind:'render_error',phase:'error_boundary',path:'/'})).toEqual({
      kind:'render_error',phase:'error_boundary',path:'/'
    });
  });

  it('accepts an allowlisted finite performance metric',()=>{
    expect(parseClientTelemetryPayload({kind:'client_perf',phase:'navigation',path:'/',metric:'load_ms',value:1234})).toEqual({
      kind:'client_perf',phase:'navigation',path:'/',metric:'load_ms',value:1234
    });
  });

  it('rejects query strings and arbitrary extra fields',()=>{
    expect(parseClientTelemetryPayload({kind:'render_error',phase:'error_boundary',path:'/?secret=x'})).toBeNull();
    expect(parseClientTelemetryPayload({kind:'render_error',phase:'error_boundary',path:'/',message:'private'})).toBeNull();
  });

  it('rejects unsupported or non-finite performance metrics',()=>{
    expect(parseClientTelemetryPayload({kind:'client_perf',phase:'navigation',path:'/',metric:'other',value:5})).toBeNull();
    expect(parseClientTelemetryPayload({kind:'client_perf',phase:'navigation',path:'/',metric:'load_ms',value:Infinity})).toBeNull();
  });
});
