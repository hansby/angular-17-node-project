import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { fileTypes } from '../app.component';

const LOC = 'us';
const baseUrl = `https://${LOC}-documentai.googleapis.com/v1/projects`;
const PROJ_ID = '522083403925';
const ACCESS_TOKEN = 'ya29.a0AXeO80RN8jUQx_IGEuVIBpr4CXa6Vu7tiYqYJqlrC6sBH5uXRKl0zKPnaP7D2Nq-kR0mHHcPFhKpcCcyzMezUsg4zgzMfKiiuj_FJSXT0f_I1xCTF2t_-bhsya8Tq8Ubjt-82XvMXGzU0cO8RcCReOv31buBaJBQpQ-viNyBtg4knkoaCgYKAboSARISFQHGX2MipgET6tkcM_mEm8zDB9WJkQ0182';
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
