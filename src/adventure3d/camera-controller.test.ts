import {describe,expect,it} from 'vitest';
import {adventureCameraEye,DEFAULT_ADVENTURE_CAMERA,followAdventureCamera,rotateAdventureCamera,zoomAdventureCamera} from './camera-controller';

describe('V18 adventure camera controller',()=>{
  it('clamps pitch so the camera cannot flip under or over the field',()=>{
    expect(rotateAdventureCamera(DEFAULT_ADVENTURE_CAMERA,0,99).pitch).toBe(.18);
    expect(rotateAdventureCamera(DEFAULT_ADVENTURE_CAMERA,0,-99).pitch).toBe(-.9);
  });

  it('supports a useful exploration distance range',()=>{
    expect(zoomAdventureCamera(DEFAULT_ADVENTURE_CAMERA,-999).distance).toBe(7);
    expect(zoomAdventureCamera(DEFAULT_ADVENTURE_CAMERA,999).distance).toBe(20);
  });

  it('smoothly follows instead of snapping the camera target',()=>{
    const next=followAdventureCamera(DEFAULT_ADVENTURE_CAMERA,{x:20,y:8,z:-10},.016);
    expect(next.target.x).toBeGreaterThan(0);
    expect(next.target.x).toBeLessThan(20);
  });

  it('places the eye behind and above the target at the default angle',()=>{
    const eye=adventureCameraEye(DEFAULT_ADVENTURE_CAMERA);
    expect(eye.z).toBeGreaterThan(DEFAULT_ADVENTURE_CAMERA.target.z);
    expect(eye.y).toBeGreaterThan(DEFAULT_ADVENTURE_CAMERA.target.y);
  });
});
