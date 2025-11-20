import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, of } from 'rxjs';

const baseUrl = 'http://localhost:8080/api';

export interface IUser {
	firstName: string,
	lastName: string,
	idpassport: string,
}

@Injectable({
	providedIn: 'root',
})
export class LoginService {
	constructor(private http: HttpClient) {}

	getUserCredentials(idpassport: string): Observable<IUser> {
		return this.http.get<IUser>(`${baseUrl}/idsearch?id_number=${idpassport}`).pipe(
			delay(4000)
		);
	}
}
