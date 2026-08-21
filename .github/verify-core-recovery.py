from pathlib import Path
import subprocess

PARENT = 'c8622851bf9476129ef83a75c76ddc836fecc41a'
TRUNCATED_CORE_BLOB = '4efdc3353a2685892538f859cb0f1710f081dde3'


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old in text:
        if text.count(old) != 1:
            raise AssertionError(f'{label}: expected one old form, found {text.count(old)}')
        file.write_text(text.replace(old, new, 1))
        return
    if new not in text:
        raise AssertionError(f'{label}: neither old nor verified new form found')


def restore_core() -> None:
    current = subprocess.run(
        ['git', 'rev-parse', 'HEAD:src/game-core.ts'],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    if current == TRUNCATED_CORE_BLOB:
        restored = subprocess.run(
            ['git', 'show', f'{PARENT}:src/game-core.ts'],
            check=True,
            capture_output=True,
            text=True,
        ).stdout
        old_screen = "export type Screen = 'hub' | 'schedule' | 'training' | 'dialogue' | 'result';"
        new_screen = "export type Screen = 'hub' | 'schedule' | 'training' | 'dialogue' | 'result' | 'event' | 'ending';"
        old_whitelist = "const screens: Screen[] = ['hub', 'schedule', 'training', 'dialogue', 'result'];"
        new_whitelist = "const screens: Screen[] = ['hub', 'schedule', 'training', 'dialogue', 'result', 'event', 'ending'];"
        assert restored.count(old_screen) == 1
        assert restored.count(old_whitelist) == 1
        restored = restored.replace(old_screen, new_screen, 1).replace(old_whitelist, new_whitelist, 1)
        Path('src/game-core.ts').write_text(restored)
    else:
        text = Path('src/game-core.ts').read_text()
        assert "'event' | 'ending'" in text
        assert "'result', 'event', 'ending'" in text
        for symbol in ('applyDialogueChoice', 'deriveCondition', 'pickRandomEvent', 'resultQuality', 'unlockedSkills', 'hydrateGameState', 'reducer'):
            assert f'function {symbol}' in text or f'function {symbol}(' in text, symbol
        assert 'export type Action =' in text


def patch_game_contract() -> None:
    replace_once(
        'src/game.ts',
        'export type GrowthReport = Partial<Base.GrowthReport> & {',
        'export type GrowthReport = Base.GrowthReport & {',
        'GrowthReport base contract',
    )


def patch_shared_raising_adapter() -> None:
    replace_once(
        'src/game-base.ts',
        "import {\n  eligibleStoryChapters,\n  storyChapterDefinitions,\n  storyChapterIds,\n  type StoryChapterId,\n} from './story-chapters';",
        "import {\n  coreStoryChapterIds,\n  eligibleStoryChapters,\n  storyChapterDefinitions,\n  storyChapterIds,\n  type StoryChapterId,\n} from './story-chapters';",
        'story core ids import',
    )
    replace_once(
        'src/game-base.ts',
        "export function currentStoryChapters(state: GameState): StoryChapterId[] {\n  return eligibleStoryChapters({\n    memories: state.memories,\n    visitedOutings: state.visitedOutings,\n    affection: state.stats.affection,\n    guardianRank: currentGuardianStatus(state).rank,\n    discoveries: state.discoveries.length,\n  });\n}",
        "export function currentStoryChapters(state: GameState): StoryChapterId[] {\n  return eligibleStoryChapters({\n    memories: state.memories,\n    visitedOutings: state.visitedOutings,\n    affection: state.stats.affection,\n    guardianRank: currentGuardianStatus(state).rank,\n    discoveries: state.discoveries.length,\n    expeditionStoryEntries: state.expeditionStoryEntries,\n    unlockedBondScenes: state.unlockedBondScenes,\n    activeCalling: state.activeCalling,\n  });\n}",
        'raising story adapter inputs',
    )
    replace_once(
        'src/game-base.ts',
        "export function currentCareerTitles(state: GameState): CareerTitleId[] {\n  return careerTitles({\n    records: state.careerRecords,\n    guardianRank: currentGuardianStatus(state).rank,\n    openedStories: currentStoryChapters(state).length,\n  });\n}",
        "export function currentCareerTitles(state: GameState): CareerTitleId[] {\n  const stories = currentStoryChapters(state);\n  const openedRaisingStories = stories.filter(id => coreStoryChapterIds.includes(id as (typeof coreStoryChapterIds)[number])).length;\n  return careerTitles({\n    records: state.careerRecords,\n    guardianRank: currentGuardianStatus(state).rank,\n    openedStories: stories.length,\n    openedRaisingStories,\n  });\n}",
        'career raising-story count',
    )
    replace_once(
        'src/game-base.ts',
        "function reconcileProgressRewards(previous: GameState, state: GameState): GameState {\n  const progressed = reconcileStoryRewards(reconcileGuardianRewards(state));\n  return reconcileBondRewards(previous, progressed);\n}",
        "function reconcileProgressRewards(previous: GameState, state: GameState): GameState {\n  const guarded = reconcileGuardianRewards(state);\n  const bonded = reconcileBondRewards(previous, guarded);\n  return reconcileStoryRewards(bonded);\n}",
        'Guardian Bond Story reward order',
    )


def patch_game_tests() -> None:
    replace_once(
        'src/game.test.ts',
        '    expect(next.gold).toBe(5470);',
        '    expect(next.gold).toBe(progressed.gold + 350);',
        'core month reward delta',
    )
    replace_once(
        'src/game.test.ts',
        "    const trained = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0 });\n    expect(trained.gold).toBe(initialState.gold + 220);",
        "    const baseline = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0.999 });\n    const trained = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0 });\n    expect(trained.gold).toBe(baseline.gold + 100);",
        'random-event isolated reward delta',
    )

    replace_once(
        'src/attendance-progression.test.ts',
        "    const claimed = reducer(initialState, { type:'CLAIM_ATTENDANCE' });\n    expect(claimed.claimedAttendanceMonths).toEqual([attendanceKey(1, 4)]);\n    expect(claimed.gold).toBe(initialState.gold + 150);\n    expect(claimed.gems).toBe(initialState.gems);",
        "    const ready = reducer(initialState, { type:'GO', screen:'hub' });\n    const claimed = reducer(ready, { type:'CLAIM_ATTENDANCE' });\n    expect(claimed.claimedAttendanceMonths).toEqual([attendanceKey(1, 4)]);\n    expect(claimed.gold).toBe(ready.gold + 150);\n    expect(claimed.gems).toBe(ready.gems);",
        'attendance isolated reward',
    )
    replace_once(
        'src/attendance-progression.test.ts',
        "    const june = { ...initialState, month:6 };\n    const claimed = reducer(june, { type:'CLAIM_ATTENDANCE' });\n    expect(claimed.gold).toBe(june.gold + 150);\n    expect(claimed.gems).toBe(june.gems + 1);",
        "    const june = reducer({ ...initialState, month:6 }, { type:'GO', screen:'hub' });\n    const claimed = reducer(june, { type:'CLAIM_ATTENDANCE' });\n    expect(claimed.gold).toBe(june.gold + 150);\n    expect(claimed.gems).toBe(june.gems + 1);",
        'quarterly attendance isolated reward',
    )

    replace_once(
        'src/mail-reward-progression.test.ts',
        "    const claimed = reducer(initialState, { type:'CLAIM_MAIL', mail:'welcome' });\n    expect(claimed.gold).toBe(initialState.gold + 300);",
        "    const ready = reducer(initialState, { type:'GO', screen:'hub' });\n    const claimed = reducer(ready, { type:'CLAIM_MAIL', mail:'welcome' });\n    expect(claimed.gold).toBe(ready.gold + 300);",
        'mail isolated reward',
    )

    replace_once(
        'src/expedition-progression.test.ts',
        "    const next = reducer(initialState, { type: 'FINISH_EXPEDITION_STAGE', stageId: 'forest_path', score: 700 } as any);\n    expect(next.expeditionRecords.forest_path.cleared).toBe(true);\n    expect(next.gold).toBe(initialState.gold + 150);",
        "    const ready = reducer(initialState, { type:'GO', screen:'hub' });\n    const next = reducer(ready, { type: 'FINISH_EXPEDITION_STAGE', stageId: 'forest_path', score: 700 } as any);\n    expect(next.expeditionRecords.forest_path.cleared).toBe(true);\n    expect(next.gold).toBe(ready.gold + 150);",
        'expedition isolated reward',
    )

    replace_once(
        'src/exploration-progression.test.ts',
        "    const result = reducer(initialState, { type: 'GO_OUTING', location: 'forest', eventRoll: 0 });\n    expect(result.explorationXp.forest).toBe(1);\n    expect(result.gold).toBe(initialState.gold + 150);",
        "    const ready = reducer(initialState, { type:'GO', screen:'hub' });\n    const result = reducer(ready, { type: 'GO_OUTING', location: 'forest', eventRoll: 0 });\n    expect(result.explorationXp.forest).toBe(1);\n    expect(result.gold).toBe(ready.gold + 150);",
        'exploration isolated reward',
    )

    replace_once(
        'src/calling-depth-progression.test.ts',
        "    const first = reducer(state, { type:'GO_OUTING', location:'forest', eventRoll:0.5 });\n    expect(first.gold).toBe(state.gold + 200); // favorite_place bond +100, Pathfinder Legend +100",
        "    const ready = reducer(state, { type:'GO', screen:'hub' });\n    const first = reducer(ready, { type:'GO_OUTING', location:'forest', eventRoll:0.5 });\n    expect(first.gold).toBe(ready.gold + 200); // favorite_place bond +100, Pathfinder Legend +100",
        'Pathfinder isolated reward',
    )

    replace_once(
        'src/progression.test.ts',
        "    const claimed = reducer(eligible, { type: 'CLAIM_ACHIEVEMENT', achievement: 'first_steps' });\n    expect(claimed.gold).toBe(initialState.gold + 150);",
        "    const ready = reducer(eligible, { type:'GO', screen:'hub' });\n    const claimed = reducer(ready, { type: 'CLAIM_ACHIEVEMENT', achievement: 'first_steps' });\n    expect(claimed.gold).toBe(ready.gold + 150);",
        'achievement isolated reward',
    )

    replace_once(
        'src/monthly-progression.test.ts',
        "    const first = reducer(initialState, { type:'FINISH_TRAINING', eventRoll:0.999 });\n    expect(first.monthlyCounters.trainings).toBe(1);\n    expect(first.gold).toBe(initialState.gold + 120);",
        "    const ready = reducer(initialState, { type:'GO', screen:'hub' });\n    const first = reducer(ready, { type:'FINISH_TRAINING', eventRoll:0.999 });\n    expect(first.monthlyCounters.trainings).toBe(1);\n    expect(first.gold).toBe(ready.gold + 120);",
        'monthly training isolated reward',
    )
    replace_once(
        'src/monthly-progression.test.ts',
        "    const first = reducer(initialState, { type:'GO_OUTING', location:'forest', eventRoll:0.999 });\n    expect(first.monthlyCounters.outings).toBe(1);\n    expect(first.gems).toBe(initialState.gems + 1);",
        "    const ready = reducer({ ...initialState, memories:['first_training'] as typeof initialState.memories }, { type:'GO', screen:'hub' });\n    const first = reducer(ready, { type:'GO_OUTING', location:'forest', eventRoll:0.999 });\n    expect(first.monthlyCounters.outings).toBe(1);\n    expect(first.gems).toBe(ready.gems + 1);",
        'monthly outing story prerequisite',
    )
    replace_once(
        'src/monthly-progression.test.ts',
        "    const gifted = reducer(initialState, { type:'GIVE_GIFT', item:'star_cookie' });\n    expect(gifted.monthlyCounters.gifts).toBe(1);\n    expect(gifted.gold).toBe(initialState.gold + 250);",
        "    const ready = reducer(initialState, { type:'GO', screen:'hub' });\n    const gifted = reducer(ready, { type:'GIVE_GIFT', item:'star_cookie' });\n    expect(gifted.monthlyCounters.gifts).toBe(1);\n    expect(gifted.gold).toBe(ready.gold + 250);",
        'monthly gift isolated reward',
    )

    replace_once(
        'src/guardian-rank-progression.test.ts',
        "      inventory: { ...initialState.inventory, star_cookie: 1 },\n    };",
        "      inventory: { ...initialState.inventory, star_cookie: 1 },\n      visitedOutings: ['forest','village','lakeside'] as typeof initialState.visitedOutings,\n      rewardedStoryChapters: ['first_step','wide_world'] as typeof initialState.rewardedStoryChapters,\n    };",
        'guardian near-rank story prerequisites',
    )
    replace_once(
        'src/guardian-rank-progression.test.ts',
        "      mastery: { hunt:{xp:18}, magic:{xp:18}, rest:{xp:18}, herb:{xp:18} },\n    };",
        "      mastery: { hunt:{xp:18}, magic:{xp:18}, rest:{xp:18}, herb:{xp:18} },\n      visitedOutings: ['forest','village','lakeside'] as typeof initialState.visitedOutings,\n      unlockedBondScenes: ['shared_secret'] as typeof initialState.unlockedBondScenes,\n      activeCalling: 'caretaker' as const,\n    };",
        'guardian advanced story prerequisites',
    )
    replace_once(
        'src/guardian-rank-progression.test.ts',
        '    expect(reconciled.gems).toBe(initialState.gems + 8);',
        '    expect(reconciled.gems).toBe(initialState.gems + 10);',
        'guardian catch-up reward total',
    )

    replace_once(
        'src/story-progression.test.ts',
        "      mastery: { hunt: { xp: 18 }, magic: { xp: 18 }, rest: { xp: 18 }, herb: { xp: 18 } },\n      rewardedGuardianRanks: ['junior', 'guardian', 'veteran'] as typeof initialState.rewardedGuardianRanks,\n      rewardedStoryChapters: ['first_step', 'trusted_bond', 'guardian_oath'] as typeof initialState.rewardedStoryChapters,",
        "      mastery: { hunt: { xp: 18 }, magic: { xp: 18 }, rest: { xp: 18 }, herb: { xp: 18 } },\n      visitedOutings: ['forest','village','lakeside'] as typeof initialState.visitedOutings,\n      unlockedBondScenes: ['shared_secret'] as typeof initialState.unlockedBondScenes,\n      activeCalling: 'pathfinder' as const,\n      rewardedGuardianRanks: ['junior', 'guardian', 'veteran'] as typeof initialState.rewardedGuardianRanks,\n      rewardedStoryChapters: ['first_step', 'wide_world', 'trusted_bond', 'guardian_oath'] as typeof initialState.rewardedStoryChapters,",
        'final story canonical prerequisites',
    )

    replace_once(
        'src/career-progression.test.ts',
        "      visitedOutings:['forest','village','lakeside'] as typeof initialState.visitedOutings,\n      rewardedStoryChapters:['first_step','wide_world','trusted_bond','guardian_oath'] as typeof initialState.rewardedStoryChapters,",
        "      visitedOutings:['forest','village','lakeside'] as typeof initialState.visitedOutings,\n      unlockedBondScenes:['shared_secret'] as typeof initialState.unlockedBondScenes,\n      activeCalling:'caretaker' as const,\n      rewardedStoryChapters:['first_step','wide_world','trusted_bond','guardian_oath'] as typeof initialState.rewardedStoryChapters,",
        'career canonical raising-story prerequisites',
    )


restore_core()
patch_game_contract()
patch_shared_raising_adapter()
patch_game_tests()
