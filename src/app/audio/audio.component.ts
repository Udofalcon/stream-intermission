// Swiped most of this from https://github.com/UnderMybrella/EternalJukebox

import { Component, Input, OnInit } from '@angular/core';
import { SharedService } from '../shared/shared.service';
import * as api_analysis_analyse_1xRg5kRYm923OSqvmCZnvJ from './api_analysis_analyse_1xRg5kRYm923OSqvmCZnvJ.json'; // This is a Spotify response. I only have one song, so I just saved the response.
import { JRemixer } from './jremixer/jremixer';
import { JukeboxData } from './jukebox-data/jukebox-data';

@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.sass']
})
export class AudioComponent implements OnInit {
  private context: any;
  private driver: any;
  private jukeboxData: JukeboxData;
  private player: any;
  private remixer: any;
  private track: any;

  @Input() shared_service: SharedService | undefined;

  constructor() {
    this.jukeboxData = new JukeboxData();
  }

  ngOnInit(): void {
    this.context = new AudioContext();
    this.remixer = new JRemixer(this.context);
    this.player = this.remixer.getPlayer();
    this.fetchAnalysis();
  }

  fetchAnalysis(): void {
    // Mock from Spotify API
    const data = api_analysis_analyse_1xRg5kRYm923OSqvmCZnvJ;

    this.gotTheAnalysis(data);
  }

  gotTheAnalysis(profile: any): void {
    this.remixer.remixTrack(profile, (t: any) => {
      this.track = t;
      this.readyToPlay(t);
    });
  }

  readyToPlay(t: any): void {
    this.driver = this.Driver(this.player);
    this.drawVisualization();
    setTimeout(() => {
      this.driver.start();
    });
  }

  Driver(player: any): any {
    let curTile: any = null;
    let curOp: any = null;
    let incr = 1;
    let nextTile: any = null;
    let nextTime = 0;

    const next = () => {
      let nextIndex;

      if (curTile === null || curTile === undefined) {
        return this.jukeboxData.getTile(0);
      } else {
        nextIndex = curTile.which + incr;
      }

      if (nextIndex < 0) {
        return this.jukeboxData.getTile(0);
      } else if (nextIndex >= this.jukeboxData.getTileCount()) {
        curOp = null;
        player.stop();
      } else {
        return selectRandomNextTile(this.jukeboxData.getTile(nextIndex));
      }
    };
    const selectRandomNextTile = (seed: any): any => {
      if (seed.q.neighbors.length === 0) {
        return seed;
      } else if (shouldRandomBranch(seed.q)) {
        const next = seed.q.neighbors.shift();

        seed.q.neighbors.push(next);

        return next.dest.tile;
      } else {
        return seed;
      }
    };

    // Only have the last branch in my song
    const shouldRandomBranch = (q: any): boolean => {
      return q.which === this.jukeboxData.getLastBranchPoint();
    };
    const process = () => {
      if (nextTile !== null) {
        curTile = nextTile;
        nextTile = null;
      } else {
        curTile = curOp();
      }

      this.shared_service?.setBeat(curTile.which);

      const ctime = player.curTime();

      nextTime = player.play(nextTime, curTile.q);

      const delta = nextTime - ctime;

      setTimeout((): void => {
        process();
      }, 1000 * delta - 10);
    };

    return {
      start: () => {
        nextTime = 0;
        curOp = next;
        process();
      },
      stop: () => {
        if (curTile) {
          curTile.normal();
          curTile = null;
        }

        curOp = null;
        player.stop();
      },
    };
  }

  drawVisualization(): void {
    this.calculateNearestNeighbors('beats', this.jukeboxData.getCurrentThreshold());
    this.createTilePanel('beats');
  }

  calculateNearestNeighbors(type: string, threshold: number): number {
    this.precalculateNearestNeighbors(type, this.jukeboxData.getMaxBranches(), this.jukeboxData.getMaxBranchThreshold());
    
    const count = this.collectNearestNeighbors(type, threshold);

    this.postProcessNearestNeighbors(type);

    return count;
  }

  precalculateNearestNeighbors(type: string, maxNeighbors: number, maxThreshold: number): void {
    if ('all_neighbors' in this.track.analysis[type][0]) {
      return;
    }

    this.jukeboxData.resetAllEdges();

    for (let qi = 0; qi < this.track.analysis[type].length; qi++) {
      let q1 = this.track.analysis[type][qi];

      this.calculateNearestNeighborsForQuantum(type, maxNeighbors, maxThreshold, q1);
    }
  }

