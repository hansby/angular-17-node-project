import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './components/shared/shared.module';
import { HomeComponent } from './components/home/home.component';
import { ErrorLogsComponent } from './components/error-logs/error-logs.component';
import { ApplicationsComponent } from './components/applications/applications.component';

@NgModule({
  declarations: [
    AppComponent,
		HomeComponent,
		ErrorLogsComponent,
		ApplicationsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
		SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
