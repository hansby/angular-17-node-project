import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, map, Observable, tap } from 'rxjs';

export interface ISearchResultsLogs {
	id: number,
	log: string,
	is_resolved: boolean,
}

export interface ILogStats {
	totalResolved: number;
	unresolvedCount: number;
	total: number;
}

const baseUrl = 'http://localhost:8080/api/error-logs';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  
  constructor(private http: HttpClient) {}

	sendLog(data: string) {
		return this.http.post(`${baseUrl}`, { is_resolved: 0, log: data });
	}

	getAllRawLogs(filterByResolved: boolean = false): Observable<ISearchResultsLogs[]> {
		return this.http.get<ISearchResultsLogs[]>(`${baseUrl}`).pipe(
			filter((logs) => logs && logs.length > 0),
			map((logs) => filterByResolved ? logs.filter((log) => log.is_resolved) : logs.filter((log) => !log.is_resolved))
		);
	}

	searchLogs(keyword: string): Observable<ISearchResultsLogs[]> {
		return this.http.get<ISearchResultsLogs[]>(`${baseUrl}?log=${keyword}`);
	}

	resolveLog(id: number): Observable<any> {
		return this.http.put(`${baseUrl}/${id}`, { is_resolved: 1 });
	}

	getLogStats(): Observable<ILogStats> {
		return this.http.get<ISearchResultsLogs[]>(`${baseUrl}`).pipe(
			map((errorLogData: ISearchResultsLogs[]) => ({
				totalResolved: errorLogData.filter(log => log.is_resolved === true).length,
				unresolvedCount: errorLogData.filter(log => log.is_resolved === false).length,
				total: errorLogData.length
			}))
		);
	}	
}