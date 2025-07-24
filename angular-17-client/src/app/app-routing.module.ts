import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { ErrorLogsComponent } from './components/error-logs/error-logs.component';
import { ApplicationsComponent } from './components/applications/applications.component';
import { HomeComponent } from './components/home/home.component';
//import { ErrorLogsComponent } from './components/error-logs/error-logs.component';
//import { ApplicationsComponent } from './components/applications/applications.component';
//import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
	{ path: '', pathMatch: 'full', component: HomeComponent },
	{ path: 'error-logs', component: ErrorLogsComponent },
	{ path: 'applications', component: ApplicationsComponent }
  /*{ path: '', redirectTo: 'tutorials', pathMatch: 'full' },
  { path: 'tutorials', component: TutorialsListComponent },
  { path: 'tutorials/:id', component: TutorialDetailsComponent },
  */
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
