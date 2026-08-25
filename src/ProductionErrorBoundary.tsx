import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientTelemetry } from './client-observability';

export function ProductionErrorFallback({ onReload }: { onReload: () => void }) {
  return <main className="production-error-screen" role="alert" aria-live="assertive">
    <section className="production-error-card">
      <p className="production-error-kicker">복구 모드</p>
      <h1>화면을 불러오지 못했습니다</h1>
      <p>저장 데이터는 자동으로 삭제되지 않습니다. 앱을 다시 불러와 현재 상태를 복구해 주세요.</p>
      <button type="button" onClick={onReload}>다시 불러오기</button>
    </section>
  </main>;
}

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ProductionErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    reportClientTelemetry('render_error', 'error_boundary');
  }

  render() {
    if (this.state.failed) {
      return <ProductionErrorFallback onReload={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}

export default ProductionErrorBoundary;
