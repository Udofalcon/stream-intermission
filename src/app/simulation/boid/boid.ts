class Vector3 {
    public x: number;
    public y: number;
    public z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

// Boid gains static height when flapping? Height dependent of size?
// Boid loses sphere's radius's height% per beat?
// If boid < specific height and never been >= specific height, flap on 0th and 2nd beat.
// If boid < specific height, flap on 0th beat.

export class Boid {
    private name: string;
    private following: Array<string>;
    private position: Vector3;
    private velocity: Vector3;
    private flapping: boolean;
    private spawning: boolean;

    constructor(name: string, following: Array<string>) {
        this.following = following;
        this.name = name;
        this.position = new Vector3();
        this.velocity = new Vector3();
        this.flapping = false;
        this.spawning = true;
    }

    public setFlap(beat: number): void {
        const arbitrary_height = 64;
        // const beat = SharedService.getBeat();

        // Flapping = true
        // mod === 0 && position.y < arbitrary_height
        // mod === 2 && position.y < arbitrary_height && spawning

        // Flapping = false
        // mod === 1
        // mod === 3
        // position.y >= arbitrary_height
        this.flapping = this.position.y < arbitrary_height && (beat === 0 || beat === 2 && this.spawning);
        
        // Spawning = false
        // position.y >= arbitrary_height
        if (this.position.y >= arbitrary_height) {
            this.spawning = false;
        }
    }
}
