import { Component, OnInit } from '@angular/core';
import { ISearchResultsSurtieDB, ISearchResultsSurtieDBAlt, SearchService, searchType } from '../../services/search.service';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ISurtieDBRecord, RegistrationsService } from '../../services/registrations.service';
import { LoginService } from '../../services/login.service';

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
	_UISearchResults: Array<ISearchResultsSurtieDBAlt> = [];
	noResultsFound: boolean = false;

	allRecords: Array<ISurtieDBRecord> = [];


	constructor(
		private search: SearchService, 
		private registrationsService: RegistrationsService,
		private loginservice: LoginService
	) {}

	ngOnInit(): void {
		this.registrationsService.getAllSurtieDBRecords().subscribe(records => {
			this.allRecords = records.map(r => ({
				...r,
				original_id_number: r.id_number
			}));
		});
		
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
		this.search.getBySearchFilterSurtieDB(keyword).subscribe((searchResults) => {
			console.log('lets see searchResults: ', searchResults);
			if (searchResults.length > 0) {
				this._UISearchResults = searchResults;
			} else {
				this.noResultsFound = true;
			}
		})
	}

	login() {
		this.isLoggedIn = this.inpt_username === USERNAME && this.inpt_password === PASSWORD;
	}

	updateRecord(ben: ISurtieDBRecord) {
		this.loginservice.getUserCredentials(ben.id_number).subscribe(credentials => {
			alert('This ID Number already exists in the system. Please use a different ID Number.');
			ben.id_number = ben.original_id_number!;
		}, (error) => {
			this.registrationsService.updateSurtieDBRecord(ben.original_id_number!, ben).subscribe((res) => {
				alert('Record updated successfully!');
			}, (error) => {
				console.error('Error updating record: ', error);
			});			
		});
	}	

	updateAllow(benData: ISurtieDBRecord) {
		console.log('Updating allow for record: ', benData);
		this.registrationsService.updateSurtieDBRecord(benData.original_id_number!, benData).subscribe((res) => {
			alert('Record updated successfully!');
		}, (error) => {
			console.error('Error updating record: ', error);
		});
	}	

}