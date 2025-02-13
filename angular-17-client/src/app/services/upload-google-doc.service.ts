import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


const LOC = 'us';
const baseUrl = `https://${LOC}-documentai.googleapis.com/v1/projects`;
const PROJ_ID = '522083403925';
const PROCESSOR_ID = '1f9552b1916f76ad'
const ACCESS_TOKEN = `ya29.a0AXeO80Sgj0yK8paITg8MDOh4uW45t3E8Vq4lATEJ3xU7JrX3Z9JQUCv-nczMWbSkYHdreCTFYSINqZ9mGoNMqY9eueAdUoCzxqXjpoCooxohMLHqN0-K0Io1dIlUtw01kiibxwsuy_zZkRrGTJJ22CvHVBEjqrexsnFsCIqzww7tQgaCgYKATkSARISFQHGX2MijrySJ92UUBoWebFTzoGZCA0181`;

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
		const header = {
			headers: new HttpHeaders().set('Authorization',  `Bearer ${btoa(ACCESS_TOKEN)}`)
		}		
		return this.http.post<IGoogleDoc>(`${baseUrl}/${PROJ_ID}/locations/${LOC}/processors/${PROCESSOR_ID}:process`, data, header);
	}

}
