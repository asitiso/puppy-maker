import {describe,expect,it} from 'vitest';
import {scoreCappedSpringAffinities,scoreSpringAffinityEvidence} from './spring-raising';

describe('V3 Spring Raising',()=>{
  it('aggregates finite positive affinity evidence by campaign',()=>{
    expect(scoreSpringAffinityEvidence([
      {campaign:'caretaker',source:'training',amount:2,reason:'protected an ally'},
      {campaign:'caretaker',source:'dialogue',amount:3,reason:'shared responsibility'},
      {campaign:'pathfinder',source:'exploration',amount:4,reason:'found a hidden route'},
      {campaign:'vanguard',source:'tactical',amount:Infinity,reason:'corrupt'},
      {campaign:'arcanist',source:'calling',amount:-3,reason:'invalid'},
    ])).toEqual({caretaker:5,pathfinder:4,vanguard:0,arcanist:0});
  });

  it('caps each campaign source while preserving distinct behavioral sources',()=>{
    expect(scoreCappedSpringAffinities([
      {campaign:'caretaker',source:'training',amount:4,reason:'protected an ally'},
      {campaign:'caretaker',source:'training',amount:4,reason:'protected an ally again'},
      {campaign:'caretaker',source:'training',amount:4,reason:'protected an ally again'},
      {campaign:'caretaker',source:'dialogue',amount:5,reason:'shared responsibility'},
      {campaign:'pathfinder',source:'exploration',amount:7,reason:'mapped hidden routes'},
    ])).toEqual({caretaker:11,pathfinder:6,vanguard:0,arcanist:0});
  });
});
