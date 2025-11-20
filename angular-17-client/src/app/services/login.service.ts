import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, of } from 'rxjs';

const baseUrl = 'http://localhost:8080/api';

export interface IUser {
	first_name: string,
	last_name: string,
	id_number: string,
}

@Injectable({
	providedIn: 'root',
})
export class LoginService {
	constructor(private http: HttpClient) {}

	getUserCredentials(idpassport: string): Observable<IUser> {
		return this.http.get<IUser>(`${baseUrl}/idsearch?id_number=${idpassport}`).pipe(
			delay(1000)
		);
	}
}
