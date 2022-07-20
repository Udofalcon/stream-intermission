import { Tile } from '../types/tile';

export class Tiles {
    static createTiles(track: any): Array<Tile> {
        const tiles = new Array<Tile>();
        const qlist = track.analysis.beats;

        for (let i = 0; i < qlist.length; i++) {
            const tile: Tile = {
                which: i,
                q: qlist[i]
            };

            qlist[i].tile = tile;
            tiles.push(tile);
        }

        return tiles;
    }
}
