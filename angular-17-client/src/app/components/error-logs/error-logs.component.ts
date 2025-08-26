import { Component, OnInit } from '@angular/core';
import { SearchService, searchType } from '../../services/search.service';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { LoggerService } from '../../services/logger.service';
import { Observable, tap } from 'rxjs';
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
	_APILogs: Array<{data: string, id: number}> = [
		{ data: 'error on doc for julian hansby - 9928347235 - Passport ERROR', id: 1 },
		{ data: 'error on doc for askjdh 123iuohasf - 9928347235 - Passport ERROR', id: 2 },
		{ data: 'error on doc for julian hansby - 9928347235 - Passport ERROR', id: 3 },
		{ data: 'error lkjsdf9 9234 supper - 9928347235 - Passport ERROR', id: 4 },
		{ data: 'error LOG (@#) - 9928347235 - TRUST ERROR', id: 5 },
		{ data: 'error on doc BUS REG DOC ERROR 28347235 - Passport ERROR', id: 6 },
		{ data: 'error on doc 2009 TRUST - 9928347235 - Passport ERROR', id: 7 },
		{ data: 'error on doc for julian IT Passport ERROR', id: 8 },
		{ data: 'error on WEB nsby - 9928347235 - Passport ERROR', id: 9 },
		{ data: 'error on doc ID DOC ERROR', id: 10 },
		{ data: 'error GOOGLE VERIFY LOG - Passport ERROR', id: 11 },
		{ data: 'error on doc kjhasd 8234 hansby - 9928347235 - Passport ERROR', id: 12 },
		{ data: 'error 5243 003999400 BUS REG DOC ERROR', id: 13 },
		{ data: 'error on doc for julian hansby - 9928347235 - Passport ERROR', id: 14 },
		{ data: 'error on doc ID ERROR - Passport ERROR', id: 15 },
		{ data: 'error on doc for julian hansby - 9928347235 - Passport ERROR', id: 16 },
	];
	noResultsFound: boolean = false;

	constructor(private search: SearchService, private logs: LoggerService) {}

	ngOnInit(): void {
		this._logData$ = this.logs.getAllRawLogs().pipe(
			tap((data) => {
				console.log('log data: ', data);
			})
		);
	}

	get filteredItems() {
		const lower = this.searchText.toLowerCase();
		return this._APILogs.filter(filter => filter.data.toLowerCase().includes(lower));
	}	

	updateSearchBy(type: searchType) {
		this.searchBy = type;
	}

	confirmResolve() {
		this._APILogs = this._APILogs.filter((_:any, idx: number) => _.id !== this.currentResolveID);
	}

	doSearch() {
		this.noResultsFound = false;
		this._logResults = [];
		const keyword = this.form.controls['search'].value;
		if (!keyword || keyword.length <= 0) return;
	}

	goToDashboard() {
		window.location.href = '/dashboard';
	}

}