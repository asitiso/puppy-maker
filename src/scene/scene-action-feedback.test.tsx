import {act,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import SceneStage from './SceneStage';
import {sceneActionFeedback} from './scene-action-feedback';
import {resolveScene} from './scene-resolver';
import type {ResolvedSceneInteraction} from './scene-types';

const restInteraction={
  id:'bed',
  label:'잠깐 쉬기',
  mode:'rest',
  anchorId:'bed',
  enabled:true,
  hint:'accessible-idle',
} satisfies ResolvedSceneInteraction;

afterEach(()=>{
  vi.useRealTimers();
});

describe('V14 scene action feedback',()=>{
  it('turns runtime phases into concise progress and result copy without game-state coupling',()=>{
    expect(sceneActionFeedback(restInteraction,'idle')).toBeNull();
    expect(sceneActionFeedback(restInteraction,'approaching')).toEqual({
      message:'잠깐 쉬기 · 이동 중',
      tone:'info',
      busy:true,
    });
    expect(sceneActionFeedback(restInteraction,'committing')).toEqual({
      message:'잠깐 쉬기 · 반영 중',
      tone:'info',
      busy:true,
    });
    expect(sceneActionFeedback(restInteraction,'presenting')).toEqual({
      message:'잠깐 쉬기 · 휴식 선택을 확인했어요.',
      tone:'success',
      busy:false,
    });
  });

  it('shows the active action as an accessible live status through the shared SceneStage',()=>{
    vi.useFakeTimers();
    const onInteraction=vi.fn();
    const scene=resolveScene({year:1,month:4,week:1,location:'home'});
    render(<SceneStage scene={scene} onInteraction={onInteraction}/>);

    fireEvent.click(screen.getByRole('button',{name:'잠깐 쉬기'}));
    expect(screen.getByRole('status')).toHaveTextContent('잠깐 쉬기 · 이동 중');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live','polite');
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true');

    act(()=>vi.advanceTimersByTime(220));
    expect(screen.getByRole('status')).toHaveTextContent('잠깐 쉬기 · 진행 중');

    act(()=>vi.advanceTimersByTime(180));
    expect(onInteraction).toHaveBeenCalledTimes(1);

    act(()=>vi.advanceTimersByTime(40));
    expect(screen.getByRole('status')).toHaveTextContent('잠깐 쉬기 · 휴식 선택을 확인했어요.');
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy','false');
  });
});
