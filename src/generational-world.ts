export const legacyWorldMarkerIds=[
  'festival_tradition',
  'open_road_network',
  'regional_compact',
  'restored_riftward',
  'forbidden_legacy',
  'hollow_scar',
] as const;

export const publicProjectIds=[
  'guardian_academy',
  'ancient_road_restoration',
  'regional_council',
  'rift_watch',
] as const;

export type LegacyWorldMarkerId=typeof legacyWorldMarkerIds[number];
export type PublicProjectId=typeof publicProjectIds[number];

export type GenerationalWorldState={
  legacyMarkers:LegacyWorldMarkerId[];
  activeProject:PublicProjectId|null;
  projectProgress:number;
  completedProjects:PublicProjectId[];
};
