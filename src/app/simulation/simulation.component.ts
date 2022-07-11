import { Component, OnInit, HostListener, Input, Inject } from '@angular/core';
import { SharedService } from '../shared/shared.service';
import { Boid } from './boid/boid';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.sass']
})
export class SimulationComponent implements OnInit {
  private boids: Array<Boid>;
  private canvas: any;
  private context: any;
  private fps: number;
  private last_time: number;

  @Input() shared_service: SharedService | undefined;

  constructor() {
    this.fps = 30;
    this.last_time = Date.now();
    this.boids = [];
  }

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas');
    this.context = this.canvas.getContext('2d');
    this.resizeCanvas(document.body.clientWidth, document.body.clientHeight);

    this.getUserList()
    .then(() => { 
      setTimeout(this.draw.bind(this), 0);
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.resizeCanvas(event.target.innerWidth, event.target.innerHeight);
  }

  resizeCanvas(width: Number, height: Number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  getUserList(): any {
    return fetch('http://localhost:4201/getUsers')
      .then(res => res.json())
      .then(data => {
        console.log(data);
      });
  }

  draw(): void {
    const now = Date.now();
    const elapsed_milliseconds = (now - this.last_time);
    const fps_milliseconds = 1000 / this.fps;
    const action_ratio = elapsed_milliseconds / fps_milliseconds;

    // console.log(action_ratio);
    const beat = this.shared_service?.getBeat() || 0;

    this.boids.forEach((boid: Boid): void => {
      boid.setFlap(beat % 4)
    });

    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.fillStyle = ((beat % 4 === 2) ? 'green' : ((beat % 4 === 0) ? 'yellow' : 'red'));
    this.context.fillRect(100 * (beat % 4), 0, 100, 100);
    this.context.font = '30px Verdana';
    this.context.fillStyle = 'black';
    this.context.fillText(beat, 100 * (beat % 4) + 25, 50);

    this.last_time = now;
    setTimeout(this.draw.bind(this), 0);
  }
}
