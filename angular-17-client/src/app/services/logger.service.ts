import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ISearchResultsLogs {
	user_id: string,
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private baseUrl = 'http://localhost:8080/api/logger';
  constructor(private http: HttpClient) {}

	sendLog(data: any) {
		return this.http.post(`${this.baseUrl}`, data);
	}

  getLogs(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }
}