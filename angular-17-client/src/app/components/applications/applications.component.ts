import { Component, OnInit } from '@angular/core';

const USERNAME = 'raymond001';
const PASSWORD = 'AccessApps001';

@Component({
	selector: 'app-applications',
	//standalone: true,
	//imports: [CommonModule],
	templateUrl: './applications.component.html',
	styleUrl: './applications.component.css',
})
export class ApplicationsComponent implements OnInit {
	isLoggedIn: boolean = true;
	inpt_username: string = '';
	inpt_password: string = '';

	constructor() {}

	ngOnInit(): void {

	}

	login() {
		this.isLoggedIn = this.inpt_username === USERNAME && this.inpt_password === PASSWORD;
	}

}