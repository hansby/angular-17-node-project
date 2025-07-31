import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { fileTypes } from '../../app/components/home/home.component';

const LOC = 'us';
const PROJ_ID = '522083403925';
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
		let processorID: string;
		switch(docType) {
			case fileTypes.ID: processorID = '60b18db85bb692fd'
				break;
			case fileTypes.PASSPORT: processorID = '6c9c51a1e27651f3'
				break;				
			case fileTypes.BUS_REG_DOC: processorID = '88c872bf6214d9a5'
				break;
			case fileTypes.PROOF_OF_ADDRESS: processorID = '5b018beea92e33bf'
				break;
			case fileTypes.TRUST_DOC: processorID = 'd06ed11859ac16a9'
				break;
			case fileTypes.BANK_CONF_LETTER: processorID = '1450436d1aa73a'
				break;
			default:
				throw new Error(`Unknown document type: ${docType}`)			
		}		
		return this.http.post<IGoogleDoc>('http://localhost:8080/api/process-document', {
			data,
			projectId: PROJ_ID,
			processorId: processorID,
			location: LOC
		});
	}
}
