import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AudioComponent } from './audio/audio.component';
// import { Shader } from './shader/shader';

@NgModule({
  declarations: [
    AppComponent,
    AudioComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  // providers: [Shader],
  bootstrap: [AppComponent]
})
export class AppModule { }
