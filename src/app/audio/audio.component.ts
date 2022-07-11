// Swiped most of this from https://github.com/UnderMybrella/EternalJukebox

import { Component, Input, OnInit } from '@angular/core';
import { SharedService } from '../shared/shared.service';
import * as api_analysis_analyse_1xRg5kRYm923OSqvmCZnvJ from './api_analysis_analyse_1xRg5kRYm923OSqvmCZnvJ.json'; // This is a Spotify response. I only have one song, so I just saved the response.

@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.sass']
})
export class AudioComponent implements OnInit {
  private context: any;
  private driver: any;
  private jukeboxData: any;
  private player: any;
  private remixer: any;
  private track: any;

  @Input() shared_service: SharedService | undefined;

  constructor() {
    this.jukeboxData = {
      maxBranches: 4,        // max branches allowed per beat
      maxBranchThreshold: 80, // max allowed distance threshold

      currentThreshold: 2,    // current in-use max threshold
      addLastEdge: true,      // if true, optimize by adding a good last edge

      tiles: [],              // all of the tiles
      allEdges: [],           // all of the edges
      deletedEdges: [],       // edges that should be deleted

      minRandomBranchChance: 0.18,
      randomBranchChanceDelta: 0.18,
      curRandomBranchChance: 0,
    };
  }

  ngOnInit(): void {
    this.context = new AudioContext();
    this.remixer = this.createJRemixer(this.context);
    this.player = this.remixer.getPlayer();
    this.fetchAnalysis();
  }

  createJRemixer(context: any): any {
    return {
      remixTrack: (track: any, callback: any) => {
        const fetchAudio = () => {
          fetch('assets/ABeautifulLife.wav') // I only have the one song, so I just dropped it here instead of hitting the Youtube API.
            .then(response => response.arrayBuffer())
            .then(buffer => context.decodeAudioData(buffer))
            .then(buffer => {
              track.buffer = buffer;
              track.status = 'ok';
              callback(track);
            });
        };
        const preprocessTrack = (track: any) => {
          const types = ['sections', 'bars', 'beats', 'tatums', 'segments'];

          for (let i in types) {
            const type = types[i];
            const qlist = track.analysis[type];

            for (let j in qlist) {
              const q = qlist[j];

              q.track = track;
              q.which = parseInt(j);

              if (q.which > 0) {
                q.prev = qlist[q.which - 1];
              } else {
                q.prev = null;
              }

              if (q.which < qlist.length - 1) {
                q.next = qlist[q.which + 1];
              } else {
                q.next = null;
              }
            }
          }

          connectQuanta(track, 'sections', 'bars');
          connectQuanta(track, 'bars', 'beats');
          connectQuanta(track, 'beats', 'tatums');
          connectQuanta(track, 'tatums', 'segments');

          connectFirstOverlappingSegment(track, 'bars');
          connectFirstOverlappingSegment(track, 'beats');
          connectFirstOverlappingSegment(track, 'tatums');

          connectAllOverlappingSegments(track, 'bars');
          connectAllOverlappingSegments(track, 'beats');
          connectAllOverlappingSegments(track, 'tatums');

          filterSegments(track);
        };
        const filterSegments = (track: any) => {
          const threshold = 0.3;
          const fsegs = [];

          fsegs.push(track.analysis.segments[0]);

          for (let i = 1; i < track.analysis.segments.length; i++) {
            const seg = track.analysis.segments[i];
            const last = fsegs[fsegs.length - 1];

            if (isSimilar(seg, last) && seg.confidence < threshold) {
              fsegs[fsegs.length - 1].duration += seg.duration;
            } else {
              fsegs.push(seg);
            }
          }

          track.analysis.fsegment = fsegs;
        };
        const isSimilar = (seg1: any, seg2: any) => {
          const threshold = 1;
          const distance = timbral_distance(seg1, seg2);

          return distance < threshold;
        };
        const timbral_distance = (s1: any, s2: any): number => {
          return euclidean_distance(s1.timbre, s2.timbre);
        };
        const euclidean_distance = (v1: any, v2: any): number => {
          let sum = 0;

          for (let i = 0; i < 3; i++) {
            const delta = v2[i] - v1[i];

            sum += delta * delta;
          }

          return Math.sqrt(sum);
        };
        const connectQuanta = (track: any, parent: string, child: string) => {
          let last = 0;
          const qparents = track.analysis[parent];
          const qchildren = track.analysis[child];

          for (let i in qparents) {
            const qparent = qparents[i];

            qparent.children = [];

            for (let j = last; j < qchildren.length; j++) {
              const qchild = qchildren[j];
              
              if (qchild.start >= qparent.start && qchild.start < qparent.start + qparent.duration) {
                qchild.parent = qparent;
                qchild.indexInParent = qparent.children.length;
                qparent.children.push(qchild);
                last = j;
              } else if (qchild.start > qparent.start) {
                break;
              }
            }
          }
        };
        const connectFirstOverlappingSegment = (track: any, quanta_name: string) => {
          let last = 0;
          const quanta = track.analysis[quanta_name];
          const segs = track.analysis.segments;

          for (let i = 0; i < quanta.length; i++) {
            const q = quanta[i];

            for (let j = last; j < segs.length; j++) {
              const qseg = segs[j];

              if (qseg.start >= q.start) {
                q.oseg = qseg;
                last = j;
                break;
              }
            }
          }
        };
        const connectAllOverlappingSegments = (track: any, quanta_name: string) => {
          let last = 0;
          const quanta = track.analysis[quanta_name];
          const segs = track.analysis.segments;

          for (let i = 0; i < quanta.length; i++) {
            const q = quanta[i];

            q.overlappingSegments = [];

            for (let j = last; j < segs.length; j++) {
              const qseg = segs[j];

              if (qseg.start + qseg.duration < q.start) {
                continue;
              }

              if (qseg.start > q.start + q.duration) {
                break;
              }

              last = j;
              q.overlappingSegments.push(qseg);
            }
          }
        };

        preprocessTrack(track);
        fetchAudio();
      },
      getPlayer: () => {
        const audioGain = context.createGain();
        let curAudioSource: any = null;
        let curQ: any = null;

        audioGain.gain.value = 0.1;
        audioGain.connect(context.destination);

        const playQuantum = (when: any, q: any): any => {
          const now = context.currentTime;
          const start = when == 0 ? now : when;
          const next = start + q.duration;

          if (curQ && curQ.track === q.track && curQ.which + 1 == q.which) {
          } else {
            const audioSource = context.createBufferSource();

            audioSource.buffer = q.track.buffer;
            audioSource.connect(audioGain);

            const duration = this.track.audio_summary.duration;

            audioSource.start(start, q.start, duration);

            if (curAudioSource) {
              curAudioSource.stop(start);
            }
            
            curAudioSource = audioSource;
          }

          q.audioSource = curAudioSource;
          curQ = q;

          return next;
        };

        return {
          play: (when: any, q: any): any => {
            return playQuantum(when, q);
          },
          curTime: () => {
            return context.currentTime;
          }
        };
      },
    };
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
    this.trackReady();
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
        return this.jukeboxData.tiles[0];
      } else {
        nextIndex = curTile.which + incr;
      }

