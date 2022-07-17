export class JukeboxData { 
    private maxBranches: number = 4;         // max branches allowed per beat
    private maxBranchThreshold: number = 80; // max allowed distance threshold

    private currentThreshold: number = 2;    // current in-use max threshold

    private tiles: Array<any> = [];          // all of the tiles
    private allEdges: Array<any> = [];       // all of the edges
    private deletedEdges: Array<any> = [];   // edges that should be deleted

    private randomBranchChanceDelta: number = 0.18;

    private lastBranchPoint: any;

    addEdge(edge: any): void { this.allEdges.push(edge); }

    getAllEdgesCount(): number { return this.allEdges.length; }
    getCurrentThreshold(): number { return this.currentThreshold; }
    getDeletedEdge(index: number): any { return this.deletedEdges[index]; }
    getDeletedEdgeCount(): number { return this.deletedEdges.length; }
    getDeletedEdges(): Array<any> { return this.deletedEdges; }
    getLastBranchPoint(): any { return this.lastBranchPoint; }
    getMaxBranches(): number { return this.maxBranches; }
    getMaxBranchThreshold(): number { return this.maxBranchThreshold; }
    getRandomBranchChanceDelta(): number { return this.randomBranchChanceDelta; }
    getTile(index: number): any { return this.tiles[index]; }
    getTileCount(): number { return this.tiles.length; }

    resetAllEdges(): void { this.allEdges = []; }
    resetDeletedEdges(): void { this.deletedEdges = []; }
    resetTiles(): void { this.tiles = []; }

    setLastBranchPoint(beat: any): void { this.lastBranchPoint = beat; }
    setTiles(tiles: Array<any>): void { this.tiles = tiles; }
}
