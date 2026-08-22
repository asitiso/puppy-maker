import { uniqueRegistered } from './v3-state-sanitize';
import {
  hydrateWorldHistoryState,
  worldFactIds,
  type WorldFactId,
  type WorldHistoryState,
} from './world-history';

export function sanitizeWorldFactIds(raw: unknown): WorldFactId[] {
  return uniqueRegistered(raw, worldFactIds);
}

export function sanitizeCampaignWorldFacts(raw: unknown): WorldHistoryState {
  return hydrateWorldHistoryState(raw);
}
