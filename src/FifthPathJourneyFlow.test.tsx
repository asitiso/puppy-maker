import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FifthPathJourneyFlow from './FifthPathJourneyFlow';

const STORAGE_KEY = 'puppy-maker:fifth-path-journey:v1';

function clickButton(container: HTMLElement, label: string) {
  const button = [...container.querySelectorAll('button')].find(item => item.textContent?.includes(label));
  expect(button, `button containing ${label}`).toBeTruthy();
  act(() => button!.click());
}

describe('FifthPathJourneyFlow integration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('runs the playable journey and persists the real winter outcome', () => {
    const root = createRoot(container);
    act(() => root.render(<FifthPathJourneyFlow winterOutcome="costly_victory" worldSignals={['세계 신호']} bondSignals={['유대 신호']} />));

    clickButton(container, 'Journey 열기');
    clickButton(container, '이 가능성을 선택한다');
    clickButton(container, '신호를 따라간다');
    clickButton(container, '정답을 반복하지 않고 새로운 합의를 만든다');
    clickButton(container, '긴 밤과 마주한다');

    expect(container.textContent).toContain('True Ending');
    clickButton(container, '기억을 다음 봄으로 가져간다');

    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.stage).toBe('true_ending');
    expect(saved.winterOutcome).toBe('costly_victory');
    expect(saved.completed).toBe(true);
    expect(saved.choices).toEqual(['true_path', 'follow_the_signal', 'rewrite_the_pattern', 'face_the_long_night', 'carry_the_memory']);
    act(() => root.unmount());
  });

  it('restores an unfinished journey instead of replaying completed choices', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      stage: 'autumn',
      selected: true,
      choices: ['true_path', 'follow_the_signal'],
      winterOutcome: null,
      completed: false,
    }));

    const root = createRoot(container);
    act(() => root.render(<FifthPathJourneyFlow winterOutcome="victory" worldSignals={[]} bondSignals={[]} />));
    clickButton(container, 'Journey 열기');

    expect(container.textContent).toContain('Autumn');
    expect(container.textContent).toContain('정답을 반복하지 않고 새로운 합의를 만든다');
    expect(container.textContent).not.toContain('신호를 따라간다');
    act(() => root.unmount());
  });

  it('recovers from corrupt storage and starts from Spring', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, stage: 'winter', selected: true, choices: [], winterOutcome: 'victory', completed: true }));
    const root = createRoot(container);
    act(() => root.render(<FifthPathJourneyFlow winterOutcome="victory" worldSignals={[]} bondSignals={[]} />));
    clickButton(container, 'Journey 열기');

    expect(container.textContent).toContain('이 가능성을 선택한다');
    expect(container.textContent).not.toContain('긴 밤과 마주한다');
    act(() => root.unmount());
  });
});
