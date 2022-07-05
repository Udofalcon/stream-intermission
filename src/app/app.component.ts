import { Component, HostListener } from '@angular/core';
// import { Shader } from './shader/shader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'stream-intermission';

  private canvas: any;
  private context: any;
  // private gl: any;
  // private shader: Shader;

  // constructor (shader: Shader) {
  //   this.shader = shader;
  // }

  ngOnInit() {
    this.canvas = document.getElementById('canvas');
    // this.gl = this.canvas.getContext('webgl2');
    this.context = this.canvas.getContext('2d');

    this.resizeCanvas(document.body.clientWidth, document.body.clientHeight);
    // this.shader.attachShader(this.gl);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.resizeCanvas(event.target.innerWidth, event.target.innerHeight);
  }

  resizeCanvas(width: Number, height: Number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
