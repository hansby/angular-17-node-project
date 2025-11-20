import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:8080/api/search';

export interface ISearchResultsSurtieDB {
	idpassport: string,
	firstName: string,
	lastName: string,
}

export interface ISearchResultsSurtieDBAlt {
	id_number: string,
	first_name: string,
	last_name: string,
}

export interface ISearchResults {
	user_id: string,
	bus_reg_no: string,
	trust_reg_no: string,
	firstName: string,
	lastName: string,
	reg_type: string,
	email: string,
	cell: string,
	citizenStatus: string,
	passport: string,
	acc_no: string,
	bank: string,
	bank_other: string,
	createdAt: string
}

export enum searchType {
	id = 'id',
	passport = 'passport',
	bus_reg_no = 'bus_reg_no',
	trust_reg_no = 'trust_reg_no'
}

export interface ISearchParams {
	user_id?: string,
	passport?: string,
	bus_reg_no?: string,
	trust_reg_no?: string,
}

@Injectable({
	providedIn: 'root',
})
export class SearchService {
	constructor(private http: HttpClient) {}

	getBySearchFilter(value: string): Observable<ISearchResults[]> { //regType: searchType | null
		const p: [string, string|number|boolean|undefined][] = [
			['user_id', value],
			['passport', value],
			['bus_reg_no', value],
			['trust_reg_no', value],
			['firstName', value],
			['lastName', value],
		];
		/*if (regType === searchType.id) p.push(['user_id', value]);
		if (regType === searchType.passport) p.push(['passport', value]);
		if (regType === searchType.bus_reg_no) p.push(['bus_reg_no', value]);
		if (regType === searchType.trust_reg_no) p.push(['trust_reg_no', value]);*/
		const query = p.map((p) => `${p[0]}=${p[1]}`).join('&');
		return this.http.get<ISearchResults[]>(`${baseUrl}?${query}`);
	}

	getBySearchFilterSurtieDB(value: string): Observable<ISearchResultsSurtieDBAlt[]> {
		return this.http.get<ISearchResultsSurtieDBAlt[]>(`${baseUrl}/surtiedb?keyword=${value}`);
	}	
}