  calculateNearestNeighborsForQuantum(type: string, maxNeighbors: number, maxThreshold: number, q1: any): void {
    const edges = [];
    let id = 0;

    for (let i = 0; i < this.track.analysis[type].length; i++) {
      if (i === q1.which) {
        continue;
      }

      const q2 = this.track.analysis[type][i];
      let sum = 0;

      for (let j = 0; j < q1.overlappingSegments.length; j++) {
        const seg1 = q1.overlappingSegments[j];
        let distance = 100;

        if (j < q2.overlappingSegments.length) {
          const seg2 = q2.overlappingSegments[j];

          if (seg1.which === seg2.which) {
            distance = 100;
          } else {
            distance = this.get_seg_distance(seg1, seg2);
          }
        }

        sum += distance;
      }

      const pdistance = q1.indexInParent == q2.indexInParent ? 0 : 100;
      const totalDistance = sum / q1.overlappingSegments.length + pdistance;

      if (totalDistance < maxThreshold) {
        const edge = {
          id: id,
          src: q1,
          dest: q2,
          distance: totalDistance,
          curve: null,
          deleted: false
        };

        edges.push(edge);
        id++;
      }
    }

    edges.sort((a: any, b: any): number => {
      if (a.distance > b.distance) {
        return 1;
      } else if (b.distance > a.distance) {
        return -1;
      } else {
        return 0;
      }
    });

    q1.all_neighbors = [];

    for (let i = 0; i < maxNeighbors && i < edges.length; i++) {
      const edge = edges[i];

      q1.all_neighbors.push(edge);
      edge.id = this.jukeboxData.getAllEdgesCount();
      this.jukeboxData.addEdge(edge);
    }
  }

  get_seg_distance(seg1: any, seg2: any): number {
    const timbreWeight = 1;
    const pitchWeight = 10;
    const loudStartWeight = 1;
    const loudMaxWeight = 1;
    const durationWeight = 100;
    const confidenceWeight = 1;

    const timbre = this.seg_distance(seg1, seg2, 'timbre');
    const pitch = this.seg_distance(seg1, seg2, 'pitches');
    const sloudStart = Math.abs(seg1.loudness_start - seg2.loudness_start);
    const sloudMax = Math.abs(seg1.loudness_max - seg2.loudness_max);
    const duration = Math.abs(seg1.duration - seg2.duration);
    const confidence = Math.abs(seg1.confidence - seg2.confidence);
    const distance = timbre * timbreWeight +
                     pitch * pitchWeight +
                     sloudStart * loudStartWeight +
                     sloudMax * loudMaxWeight +
                     duration * durationWeight +
                     confidence * confidenceWeight;

    return distance;
  }

  seg_distance(seg1: any, seg2: any, field: string): number {
    return this.euclidean_distance(seg1[field], seg2[field]);
  }

  euclidean_distance(v1: any, v2: any): number {
    let sum = 0;

    for (let i = 0; i < v1.length; i++) {
      const delta = v2[i] - v1[i];

      sum += delta * delta;
    }

    return Math.sqrt(sum);
  }

  collectNearestNeighbors(type: string, maxThreshold: number): number {
    let branchingCount = 0;

    for (let qi = 0; qi < this.track.analysis[type].length; qi++) {
      const q1 = this.track.analysis[type][qi];

      q1.neighbors = this.extractNearestNeighbors(q1, maxThreshold);

      if (q1.neighbors.length > 0) {
        branchingCount++;
      }
    }

    return branchingCount;
  }

