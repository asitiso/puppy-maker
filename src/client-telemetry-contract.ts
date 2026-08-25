export type ClientTelemetryKind = 'render_error'|'window_error'|'unhandled_rejection'|'save_error'|'client_perf';
export type ClientTelemetryPhase = 'error_boundary'|'window'|'unhandled_rejection'|'load'|'write'|'navigation'|'paint';
export type ClientPerfMetric = 'dom_content_loaded_ms'|'load_ms'|'first_contentful_paint_ms';

export type ClientTelemetryPayload = {
  kind:ClientTelemetryKind;
  phase:ClientTelemetryPhase;
  path:string;
  metric?:ClientPerfMetric;
  value?:number;
};

const kinds = new Set<ClientTelemetryKind>(['render_error','window_error','unhandled_rejection','save_error','client_perf']);
const phases = new Set<ClientTelemetryPhase>(['error_boundary','window','unhandled_rejection','load','write','navigation','paint']);
const metrics = new Set<ClientPerfMetric>(['dom_content_loaded_ms','load_ms','first_contentful_paint_ms']);
const faultPhases:Record<Exclude<ClientTelemetryKind,'client_perf'>,ReadonlySet<ClientTelemetryPhase>> = {
  render_error:new Set(['error_boundary']),
  window_error:new Set(['window']),
  unhandled_rejection:new Set(['unhandled_rejection']),
  save_error:new Set(['load','write']),
};
const perfPhases = new Set<ClientTelemetryPhase>(['navigation','paint']);
const allowedKeys = new Set(['kind','phase','path','metric','value']);

function isRecord(value:unknown): value is Record<string,unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafePath(value:unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 120
    && value.startsWith('/')
    && !value.includes('?')
    && !value.includes('#')
    && !/[\u0000-\u001f\u007f]/.test(value);
}

export function parseClientTelemetryPayload(input:unknown):ClientTelemetryPayload|null {
  if (!isRecord(input)) return null;
  if (Object.keys(input).some((key)=>!allowedKeys.has(key))) return null;

  const {kind,phase,path,metric,value} = input;
  if (typeof kind !== 'string' || !kinds.has(kind as ClientTelemetryKind)) return null;
  if (typeof phase !== 'string' || !phases.has(phase as ClientTelemetryPhase)) return null;
  if (!isSafePath(path)) return null;

  const typedKind = kind as ClientTelemetryKind;
  const typedPhase = phase as ClientTelemetryPhase;

  if (typedKind === 'client_perf') {
    if (!perfPhases.has(typedPhase)) return null;
    if (typeof metric !== 'string' || !metrics.has(metric as ClientPerfMetric)) return null;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 120000) return null;
    return {kind:typedKind,phase:typedPhase,path,metric:metric as ClientPerfMetric,value};
  }

  if (!faultPhases[typedKind].has(typedPhase)) return null;
  if (metric !== undefined || value !== undefined) return null;
  return {kind:typedKind,phase:typedPhase,path};
}
