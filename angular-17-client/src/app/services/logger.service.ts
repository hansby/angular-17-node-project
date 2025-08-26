import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface ISearchResultsLogs {
	user_id: string,
}

export interface ILogStats {
	totalResolved: number;
	unresolvedCount: number;
}

const baseUrl = 'http://localhost:8080/api/logger';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  
  constructor(private http: HttpClient) {}

	sendLog(data: any) {
		return this.http.post(`${baseUrl}`, data);
	}

	getLogs(): Observable<ILogStats> {
		return this.http.get<ISearchResultsLogs[]>(`${baseUrl}`).pipe(
			map((registrationData: ISearchResultsLogs[]) => ({
				totalResolved: 111,
				unresolvedCount: 222,
			}))
		);
	}	
}