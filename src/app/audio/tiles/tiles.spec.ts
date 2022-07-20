import { Tile } from '../types/tile';
import { Tiles } from './tiles';

describe('Tiles', () => {
  it('should create an instance', () => {
    expect(new Tiles()).toBeTruthy();
  });

  it('should create a list of tiles', () => {
    const context = new AudioContext();
    const audioSource = context.createBufferSource();
    const track: any = {
      analysis: {
        beats: []
      }
    };

    track.analysis.beats.push({
      all_neighbors: [],
      audioSource,
      children: [],
      confidence: Math.random(),
      duration: Math.random(),
      neighbors: [],
      next: {},
      oseg: {},
      overlappingSegments: [],
      prev: null,
      reach: 100,
      start: Math.random(),
      track,
      which: 0
    });

    track.analysis.beats.push({
      all_neighbors: [],
      audioSource,
      children: [],
      confidence: Math.random(),
      duration: Math.random(),
      neighbors: [],
      next: {},
      oseg: {},
      overlappingSegments: [],
      prev: track.analysis.beats[0],
      reach: 100,
      start: track.analysis.beats[0].start + track.analysis.beats[0].duration,
      track,
      which: 1
    });

    track.analysis.beats.push({
      all_neighbors: [],
      audioSource,
      children: [],
      confidence: Math.random(),
      duration: Math.random(),
      neighbors: [],
      next: {},
      oseg: {},
      overlappingSegments: [],
      prev: track.analysis.beats[1],
      reach: 100,
      start: track.analysis.beats[1].start + track.analysis.beats[1].duration,
      track,
      which: 2
    });

    const actual = Tiles.createTiles(track);
    const expected = new Array<Tile>(...[
      { which: 0, q: track.analysis.beats[0] },
      { which: 1, q: track.analysis.beats[1] },
      { which: 2, q: track.analysis.beats[2] }
    ]);
  });
});
