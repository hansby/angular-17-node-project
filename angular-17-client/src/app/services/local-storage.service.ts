import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, of } from 'rxjs';

export interface IStoredUser {
	firstName: string,
	lastName: string,
	idpassport: string,
	userCanProceed: boolean,
}

@Injectable({
	providedIn: 'root',
})
export class LocalStorageService {
	constructor(private http: HttpClient) {}

	userMayHaveAccess(): Observable<boolean> {
		const getLSUser = localStorage.getItem('user_');
		if (getLSUser) {
			return of(true);
		} else {
			return of(false);
		}
	}

	storeUserData(user: IStoredUser): Observable<boolean> {
		localStorage.setItem('user_', JSON.stringify(user));
		return of(true).pipe(
			delay(1000)
		);
	}
}
