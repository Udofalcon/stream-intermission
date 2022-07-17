export class JRemixer {
    private context: any;
    private track: any;
    private volume: number = 0.1;

    constructor(context: any) {
        this.context = context;
    }

    getPlayer(): any {
        const audioGain: any = this.context.createGain();

        let curAudioSource: any = null;
        let curQ: any = null;

        audioGain.gain.value = this.volume;
        audioGain.connect(this.context.destination);

        const playQuantum = (when: any, q: any): any => {
            const now = this.context.currentTime;
            const start = when === 0 ? now : when;
            const next = start + q.duration;

            if (!curQ || curQ.track !== q.track || curQ.which + 1 !== q.which) {
                const audioSource = this.context.createBufferSource();

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
        }

        return {
            play: (when: any, q: any): any => {
                return playQuantum(when, q);
            },
            curTime: () => {
                return this.context.currentTime;
            }
        }
    }

    remixTrack(track: any, callback: any): any {
        const fetchAudio = () => {
          fetch('assets/ABeautifulLife.wav') // I only have the one song, so I just dropped it here instead of hitting the Youtube API.
            .then(response => response.arrayBuffer())
            .then(buffer => this.context.decodeAudioData(buffer))
            .then(buffer => {
              track.buffer = buffer;
              track.status = 'ok';
              this.track = track;
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
    }
}