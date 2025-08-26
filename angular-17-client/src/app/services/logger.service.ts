import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface ISearchResultsLogs {
	id: number,
	log: string,
	is_resolved: boolean,
}

export interface ILogStats {
	totalResolved: number;
	unresolvedCount: number;
}

const baseUrl = 'http://localhost:8080/api/error-logs';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  
  constructor(private http: HttpClient) {}

	sendLog(data: any) {
		return this.http.post(`${baseUrl}`, data);
	}

	getAllRawLogs(): Observable<ISearchResultsLogs[]> {
		return this.http.get<ISearchResultsLogs[]>(`${baseUrl}`);
	}

	getLogStats(): Observable<ILogStats> {
		return this.http.get<ISearchResultsLogs[]>(`${baseUrl}`).pipe(
			map((errorLogData: ISearchResultsLogs[]) => ({
				totalResolved: 111,
				unresolvedCount: 222,
			}))
		);
	}	
}