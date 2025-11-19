import { Component } from "@angular/core";
import { LoginService } from "../../services/login.service";
import { Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from "../../services/local-storage.service";

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],	
})
export class LoginComponent {
	idpassport: string = '';
	isLoading: boolean = false;
	errorMsg: boolean = false;
	selectedNationality: string = '';


	constructor(
		private loginService: LoginService, 
		private router: Router,
		private localStorageService: LocalStorageService) {
			const getLSUser = localStorage.getItem('user_');
			if (getLSUser) {
				this.router.navigate(['/application']);
			}
		}

	performLogin() {
		this.errorMsg = false;
		this.isLoading = true;
		// Implement login logic here
		console.log('Logging in with', this.idpassport);
		this.loginService.getUserCredentials(this.idpassport).subscribe({
			next: (response) => {
				console.log('Login successful', response);
				this.isLoading = false;
				this.localStorageService.storeUserData({
					firstName: response.firstName,
					lastName: response.lastName,
					idpassport: response.idpassport,
					userCanProceed: true,
					isForeignerMode: false,
				}).subscribe(() => {
					console.log('User data stored in local storage');
					this.router.navigate(['/application']);
				});
			},
			error: (error) => {
				console.error('Login failed', error);
				this.isLoading = false;
				this.errorMsg = true;
			}
		});
	}
	
}