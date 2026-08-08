import { activities } from './game-core';
import { outingDefinitions } from './adventure';
import { seasonalProfile } from './seasonal-cycle';
import { seasonStampDefinitions, seasonStampIds, type SeasonStampId } from './season-stamps';

export type SeasonalHomeSummary = {
  title: string;
  recommendation: string;
};

export type SeasonalStampSummary = {
  stampLabel: string;
  collected: boolean;
  current: number;
  total: number;
  outingName: string;
};

export function seasonalHomeSummary(month: number): SeasonalHomeSummary {
  const profile = seasonalProfile(month);
  const weather = profile.weather.replace(/^\S+\s*/, '');
  return {
    title: `${profile.label} · ${weather}`,
    recommendation: `${activities[profile.activity].name} · ${outingDefinitions[profile.outing].name}`,
  };
}

export function seasonalStampSummary(month: number, stamps: SeasonStampId[]): SeasonalStampSummary {
  const profile = seasonalProfile(month);
  const stamp = seasonStampDefinitions.find(item => item.id === profile.season);
  return {
    stampLabel: stamp?.label ?? profile.label,
    collected: stamps.includes(profile.season),
    current: seasonStampIds.filter(id => stamps.includes(id)).length,
    total: seasonStampIds.length,
    outingName: outingDefinitions[profile.outing].name,
  };
}
