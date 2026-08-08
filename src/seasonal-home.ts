import { activities } from './game-core';
import { outingDefinitions } from './adventure';
import { seasonalProfile } from './seasonal-cycle';

export type SeasonalHomeSummary = {
  title: string;
  recommendation: string;
};

export function seasonalHomeSummary(month: number): SeasonalHomeSummary {
  const profile = seasonalProfile(month);
  const weather = profile.weather.replace(/^\S+\s*/, '');
  return {
    title: `${profile.label} · ${weather}`,
    recommendation: `${activities[profile.activity].name} · ${outingDefinitions[profile.outing].name}`,
  };
}
