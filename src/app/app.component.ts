import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'stream-intermission';

  private canvas: any;
  private gl: any;

  ngOnInit() {
    this.canvas = document.getElementById('canvas');
    this.gl = this.canvas.getContext('webgl');

    this.resizeCanvas(document.body.clientWidth, document.body.clientHeight);
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
