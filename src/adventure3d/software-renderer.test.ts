import {describe,expect,it} from 'vitest';
import {DEFAULT_ADVENTURE_CAMERA} from './camera-controller';
import {projectAdventurePoint} from './software-renderer';

describe('V18 software 3D projection',()=>{
  it('projects the camera target near screen center',()=>{
    const projected=projectAdventurePoint(DEFAULT_ADVENTURE_CAMERA.target,DEFAULT_ADVENTURE_CAMERA,1000,600);
    expect(projected).not.toBeNull();
    expect(projected!.x).toBeCloseTo(500,4);
    expect(projected!.y).toBeCloseTo(300,4);
  });

  it('rejects points behind the camera',()=>{
    const projected=projectAdventurePoint({x:0,y:3,z:60},DEFAULT_ADVENTURE_CAMERA,1000,600);
    expect(projected).toBeNull();
  });
});
