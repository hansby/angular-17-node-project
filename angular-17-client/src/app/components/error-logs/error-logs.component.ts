import { Component, OnInit } from '@angular/core';
import { SearchService, searchType } from '../../services/search.service';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { LoggerService } from '../../services/logger.service';
import { Observable, of, tap } from 'rxjs';
@Component({
	selector: 'error-logs',
	templateUrl: './error-logs.component.html',
	styleUrl: './error-logs.component.css',
})
export class ErrorLogsComponent implements OnInit {
	searchBy: searchType | null = null;
	form = new UntypedFormGroup({
		search: new UntypedFormControl(''),
	});

	_logData$: Observable<any> | null = null;

	currentResolveID: number | null = null;
	searchText: string = '';

	searchType = searchType;
	_logResults: Array<any> = [];
	noResultsFound: boolean = false;
	apiIsLoading: boolean = false;

	constructor(private search: SearchService, private logs: LoggerService) {}

	ngOnInit(): void {
		this._logData$ = this.logs.getAllRawLogs(true).pipe(
			tap((logs) => console.log('fetched logs: ', logs))
		);
	}

	updateSearchBy(type: searchType) {
		this.searchBy = type;
	}

	confirmResolve() {
		this.apiIsLoading = true;
		console.log('resolving log with ID: ', this.currentResolveID);
		if (!this.currentResolveID) return;
		this.logs.resolveLog(this.currentResolveID).subscribe((res) => {
			console.log('log resolved: ', res);
			
			// data-dismiss="modal"
			// @ts-ignore
			$('#modal_tandcs').modal('hide');

			this.apiIsLoading = false;

			this._logData$ = this.logs.getAllRawLogs().pipe(
				tap((logs) => {
					if (logs.length <= 0) this.noResultsFound = true;
				})
			);
		}, (error) => {
			this.apiIsLoading = false;
			console.error('Error resolving log: ', error);
		});
	}

	doSearch() {
		this.noResultsFound = false;
		const keyword = this.searchText;
		if (!keyword || keyword.length <= 0) {
			this._logData$ = this.logs.getAllRawLogs();
			return;
		}
		console.log('do API call for keyword: ', keyword);
		this.logs.searchLogs(keyword).subscribe((results) => {
			console.log('search results: ', results);
			if (results.length > 0) {
				this._logData$ = of(results);
			} else {
				this._logData$ = of([]);
				this.noResultsFound = true;
			}
		}, (error) => {
			console.error('Error fetching search results: ', error);
			this.noResultsFound = true;
		});
	}

	goToDashboard() {
		window.location.href = '/dashboard';
	}

	formatDataLog(log: string): string {
		const serverPath = 'http://localhost:8080/assets/uploads/';
		if (log.includes('file=')) {
			const filePath = log.substring(log.indexOf('file=') + 5, log.length).replace('.end','');
			return `${log}, link: <a href="${serverPath}${filePath}" target="_blank">${filePath}</a>`;
		}
		return log;
	}

}