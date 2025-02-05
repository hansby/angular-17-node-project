import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Registration } from '../models/registration.model';

const baseUrl = 'http://localhost:8080/api/registrations';

@Injectable({
	providedIn: 'root',
})
export class RegistrationsService {
	constructor(private http: HttpClient) {}

	getAll(): Observable<Registration[]> {
		return this.http.get<Registration[]>(baseUrl);
	}

	get(id: any): Observable<Registration> {
		return this.http.get<Registration>(`${baseUrl}/${id}`);
	}

	create(data: Registration): Observable<Registration> {
		return this.http.post(baseUrl, data);
	}

	update(id: any, data: Registration): Observable<Registration> {
		return this.http.put(`${baseUrl}/${id}`, data);
	}

	delete(id: any): Observable<any> {
		return this.http.delete(`${baseUrl}/${id}`);
	}

	deleteAll(): Observable<any> {
		return this.http.delete(baseUrl);
	}

	findByTitle(title: any): Observable<Registration[]> {
		return this.http.get<Registration[]>(`${baseUrl}?title=${title}`);
	}
}
