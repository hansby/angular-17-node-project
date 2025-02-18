import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const LOC = 'us';
const baseUrl = `https://${LOC}-documentai.googleapis.com/v1/projects`;
const PROJ_ID = '522083403925';
const ACCESS_TOKEN = 'ya29.a0AXeO80T0Gu5wSF5MXusY1hTFqb-emjAJQsnu77oMpNBIt8_q_IQRnjJyg48uegKi1-Q95YFyT_XtEb332YxQHi-WbnhoECexVYI0Lgzeb2zgK-vHP8mFcaZDyeHh1xqwRcZXW9Km_UhvG0Vq6_zvbWZ_Lt45bOtMjCw_ODHpZAFNnisaCgYKAQASARISFQHGX2MiTIekhzSxsN8AOb2rpy1plw0182';
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

	verifyGoogleAIDoc_POA(data: IGoogleDoc): Observable<any> {
		if (data) data.rawDocument.content = data.rawDocument.content.toString().replace('data:image/jpeg;base64,','');
		const header = {
			headers: new HttpHeaders().set('Authorization',  `Bearer ${ACCESS_TOKEN}`)
		}		
		return this.http.post<IGoogleDoc>(`${baseUrl}/${PROJ_ID}/locations/${LOC}/processors/5b018beea92e33bf:process`, data, header);
	}

	verifyGoogleAIDoc_ID(data: IGoogleDoc): Observable<any> {
		if (data) data.rawDocument.content = data.rawDocument.content.toString().replace('data:image/jpeg;base64,','');
		const header = {
			headers: new HttpHeaders().set('Authorization',  `Bearer ${ACCESS_TOKEN}`)
		}		
		return this.http.post<IGoogleDoc>(`${baseUrl}/${PROJ_ID}/locations/${LOC}/processors/a8e1982410149b8e:process`, data, header);
	}	

}
