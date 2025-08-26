import { Component, OnInit } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IStats, RegistrationsService } from '../../services/registrations.service';
import { LoggerService } from '../../services/logger.service';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
	_stats$: Observable<IStats> | null = null;
	_logs$: Observable<any> | null = null;

	constructor(private registrationsService: RegistrationsService, private logs: LoggerService) {}

	ngOnInit() {
		this._stats$ = this.registrationsService.getStats();
		this._logs$ = this.logs.getLogStats();
	}
	goToApplications() {
		window.location.href = '/applications';
	}
	goToErrorPage() {
		window.location.href = '/error-logs';
	}
}