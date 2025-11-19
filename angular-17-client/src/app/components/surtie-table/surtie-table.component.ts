import { Component, OnInit } from '@angular/core';
import { ISearchResults, ISearchResultsSurtieDB, SearchService, searchType } from '../../services/search.service';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilKeyChanged, map, startWith } from 'rxjs';

const USERNAME = 'raymond001';
const PASSWORD = 'AccessApps001';

@Component({
	selector: 'app-applications',
	//standalone: true,
	//imports: [CommonModule],
	templateUrl: './surtie-table.component.html',
	styleUrl: './surtie-table.component.css',
})
export class SurtieTableComponent implements OnInit {
	isLoggedIn: boolean = true;
	inpt_username: string = '';
	inpt_password: string = '';
	searchBy: searchType | null = null;
  form = new UntypedFormGroup({
    search: new UntypedFormControl(''),
  });	

	searchType = searchType;
	_UISearchResults: Array<ISearchResultsSurtieDB> = [];
	noResultsFound: boolean = false;


	constructor(private search: SearchService) {}

	ngOnInit(): void {
		/*this.form.controls['search'].valueChanges.pipe(
			map((val) => ({ ...val, hash: JSON.stringify(val) })),
			distinctUntilKeyChanged('hash'),
			debounceTime(300),			
		).subscribe((keyword) => {
			console.log('keyword from search: ', keyword);
		})*/
	}

	updateSearchBy(type: searchType) {
		this.searchBy = type;
	}

	goToDashboard() {
		// Navigate to the dashboard page
		window.location.href = '/dashboard';
	}	

	doSearch() {
		this.noResultsFound = false;
		this._UISearchResults = [];
		const keyword = this.form.controls['search'].value;
		if (!keyword || keyword.length <= 0) return;
		console.log('keyword from search: ', keyword);
		this.search.getBySearchFilterSurtieDB(keyword).subscribe((searchResults) => {
			console.log('lets see searchResults: ', searchResults);
			if (searchResults.length > 0) {
				this._UISearchResults = searchResults;
				/**
				 *.map((result) => {
					let formattedNo = null;
					switch(this.searchBy) {
						case searchType.id:
							formattedNo = result.
						break;
						case y:
							// code block
						break;
						default:
							// code block						
					}
					return {
						...result,

					}
				}) 
				 */
			} else {
				this.noResultsFound = true;
			}
		})
	}

	login() {
		this.isLoggedIn = this.inpt_username === USERNAME && this.inpt_password === PASSWORD;
	}

}