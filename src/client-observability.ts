import {
  parseClientTelemetryPayload,
  type ClientPerfMetric,
  type ClientTelemetryKind,
  type ClientTelemetryPayload,
  type ClientTelemetryPhase,
} from './client-telemetry-contract';

type PerformanceEntryLike = {
  name?: string;
  startTime?: number;
  domContentLoadedEventEnd?: number;
  loadEventEnd?: number;
};

export type PerformanceLike = {
  getEntriesByType: (type: string) => PerformanceEntryLike[];
};

type TelemetrySender = (payload: ClientTelemetryPayload) => void | Promise<void>;

export type PerformanceTelemetrySample = {
  phase: 'navigation' | 'paint';
  metric: ClientPerfMetric;
  value: number;
};

function isBoundedMetric(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 120000;
}

export function collectPerformanceTelemetry(performanceLike: PerformanceLike): PerformanceTelemetrySample[] {
  const samples: PerformanceTelemetrySample[] = [];
  const navigation = performanceLike.getEntriesByType('navigation')[0];
  if (navigation) {
    if (isBoundedMetric(navigation.domContentLoadedEventEnd)) {
      samples.push({ phase: 'navigation', metric: 'dom_content_loaded_ms', value: navigation.domContentLoadedEventEnd });
    }
    if (isBoundedMetric(navigation.loadEventEnd)) {
      samples.push({ phase: 'navigation', metric: 'load_ms', value: navigation.loadEventEnd });
    }
  }

  for (const entry of performanceLike.getEntriesByType('paint')) {
    if (entry.name !== 'first-contentful-paint' || !isBoundedMetric(entry.startTime)) continue;
    samples.push({ phase: 'paint', metric: 'first_contentful_paint_ms', value: entry.startTime });
    break;
  }
  return samples;
}

export function createClientTelemetryReporter(sender: TelemetrySender, getPath: () => string) {
  const seenFaults = new Set<string>();
  return (
    kind: ClientTelemetryKind,
    phase: ClientTelemetryPhase,
    metric?: ClientPerfMetric,
    value?: number,
  ): void => {
    const candidate = {
      kind,
      phase,
      path: getPath(),
      ...(metric === undefined ? {} : { metric }),
      ...(value === undefined ? {} : { value }),
    };
    const payload = parseClientTelemetryPayload(candidate);
    if (!payload) return;

    if (kind !== 'client_perf') {
      const key = `${kind}:${phase}`;
      if (seenFaults.has(key)) return;
      seenFaults.add(key);
    }

    try {
      const pending = sender(payload);
      if (pending && typeof (pending as Promise<void>).catch === 'function') {
        void (pending as Promise<void>).catch(() => undefined);
      }
    } catch {
      // Telemetry is best-effort and must never affect gameplay.
    }
  };
}

const browserSender: TelemetrySender = async (payload) => {
  if (typeof fetch !== 'function') return;
  await fetch('/api/client-telemetry', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: 'omit',
  });
};

const sharedReporter = createClientTelemetryReporter(
  typeof window === 'undefined' ? () => undefined : browserSender,
  () => (typeof window === 'undefined' ? '/' : window.location.pathname),
);

export function reportClientTelemetry(
  kind: ClientTelemetryKind,
  phase: ClientTelemetryPhase,
  metric?: ClientPerfMetric,
  value?: number,
): void {
  sharedReporter(kind, phase, metric, value);
}

let installed = false;

export function installClientObservability(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', () => reportClientTelemetry('window_error', 'window'));
  window.addEventListener('unhandledrejection', () => reportClientTelemetry('unhandled_rejection', 'unhandled_rejection'));

  const sendPerformance = () => {
    if (typeof performance === 'undefined') return;
    for (const sample of collectPerformanceTelemetry(performance as unknown as PerformanceLike)) {
      reportClientTelemetry('client_perf', sample.phase, sample.metric, sample.value);
    }
  };

  if (document.readyState === 'complete') queueMicrotask(sendPerformance);
  else window.addEventListener('load', sendPerformance, { once: true });
}
