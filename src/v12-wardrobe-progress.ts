import { unlockedWardrobe, type WardrobeProgress } from './game/wardrobe'

export type V12WardrobeProgressState = {
  monthsCompleted?: number
  careerRecords?: { monthsCompleted?: number }
  expeditionRecords?: Record<string,{ cleared?: boolean }>
  endingCollection?: readonly string[]
  discoveredDestinations?: readonly string[]
  huntChallengeClears?: readonly string[]
}

const expeditionWardrobeBridge: Record<string,string> = {
  forest_path:'forest_path',
  forest_glade:'brook_bridge',
  forest_guardian:'old_shrine',
  city_square:'village_market',
  city_gallery:'crystal_cave',
  lake_channel:'moon_garden',
  lake_cliff:'sunset_meadow',
}

function uniqueStrings(values:readonly unknown[]):string[]{
  return [...new Set(values.filter((value):value is string=>typeof value==='string'&&value.trim().length>0))]
}

export function v12WardrobeProgress(state:V12WardrobeProgressState):WardrobeProgress {
  const clearedDestinations=Object.entries(state.expeditionRecords??{})
    .filter(([,record])=>record?.cleared===true)
    .map(([stageId])=>expeditionWardrobeBridge[stageId])
    .filter((value):value is string=>Boolean(value))
  return {
    monthsCompleted:Math.max(0,state.monthsCompleted??0,state.careerRecords?.monthsCompleted??0),
    discoveredDestinations:uniqueStrings([...(state.discoveredDestinations??[]),...clearedDestinations]),
    huntChallengeClears:uniqueStrings(state.huntChallengeClears??[]),
    endingCollection:uniqueStrings(state.endingCollection??[]),
  }
}

export function v12UnlockedOutfits(state:V12WardrobeProgressState):string[] {
  return unlockedWardrobe(v12WardrobeProgress(state))
}
