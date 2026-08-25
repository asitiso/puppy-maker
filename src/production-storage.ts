import { initialState, type GameState } from './game';
import { loadResilientSave, repairPrimarySave, writeResilientSave, type SaveStorage } from './save-resilience';
import { readAmbitionSelections } from './yearly-ambition-selection';

export type ProductionStorageReporter = (kind: 'save_error', phase: 'load' | 'write') => void;

const legacyAmbitionKey = 'puppy-maker-yearly-ambitions';

export function loadProductionState(storage: SaveStorage, report: ProductionStorageReporter): GameState {
  let hydrated: GameState;
  try {
    const loaded = loadResilientSave(storage);
    hydrated = loaded.state;
    if (loaded.recovered) {
      try {
        repairPrimarySave(storage, loaded);
      } catch {
        report('save_error', 'write');
      }
    }
  } catch {
    report('save_error', 'load');
    return initialState;
  }

  let legacyRaw: string | null;
  try {
    legacyRaw = storage.getItem(legacyAmbitionKey);
  } catch {
    report('save_error', 'load');
    return hydrated;
  }

  try {
    const legacyAmbitions = readAmbitionSelections(JSON.parse(legacyRaw || '{}'));
    return { ...hydrated, yearlyAmbitions: { ...legacyAmbitions, ...hydrated.yearlyAmbitions } };
  } catch {
    return hydrated;
  }
}

export function writeProductionState(storage: SaveStorage, state: GameState, report: ProductionStorageReporter): void {
  try {
    writeResilientSave(storage, state);
    storage.removeItem(legacyAmbitionKey);
  } catch {
    report('save_error', 'write');
  }
}
