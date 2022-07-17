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
    expect(jukeboxData).toBeTruthy();
  });
});
