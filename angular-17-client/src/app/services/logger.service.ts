import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private baseUrl = 'http://localhost:8080/api/logger';
  constructor(private http: HttpClient) {}

	storeLoginDB(data: any) {
		return this.http.post(`${this.baseUrl}`, data);
	}

  uploadLogFile(file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      responseType: 'json',
    });

    return this.http.request(req);
  }

  getLogs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/files`);
  }
}