  extractNearestNeighbors(q: any, maxThreshold: number): any {
    const neighbors = [];

    for (let i = 0; i < q.all_neighbors.length; i++) {
      const neighbor = q.all_neighbors[i];
      const distance = neighbor.distance;

      if (distance <= maxThreshold) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  postProcessNearestNeighbors(type: string): void {
    this.removeDeletedEdges();

    if (this.longestBackwardBranch(type) < 50) {
      this.insertBestBackwardBranch(type, this.jukeboxData.getCurrentThreshold(), 65);
    } else {
      this.insertBestBackwardBranch(type, this.jukeboxData.getCurrentThreshold(), 55);
    }

    this.calculateReachability(type);
    this.jukeboxData.setLastBranchPoint(this.findBestLastBeat(type));
    this.filterOutBadBranches(type, this.jukeboxData.getLastBranchPoint());
  }

  removeDeletedEdges(): void {
    for (let i = 0; i < this.jukeboxData.getDeletedEdgeCount(); i++) {
      const edgeID = this.jukeboxData.getDeletedEdge(i);

      if (edgeID in this.jukeboxData.getDeletedEdges()) {
        const edge = this.jukeboxData.getDeletedEdge(edgeID);

        this.deleteEdge(edge);
      }
    }

    this.jukeboxData.resetDeletedEdges();
  }

  deleteEdge(edge: any): void {
    if (!edge.deleted) {
      edge.deleted = true;

      if (edge.curve) {
        edge.curve.remove();
        edge.curve = null;
      }

      for (let j = 0; j < edge.src.neighbors.length; j++) {
        const otherEdge = edge.src.neighbors[j];

        if (edge === otherEdge) {
          edge.src.neighbors.splice(j, 1);
          break;
        }
      }
    }
  }

  longestBackwardBranch(type: string): number {
    let longest = 0;
    const quanta = this.track.analysis[type];

    for (let i = 0; i < quanta.length; i++) {
      const q = quanta[i];

      for (let j = 0; j < q.neighbors.length; j++) {
        const neighbor = q.neighbors[j];
        const which = neighbor.dest.which;
        const delta = i - which;

        if (delta > longest) {
          longest = delta;
        }
      }
    }

    return longest * 100 / quanta.length;
  }

  insertBestBackwardBranch(type: string, threshold: number, maxThreshold: number): void {
    const branches = [];
    const quanta = this.track.analysis[type];

    for (let i = 0; i < quanta.length; i++) {
      const q = quanta[i];

      for (let j = 0; j < q.all_neighbors.length; j++) {
        const neighbor = q.all_neighbors[j];

        if (neighbor.deleted) {
          continue;
        }

        const which = neighbor.dest.which;
        const thresh = neighbor.distance;
        const delta = i - which;

        if (delta > 0 && thresh < maxThreshold) {
          const percent = delta * 100 / quanta.length;
          const edge = [ percent, i, which, q, neighbor ];
          
          branches.push(edge);
        }
      }
    }

    if (branches.length === 0) {
      return;
    }

    branches.sort((a: any, b: any): any => {
      return a[0] - b[0];
    });
    branches.reverse();

    const best = branches[0];
    const bestQ = best[3];
    const bestNeighbor = best[4];
    const bestThreshold = bestNeighbor.distance;

    if (bestThreshold > threshold) {
      bestQ.neighbors.push(bestNeighbor);
    }
  }

  calculateReachability(type: string): void {
    const maxIter = 1000;
    let iter = 0;
    const quanta = this.track.analysis[type];

    for (let qi = 0; qi < quanta.length; qi++) {
      const q = quanta[qi];

      q.reach = quanta.length - q.which;
    }

    for (iter = 0; iter < maxIter; iter++) {
      let changeCount = 0;

      for (let qi = 0; qi < quanta.length; qi++) {
        const q = quanta[qi];
        let changed = false;

        for (let i = 0; i < q.neighbors.length; i++) {
          const q2 = q.neighbors[i].dest;

          if (q2.reach > q.reach) {
            q.reach = q2.reach;
            changed = true;
          }
        }

        if (qi < quanta.length - 1) {
          const q2 = quanta[qi + 1];

          if (q2.reach > q.reach) {
            q.reach = q2.reach;
            changed = true;
          }
        }

        if (changed) {
          changeCount++;

          for (let j = 0; j < q.which; j++) {
            const q2 = quanta[j];

            if (q2.reach < q.reach) {
              q2.reach = q.reach;
            }
          }
        }
      }

      if (changeCount === 0) {
        break;
      }
    }
  }

  findBestLastBeat(type: string): any {
    const reachThreshold = 50;
    const quanta = this.track.analysis[type];
    let longest = 0;
    let longestReach = 0;

    for (let i = quanta.length - 1; i >= 0; i--) {
      const q = quanta[i];
      const distanceToEnd = quanta.length - i;
      const reach = (q.reach - distanceToEnd) * 100 / quanta.length;

      if (reach > longestReach && q.neighbors.length > 0) {
        longestReach = reach;
        longest = i;

        if (reach >= reachThreshold) {
          break;
        }
      }
    }
    
    return longest;
  }

  filterOutBadBranches(type: string, lastIndex: number): void {
    const quanta = this.track.analysis[type];

    for (let i = 0; i < lastIndex; i++) {
      const q = quanta[i];
      const newList = [];

      for (let j = 0; j < q.neighbors.length; j++) {
        const neighbor = q.neighbors[j];

        if (neighbor.dest.which < lastIndex) {
          newList.push(neighbor);
        }
      }

      q.neighbors = newList;
    }
  }

  createTilePanel(which: string): void {
    this.removeAllTiles();
    this.jukeboxData.setTiles(this.createTiles(which));
  }

  removeAllTiles(): void {
    this.jukeboxData.resetTiles();
  }

  createTiles(qtype: string): any {
    return this.createTileCircle(qtype);
  }

  createTileCircle(qtype: string): any {
    const tiles = [];
    const qlist = this.track.analysis[qtype];

    for (let i = 0; i < qlist.length; i++) {
      const tile = this.createNewTile(i, qlist[i]);

      tiles.push(tile);
    }

    return tiles;
  }

  createNewTile(which: number, q: any): any {
    const tile = {
      which: which,
      q: q
    };

    q.tile = tile;

    return tile;
  }
}
