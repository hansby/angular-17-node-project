import { Component } from '@angular/core';
import {
  Router, NavigationEnd, ActivatedRoute, NavigationStart, NavigationCancel,
} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
	constructor(
    private router: Router,
    private route: ActivatedRoute,
	){}

}

