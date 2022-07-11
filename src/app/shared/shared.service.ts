import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private beat: number;

  constructor() {
    this.beat = 0;
  }

  getBeat(): number { return this.beat; }
  setBeat(beat: number): void { this.beat = beat; }
}
