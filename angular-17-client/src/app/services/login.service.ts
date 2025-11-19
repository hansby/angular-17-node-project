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
		return of({firstName: 'John', lastName: 'Doe', idpassport} as IUser).pipe(
			delay(4000)
		);
		//return this.http.post<IUser>(`${baseUrl}/login`, { idpassport });
	}
}
