import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { fileTypes } from '../app.component';

const LOC = 'us';
const baseUrl = `https://${LOC}-documentai.googleapis.com/v1/projects`;
const PROJ_ID = '522083403925';
const ACCESS_TOKEN = 'ya29.a0AXeO80QkjndkvBMa25SJDyhwtqOoFhOXjJ1aYxk86gu6vZdtKT3mTnY3VrBvO6E1ZESW6nFgCRBZwib4pdIqpDmJh_4xZIF3jm0CFWpKkUw-BMf4Z-E_klxqysl0XlBhZ8XDL6iaeHfIe2oXFxWqy3vdXQSt5aPI4eKlJwXafmbi8UUaCgYKAXkSARISFQHGX2MiGnoMk4pW-s0vufgmtJUPJw0182';
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
			case fileTypes.ID: processorID = '60b18db85bb692fd'
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
