import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const LOC = 'us';
const baseUrl = `https://${LOC}-documentai.googleapis.com/v1/projects`;
const PROJ_ID = '522083403925';
const PROCESSOR_ID = '5b018beea92e33bf'
//const ACCESS_TOKEN = auth.getAccessToken();
const ACCESS_TOKEN = 'ya29.a0AXeO80Suc6S-TkO0zt15wqQOWymt6zMDpZSPryM5_afs7LxmuKgvZoWwf40f5oNRab0NbpPEauzV5nSQ9PUzUv26FUa483cpAKrD29AyqsEMk5rBGYpZ3T8WoxIFFKPoEZqUXRYBH9hPLDOqHGaB67JQ_e3CloFeo5R_NX4xpEJSeP0aCgYKAdISARISFQHGX2Mia8HiAhGSJoLavCZZTb3BLg0182';
export interface IGoogleDoc {
	skipHumanReview: boolean,
	rawDocument: {
		mimeType: string,
		content: any,
		displayName?: string,
	},
	fieldMask?: string,
}

@Injectable({
	providedIn: 'root',
})
export class UploadGoogleDocService {
	constructor(private http: HttpClient) {}

	verifyDocumentbyGoogleAI(data: IGoogleDoc): Observable<any> {
		//console.log('initGoogleAuth: ', this.initGoogleAuth());
		if (data) data.rawDocument.content = data.rawDocument.content.toString().replace('data:image/jpeg;base64,','');
		const header = {
			headers: new HttpHeaders().set('Authorization',  `Bearer ${ACCESS_TOKEN}`)
		}		
		return this.http.post<IGoogleDoc>(`${baseUrl}/${PROJ_ID}/locations/${LOC}/processors/${PROCESSOR_ID}:process`, data, header);
	}

}