      if (nextIndex < 0) {
        return this.jukeboxData.tiles[0];
      } else if (nextIndex >= this.jukeboxData.tiles.length) {
        curOp = null;
        player.stop();
      } else {
        return selectRandomNextTile(this.jukeboxData.tiles[nextIndex]);
      }
    };
    const selectRandomNextTile = (seed: any): any => {
      if (seed.q.neighbors.length === 0) {
        return seed;
      } else if (shouldRandomBranch(seed.q)) {
        const next = seed.q.neighbors.shift();

        this.jukeboxData.lastThreshold = next.distance;
        seed.q.neighbors.push(next);

        return next.dest.tile;
      } else {
        return seed;
      }
    };
    const shouldRandomBranch = (q: any): boolean => {
      if (q.which === this.jukeboxData.lastBranchPoint) {
        return true;
      }

      this.jukeboxData.curRandomBranchChance += this.jukeboxData.randomBranchChanceDelta;

      if (this.jukeboxData.curRandomBranchChance > this.jukeboxData.maxRandomBranchChance) {
        this.jukeboxData.curRandomBranchChance = this.jukeboxData.maxRandomBranchChance;
      }

      const shouldBranch = Math.random() < this.jukeboxData.curRandomBranchChance;

      if (shouldBranch) {
        this.jukeboxData.curRandomBranchChance = this.jukeboxData.minRandomBranchChance;
      }

      return shouldBranch;
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
        this.jukeboxData.curRandomBranchChance = this.jukeboxData.minRandomBranchChance;
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

  trackReady(): void {
    this.jukeboxData.minLongBranch = this.track.analysis.beats.length / 5;
  }

  drawVisualization(): void {
    this.calculateNearestNeighbors('beats', this.jukeboxData.currentThreshold);
    this.createTilePanel('beats');
  }

  calculateNearestNeighbors(type: string, threshold: number): number {
    this.precalculateNearestNeighbors(type, this.jukeboxData.maxBranches, this.jukeboxData.maxBranchThreshold);
    
    const count = this.collectNearestNeighbors(type, threshold);

    this.postProcessNearestNeighbors(type);

    return count;
  }

  precalculateNearestNeighbors(type: string, maxNeighbors: number, maxThreshold: number): void {
    if ('all_neighbors' in this.track.analysis[type][0]) {
      return;
    }

    this.jukeboxData.allEdges = [];

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
      edge.id = this.jukeboxData.allEdges.length;
      this.jukeboxData.allEdges.push(edge);
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

    if (this.jukeboxData.addLastEdge) {
      if (this.longestBackwardBranch(type) < 50) {
        this.insertBestBackwardBranch(type, this.jukeboxData.currentThreshold, 65);
      } else {
        this.insertBestBackwardBranch(type, this.jukeboxData.currentThreshold, 55);
      }
    }

    this.calculateReachability(type);
    this.jukeboxData.lastBranchPoint = this.findBestLastBeat(type);
    this.filterOutBadBranches(type, this.jukeboxData.lastBranchPoint);
  }

  removeDeletedEdges(): void {
    for (let i = 0; i < this.jukeboxData.deletedEdges.length; i++) {
      const edgeID = this.jukeboxData.deletedEdges[i];

      if (edgeID in this.jukeboxData.allEdges) {
        const edge = this.jukeboxData.allEdges[edgeID];

        this.deleteEdge(edge);
      }
    }

    this.jukeboxData.deletedEdges = [];
  }

  deleteEdge(edge: any): void {
    if (!edge.deleted) {
      this.jukeboxData.deletedEdgeCount++;
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

    this.jukeboxData.totalBeats = quanta.length;
    this.jukeboxData.longestReach = longestReach;
    
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
    this.jukeboxData.tiles = this.createTiles(which);
  }

  removeAllTiles(): void {
    this.jukeboxData.tiles = [];
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
