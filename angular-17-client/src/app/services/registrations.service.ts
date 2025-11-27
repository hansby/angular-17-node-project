import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Registration } from '../models/registration.model';
import { REG_TYPE } from '../components/home/home.component';
import { map } from 'rxjs/operators';

const baseUrl = 'http://localhost:8080/api/registrations';

export interface ISurtieDBRecord {
	allow?: boolean;
	id_number: string,
	first_name: string,
	last_name: string,
	original_id_number?: string
}

export interface IStats {
	totalApplications: number;
	registeredToday: number;
	registeredYesterday: number;
}

export interface IRegistration {
	id?: any;
	user_id?: string;
	email?: string;
	passport?: string;
	bus_reg_no?: string;
	trust_reg_no?: string;
	acc_no: string;
	createdAt?: Date;
	updatedAt?: Date;
}

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

	getAllSurtieDBRecords(): Observable<ISurtieDBRecord[]> {
		return this.http.get<ISurtieDBRecord[]>(`http://localhost:8080/api/registrations_surtiedb`);
	}

	updateSurtieDBRecord(originalID: string, data: ISurtieDBRecord): Observable<any> {
		const { first_name, last_name, id_number, allow } = data;
		return this.http.put(`http://localhost:8080/api/registrations_surtiedb/${originalID}`, {
			first_name, last_name, id_number, allow
		}).pipe(
			tap(() => console.log(`Updated SurtieDB Record with id_number=${originalID}`))
		);
	}

	getAll(params: IRequiredQParams, regType: string, saCitizen: boolean): Observable<Registration[]> {
    const p: [string, string|number|boolean|undefined][] = [
      //['email', params.email],
      ['acc_no', params.acc_no],
    ];
		if (regType === REG_TYPE.IND && params.user_id && saCitizen) p.push(['user_id', params.user_id]);
		if (regType === REG_TYPE.IND && params.passport && !saCitizen) p.push(['passport', params.passport]);
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

	getStats(): Observable<IStats> {
		return this.http.get<IRegistration[]>(`${baseUrl}`).pipe(
			map((registrationData: IRegistration[]) => ({
				registeredYesterday: getRegisteredUsersByDate(registrationData, new Date(Date.now() - 86400000)) ?? 0,
				registeredToday: getRegisteredUsersByDate(registrationData, new Date()) ?? 0,
				totalApplications: registrationData.length ?? 0,
			}))
		);
	}
}
function getRegisteredUsersByDate(registrationData: IRegistration[], date: Date): number {
	return registrationData.filter(reg => {
		if (!reg.createdAt) return false;
		const regDate = new Date(reg.createdAt);
		return regDate.getDate() === date.getDate() &&
			regDate.getMonth() === date.getMonth() &&
			regDate.getFullYear() === date.getFullYear();
	}).length;
}

