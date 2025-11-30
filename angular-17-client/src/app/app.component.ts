import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LocalStorageService } from './services/local-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
	constructor(
    private router: Router,
    private route: ActivatedRoute,
		private localStorageService: LocalStorageService
	){
    // Detect route params (including on refresh)
    this.route.queryParams.subscribe(params => {
      // Example: ?mode=foreigner
      if (params['mode'] === 'foreigner') {
				this.localStorageService.storeUserData({
					firstName: '',
					lastName: '',
					idpassport: '',
					userCanProceed: true,
					isForeignerMode: true,
				}).subscribe(() => {
					this.router.navigate(['/application']);
				});
      }
    });		
	}
}

