import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Registration } from '../models/registration.model';
import { REG_TYPE } from '../components/home/home.component';

const baseUrl = 'http://localhost:8080/api/registrations';

export interface IRequiredQParams {
	user_id?: string,
	email?: string,
	passport?: string,
	bus_reg_no?: string,
	trust_reg_no?: string,
	acc_no: string,
}

@Injectable({
	providedIn: 'root',
})
export class RegistrationsService {
	constructor(private http: HttpClient) {}

	getAll(params: IRequiredQParams, regType: string): Observable<Registration[]> {
    const p: [string, string|number|boolean|undefined][] = [
      //['email', params.email],
      ['acc_no', params.acc_no],
    ];
		if (regType === REG_TYPE.IND && params.user_id) p.push(['user_id', params.user_id]);
		if (regType === REG_TYPE.IND && params.passport) p.push(['passport', params.passport]);
		if (regType === REG_TYPE.BUS && params.bus_reg_no) p.push(['bus_reg_no', params.bus_reg_no]);
		if (regType === REG_TYPE.TRUST && params.trust_reg_no) p.push(['trust_reg_no', params.trust_reg_no]);
		const query = p.map((p) => `${p[0]}=${p[1]}`).join('&');
		return this.http.get<Registration[]>(`${baseUrl}?${query}`);
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
