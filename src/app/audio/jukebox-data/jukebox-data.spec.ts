import { JukeboxData } from './jukebox-data';

describe('JukeboxData', () => {
  let jukeboxData: any = null;

  beforeEach(() => {
    jukeboxData = new JukeboxData();
    jukeboxData.tiles.push({});
    jukeboxData.allEdges.push({});
    jukeboxData.deletedEdges.push({});
  });

  afterEach(() => {
    jukeboxData = null;
  });

  it('should create an instance', () => {
    expect(jukeboxData).toBeInstanceOf(JukeboxData);
    expect(typeof jukeboxData.maxBranches).toBe("number");
    expect(typeof jukeboxData.maxBranchThreshold).toBe("number");
    expect(typeof jukeboxData.currentThreshold).toBe("number");
    expect(jukeboxData.tiles).toBeInstanceOf(Array);
    expect(jukeboxData.tiles[0]).toBeInstanceOf(Object);
    expect(jukeboxData.allEdges).toBeInstanceOf(Array);
    expect(jukeboxData.allEdges[0]).toBeInstanceOf(Object);
    expect(jukeboxData.deletedEdges).toBeInstanceOf(Array);
    expect(jukeboxData.deletedEdges[0]).toBeInstanceOf(Object);
    expect(typeof jukeboxData.randomBranchChanceDelta).toBe("number");
    expect(typeof jukeboxData.lastBranchPoint).toBe("undefined");
  });
});
