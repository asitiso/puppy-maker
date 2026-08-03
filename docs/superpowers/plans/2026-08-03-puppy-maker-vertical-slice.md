# Puppy Maker Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 레퍼런스 화면의 고급 애니메이션 게임 UI 밀도를 살리면서 메인 로비 → 4주 스케줄 → 훈련 미니게임 → 대화 선택 → 월말 정산이 실제로 이어지는 모바일 세로형 웹 게임을 만든다.

**Architecture:** React + TypeScript + Vite 단일 페이지 앱으로 구현한다. 게임 상태는 Context + reducer로 관리하고, 각 화면은 독립 컴포넌트로 분리한다. 배경과 캐릭터는 초기 버전에서 CSS/SVG 기반으로 구성하되, 추후 생성 에셋을 교체하기 쉽도록 장식 레이어와 콘텐츠 레이어를 분리한다.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, CSS Modules 없이 전역 디자인 토큰 기반 CSS

## Global Constraints

- 모바일 세로 9:16 우선, 데스크톱에서는 중앙 고정형 게임 캔버스로 표시한다.
- 첫 구현 범위는 메인 로비, 4주 스케줄, 훈련 미니게임, 대화 선택, 월말 정산이다.
- 임시 이모지 중심 UI를 금지하고, SVG 아이콘·장식 프레임·광원·입자·모션으로 게임 전용 UI를 구성한다.
- 캐릭터가 시각적 중심이며 HUD는 가장자리로 정리한다.
- 모든 상태 변경은 reducer를 통해 처리하고 로컬 저장소에 자동 저장한다.
- `npm run test`와 `npm run build`가 모두 통과해야 한다.

---

### Task 1: 프로젝트 기반과 게임 상태 엔진

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/game/types.ts`
- Create: `src/game/state.tsx`
- Test: `src/game/state.test.ts`

**Interfaces:**
- Produces: `GameState`, `GameAction`, `gameReducer`, `GameProvider`, `useGame`

- [ ] 상태 변화 테스트를 작성한다.
- [ ] 테스트가 실패하는지 확인한다.
- [ ] 월/주차, 재화, 능력치, 스케줄, 화면 전환 reducer를 구현한다.
- [ ] 테스트 통과를 확인한다.
- [ ] 커밋한다.

### Task 2: 공통 디자인 시스템과 게임 셸

**Files:**
- Create: `src/styles.css`
- Create: `src/App.tsx`
- Create: `src/components/GameShell.tsx`
- Create: `src/components/OrnateFrame.tsx`
- Create: `src/components/Icon.tsx`

**Interfaces:**
- Consumes: `useGame`
- Produces: 9:16 캔버스, 장식 프레임, 공통 버튼과 HUD 토큰

- [ ] 9:16 캔버스와 반응형 규칙을 구현한다.
- [ ] 금속·유리·보석 느낌의 장식 프레임과 버튼을 구현한다.
- [ ] 화면 라우팅 셸을 구현한다.
- [ ] 빌드를 확인한다.
- [ ] 커밋한다.

### Task 3: 메인 로비 화면

**Files:**
- Create: `src/screens/MainHubScreen.tsx`
- Create: `src/components/PetAvatar.tsx`
- Create: `src/components/TopHud.tsx`
- Create: `src/components/BottomNav.tsx`

**Interfaces:**
- Produces: 로비에서 스케줄 화면으로 이동, 캐릭터 교감 반응

- [ ] 오두막 배경 레이어를 구현한다.
- [ ] 캐릭터 호흡·귀 움직임·광원 반응 애니메이션을 구현한다.
- [ ] 상단 재화·달력 HUD와 하단 메뉴를 구현한다.
- [ ] 스케줄 버튼 연결을 확인한다.
- [ ] 커밋한다.

### Task 4: 4주 스케줄 다이어리

**Files:**
- Create: `src/screens/ScheduleScreen.tsx`
- Create: `src/game/activities.ts`
- Test: `src/game/activities.test.ts`

**Interfaces:**
- Consumes: `setSchedule`, `startSchedule`
- Produces: 4개 주차 활동 선택과 실행 시작

- [ ] 활동 데이터와 능력치 효과 테스트를 작성한다.
- [ ] 가죽 다이어리 레이아웃과 활동 카드 선택을 구현한다.
- [ ] 자동 배치·초기화·일정 시작을 구현한다.
- [ ] 테스트와 빌드를 확인한다.
- [ ] 커밋한다.

### Task 5: 훈련 미니게임

**Files:**
- Create: `src/screens/TrainingScreen.tsx`
- Create: `src/game/training.ts`
- Test: `src/game/training.test.ts`

**Interfaces:**
- Produces: 공격·회피·기 모으기 입력, 콤보, 등급, 능력치 보상

- [ ] 타이밍 판정과 등급 계산 테스트를 작성한다.
- [ ] 움직이는 판정 링과 공격 패턴을 구현한다.
- [ ] 세 액션 버튼, 콤보, 피로도, 결과 연출을 구현한다.
- [ ] 결과를 대화 화면으로 전달한다.
- [ ] 커밋한다.

### Task 6: 대화 선택과 월말 정산

**Files:**
- Create: `src/screens/DialogueScreen.tsx`
- Create: `src/screens/MonthResultScreen.tsx`
- Create: `src/game/dialogue.ts`
- Test: `src/game/dialogue.test.ts`

**Interfaces:**
- Produces: 선택지별 호감도·스트레스·도덕성 변화, 다음 달 진행

- [ ] 선택지 효과 테스트를 작성한다.
- [ ] 비주얼 노벨 대화 상자와 3개 선택지를 구현한다.
- [ ] 월말 능력치 변화와 보상 요약을 구현한다.
- [ ] 다음 달 버튼으로 로비에 복귀하도록 연결한다.
- [ ] 커밋한다.

### Task 7: 저장, 접근성, 최종 검증

**Files:**
- Modify: `src/game/state.tsx`
- Create: `README.md`

**Interfaces:**
- Produces: localStorage 자동 저장·복원, 실행 안내

- [ ] 저장·복원 테스트를 추가한다.
- [ ] 주요 버튼에 접근성 레이블과 키보드 포커스를 적용한다.
- [ ] `npm run test`를 실행한다.
- [ ] `npm run build`를 실행한다.
- [ ] 최종 커밋 후 PR을 생성한다.
