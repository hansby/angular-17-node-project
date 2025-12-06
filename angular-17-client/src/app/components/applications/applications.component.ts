import { Component, OnInit } from '@angular/core';
import { ISearchResults, SearchService, searchType } from '../../services/search.service';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { RegistrationsService } from '../../services/registrations.service';

const USERNAME = 'raymond001';
const PASSWORD = 'AccessApps001';

interface IModalData {
	beneficiary: ISearchResults;
	id: string;
	isPassport: boolean;
}

@Component({
	selector: 'app-applications',
	templateUrl: './applications.component.html',
	styleUrl: './applications.component.css',
})
export class ApplicationsComponent implements OnInit {
	isLoggedIn: boolean = true;
	inpt_username: string = '';
	inpt_password: string = '';
	searchBy: searchType | null = null;
  form = new UntypedFormGroup({
    search: new UntypedFormControl(''),
  });	

	searchType = searchType;
	_UISearchResults: Array<ISearchResults> = [];
	noResultsFound: boolean = false;
	modalData: IModalData = {
		beneficiary: {} as ISearchResults,
		id: '',
		isPassport: false
	};

	constructor(private search: SearchService, private registrationService: RegistrationsService) {}

	ngOnInit(): void {
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
		this.search.getBySearchFilter(keyword).subscribe((searchResults) => {
			if (searchResults.length > 0) {
				this._UISearchResults = searchResults.map((r) => ({
					...r,
					original_user_id: r.user_id,
					original_passport: r.passport
				}));
			} else {
				this.noResultsFound = true;
			}
		})
	}

	updateRecord(beneficiary: ISearchResults, id: string, isPassport: boolean) {
		let _localObj = {};
		let _originalId = '';
		if (isPassport) {
			_localObj = {
				passport: id
			};
			_originalId = beneficiary.original_passport || '';
		} else {
			_localObj = {
				user_id: id
			};
			_originalId = beneficiary.original_user_id || '';
		}
		console.log('updateRecord called with beneficiary: ', beneficiary);
		this.registrationService.update(_originalId, _localObj).subscribe((resp) => {
			alert('Record updated successfully!');
		}, (error) => {
			alert('Error updating record. Please try again.');
		});
	}

	login() {
		this.isLoggedIn = this.inpt_username === USERNAME && this.inpt_password === PASSWORD;
	}
}