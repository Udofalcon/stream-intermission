import { Component } from '@angular/core';
import { SharedService } from './shared/shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  providers: [SharedService]
})
export class AppComponent {
  public sharedService: SharedService;

  constructor() {
    this.sharedService = new SharedService();
    console.log(this.sharedService);
  }

  ngOnInit(): void {}
}
