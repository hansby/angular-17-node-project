import { Component, OnInit } from '@angular/core';
import { SearchService, searchType } from '../../services/search.service';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
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

	currentResolveID: number | null = null;

	searchType = searchType;
	_logResults: Array<any> = [];
	_APILogs: Array<{data: any}> = [
		{ data: 'error on doc for julian hansby - 9928347235 - Passport ERROR' },
		{ data: 'error on doc for askjdh 123iuohasf - 9928347235 - Passport ERROR' },
		{ data: 'error on doc for julian hansby - 9928347235 - Passport ERROR' },
		{ data: 'error lkjsdf9 9234 supper - 9928347235 - Passport ERROR' },
		{ data: 'error LOG (@#) - 9928347235 - TRUST ERROR' },
		{ data: 'error on doc BUS REG DOC ERROR 28347235 - Passport ERROR' },
		{ data: 'error on doc 2009 TRUST - 9928347235 - Passport ERROR' },
		{ data: 'error on doc for julian IT Passport ERROR' },
		{ data: 'error on WEB nsby - 9928347235 - Passport ERROR' },
		{ data: 'error on doc ID DOC ERROR' },
		{ data: 'error GOOGLE VERIFY LOG - Passport ERROR' },
		{ data: 'error on doc kjhasd 8234 hansby - 9928347235 - Passport ERROR' },
		{ data: 'error 5243 003999400 BUS REG DOC ERROR' },
		{ data: 'error on doc for julian hansby - 9928347235 - Passport ERROR' },
		{ data: 'error on doc ID ERROR - Passport ERROR' },
		{ data: 'error on doc for julian hansby - 9928347235 - Passport ERROR' },
	];
	noResultsFound: boolean = false;

	constructor(private search: SearchService) {}

	ngOnInit(): void {
	}

	updateSearchBy(type: searchType) {
		this.searchBy = type;
	}

	confirmResolve() {
		this._APILogs = this._APILogs.filter((_:any, idx: number) => idx !== this.currentResolveID);
	}

	doSearch() {
		this.noResultsFound = false;
		this._logResults = [];
		const keyword = this.form.controls['search'].value;
		if (!keyword || keyword.length <= 0) return;
		
		/**
		 * API Calls
		 
		this.search.getBySearchFilter(keyword).subscribe((searchResults) => {
			console.log('lets see searchResults: ', searchResults);
			if (searchResults.length > 0) {
				this._UISearchResults = searchResults;
			} else {
				this.noResultsFound = true;
			}
		})*/
	}

}