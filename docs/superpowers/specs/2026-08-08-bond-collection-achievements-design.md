# Bond, Collection, and Achievements Design

## Goal

Turn the existing static quest/bond surfaces into a persistent long-term progression loop without adding new navigation tabs or currencies.

The loop becomes:

`train / choose dialogue → gain affection, mastery, skills, memories → relationship rank and achievements advance → claim rewards from existing quest panel → return to training with visible long-term progress`.

## Scope

### 1. Relationship ranks

Derive a relationship rank from the existing `stats.affection` value. Do not persist duplicate rank state.

- `acquaintance`: 0–39 — 낯선 사이
- `familiar`: 40–59 — 익숙한 사이
- `friend`: 60–74 — 친구
- `close_friend`: 75–89 — 가까운 친구
- `precious`: 90–100 — 소중한 사람

The layered-home dialogue should show the current relationship label naturally. The existing bond bottom-nav button remains the interaction entrypoint; it should pet Runa and open a compact relationship panel using the existing popup frame rather than introducing a new full screen.

### 2. Collection summary

Reuse existing memories and mastery-derived skills as the first collection categories.

Expose pure helpers:

- `relationshipRank(affection)`
- `unlockedSkills(state)` (already exists)
- `collectionProgress(state)` returning counts for memories, skills, and mastered activities.

No duplicate skill save state is introduced.

### 3. Achievement system

Add six achievement ids:

- `first_steps`: first training memory obtained — reward 150G
- `skill_beginner`: at least one skill unlocked — reward 200G
- `memory_keeper`: at least 3 memories collected — reward 250G
- `close_bond`: relationship reaches `close_friend` — reward 2 gems
- `mastery_specialist`: any activity reaches mastery Lv.4 — reward 400G
- `perfect_growth`: first PERFECT memory obtained — reward 3 gems

Achievement eligibility is derived from existing game state. Only claimed achievement ids are persisted.

Add `claimedAchievements: AchievementId[]` to `GameState` with safe hydration default `[]`.

Add reducer action:

```ts
{ type: 'CLAIM_ACHIEVEMENT'; achievement: AchievementId }
```

Claiming an ineligible or already claimed achievement is a no-op. A valid claim adds the id exactly once and grants its fixed reward.

### 4. Dynamic home panels

Replace static quest/bond content with state-driven panel data while preserving the existing panel frame and bottom navigation.

`quest` panel:
- show up to six achievements
- each row includes Korean title, condition status, and reward
- eligible unclaimed rows can be claimed
- claimed rows display 완료

`bond` panel:
- current relationship rank
- affection value
- memory count
- unlocked skill count
- highest mastery level

Other existing home panels remain unchanged.

### 5. Interaction behavior

The bond button should still trigger Runa's affectionate reaction immediately, then open the bond panel. This preserves the current tactile interaction while adding meaningful long-term information.

Quest reward claims must update the actual `GameState`, save through existing localStorage persistence, and immediately update gold/gems HUD values.

### 6. Memory expansion

Do not add a separate memory screen in this update. Existing memories remain the collection foundation. Add only two milestone memories where they support the new loop:

- `first_skill`: first mastery skill unlocked
- `close_bond`: first time relationship reaches `close_friend`

These are added once and participate in collection/achievement counts.

### 7. Compatibility and hydration

Legacy saves without `claimedAchievements` must hydrate with `[]`.
Unknown achievement ids are discarded.
Existing memories, mastery, personality, random event report fields, and monthly flow must remain compatible.

### 8. UI constraints

- No new permanent navigation tab.
- No new currency.
- No CSS-drawn decorative art; reuse existing image panel/button frames.
- Text, numbers, progress/status labels remain code-rendered.
- Do not require new background art for this update.
- Keep popup content readable on existing mobile layout.

## Testing

TDD coverage must include:

- relationship rank boundaries
- collection progress counts
- achievement eligibility
- valid claim reward
- duplicate claim no-op
- ineligible claim no-op
- legacy hydration default
- invalid achievement ids discarded
- first skill memory created once
- close bond memory created once
- monthly loop still returns to hub and can enter schedule again

## Success criteria

The player can now see that long-term training and dialogue choices accumulate into a relationship, collection, and reward track using the existing home UI. The system must make previous V2 features (mastery, skills, memories, affection) feel connected rather than isolated stats.