import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { fileTypes } from '../app.component';

const LOC = 'us';
const baseUrl = `https://${LOC}-documentai.googleapis.com/v1/projects`;
const PROJ_ID = '522083403925';
const ACCESS_TOKEN = 'ya29.a0AXeO80SNHlcofwJ2IKndS84CYQ4snSxI4GcIwmHvJ4PhbjdpXo-dz7-5O_-QKR3XJn9o-6HgN4O6vDZMHPvGPkyQBAfULdmXrimTg-CrMQhRLBFDUpTFAS14rS5b2Lq26h0WED8JfiCbSWkzvP1JlQTWE-eH_GTd8ehLNGieV_JwkBwaCgYKAcwSARISFQHGX2Mi6EA5Xch9uirXpl6FYWN4sA0182';
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

	verifyGoogleAIDoc(data: IGoogleDoc, docType: fileTypes): Observable<any> {
		const header = {
			headers: new HttpHeaders().set('Authorization',  `Bearer ${ACCESS_TOKEN}`)
		}
		let processorID: string;
		switch(docType) {
			case fileTypes.ID: processorID = 'a8e1982410149b8e'
				break;
			case fileTypes.BUS_REG_DOC: processorID = '88c872bf6214d9a5'
				break;
			case fileTypes.PROOF_OF_ADDRESS: processorID = '5b018beea92e33bf'
				break;
			case fileTypes.TRUST_DOC: processorID = 'd06ed11859ac16a9'
				break;												
		}
		return this.http.post<IGoogleDoc>(`${baseUrl}/${PROJ_ID}/locations/${LOC}/processors/${processorID}:process`, data, header);
	}

}
