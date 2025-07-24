import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { fileTypes } from '../../app/components/home/home.component';

const LOC = 'us';
const baseUrl = `https://${LOC}-documentai.googleapis.com/v1/projects`;
const PROJ_ID = '522083403925';
const ACCESS_TOKEN = 'ya29.a0AXeO80TCkQ_kVMRUPDmw9vUdlN8YynLaVaQqAZwSBCcX-RDIlIBGkxRjaRTYliS4ZTFKap1MMBL9Ru3U5i0ljHrzeRFdaP2V6loEv-_weVfVXuUS3hBFANuey7YEVXya6MyzNcsYd961gi0I-C9buul7uxV3RSqAAOe9t4NhUAijjQQaCgYKAcUSARISFQHGX2Mifi9wbryWdzjK5Huq4soAnw0182';
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
			// *** bank conf processor ID = 1450436d1aa73a
			default:
				throw new Error(`Unknown document type: ${docType}`)			
		}		
		return this.http.post<IGoogleDoc>('http://localhost:8080/api/process-document', {
			data,
			projectId: PROJ_ID,
			processorId: processorID,
			location: LOC
		});		
		/*
		const header = {
			headers: new HttpHeaders().set('Authorization',  `Bearer ${ACCESS_TOKEN}`)
		}
		let processorID: string;
		switch(docType) {
			case fileTypes.ID: processorID = '60b18db85bb692fd'
				break;
			case fileTypes.BUS_REG_DOC: processorID = '88c872bf6214d9a5'
				break;
			case fileTypes.PROOF_OF_ADDRESS: processorID = '5b018beea92e33bf'
				break;
			case fileTypes.TRUST_DOC: processorID = 'd06ed11859ac16a9'
				break;						
			// *** bank conf processor ID = 1450436d1aa73a
		}
		return this.http.post<IGoogleDoc>(`${baseUrl}/${PROJ_ID}/locations/${LOC}/processors/${processorID}:process`, data, header);
		*/
	}

}
