import { JukeboxData } from './jukebox-data';

describe('JukeboxData', () => {
  let jukeboxData: any = null;

  beforeEach(() => {
    jukeboxData = new JukeboxData();
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
    expect(jukeboxData.allEdges).toBeInstanceOf(Array);
    expect(jukeboxData.deletedEdges).toBeInstanceOf(Array);
    expect(typeof jukeboxData.randomBranchChanceDelta).toBe("number");
    expect(typeof jukeboxData.lastBranchPoint).toBe("undefined");
  });
});
