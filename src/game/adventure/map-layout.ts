// Pure presentational data: where each destination sits on the SCR-04
// style top-view journey map, expressed as 0-100 percentages so the SVG
// map can lay them out without hardcoding pixel sizes. Order follows
// unlockMonth so the path reads as a winding route across the seasons.
export interface MapPoint{id:string;x:number;y:number;zone:'meadow'|'water'|'moon'|'market'|'grove'|'shrine'|'crystal'|'peak'|'battle'}
export const MAP_POINTS:MapPoint[]=[
 {id:'forest_path',x:14,y:82,zone:'meadow'},
 {id:'brook_bridge',x:32,y:72,zone:'water'},
 {id:'moon_garden',x:20,y:56,zone:'moon'},
 {id:'village_market',x:44,y:50,zone:'market'},
 {id:'whispering_grove',x:68,y:58,zone:'grove'},
 {id:'sunset_meadow',x:80,y:40,zone:'meadow'},
 {id:'old_shrine',x:58,y:30,zone:'shrine'},
 {id:'crystal_cave',x:34,y:20,zone:'crystal'},
 {id:'starlight_hill',x:56,y:11,zone:'peak'},
 {id:'winter_battle',x:68,y:6,zone:'battle'},
 {id:'guardian_sanctum',x:80,y:8,zone:'peak'},
];
export const mapPoint=(id:string):MapPoint=>MAP_POINTS.find(p=>p.id===id)??MAP_POINTS[0];
export const mapPathD=()=>MAP_POINTS.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
