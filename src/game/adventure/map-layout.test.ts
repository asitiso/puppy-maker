import{describe,expect,it}from'vitest';import{destinations}from'../exploration';import{MAP_POINTS,mapPoint,mapPathD}from'./map-layout';
describe('town map layout',()=>{
 it('places every destination on the map exactly once',()=>{expect(MAP_POINTS).toHaveLength(destinations.length);destinations.forEach(d=>expect(MAP_POINTS.some(p=>p.id===d.id)).toBe(true))});
 it('keeps every coordinate inside the 0-100 canvas',()=>{MAP_POINTS.forEach(p=>{expect(p.x).toBeGreaterThanOrEqual(0);expect(p.x).toBeLessThanOrEqual(100);expect(p.y).toBeGreaterThanOrEqual(0);expect(p.y).toBeLessThanOrEqual(100)})});
 it('falls back to the first point for an unknown id',()=>{expect(mapPoint('nowhere')).toBe(MAP_POINTS[0])});
 it('builds an SVG path string that starts with M and visits every point',()=>{const d=mapPathD();expect(d.startsWith('M')).toBe(true);expect(d.split(' ')).toHaveLength(MAP_POINTS.length)});
});
