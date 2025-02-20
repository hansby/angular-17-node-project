import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, combineLatest, delay, forkJoin, Observable, tap } from 'rxjs';
import {
	FormControl, FormGroup, ReactiveFormsModule,
	FormBuilder,
	Validators,
} from '@angular/forms';
import { IRequiredQParams, RegistrationsService } from './services/registrations.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IGoogleDoc, UploadGoogleDocService } from './services/upload-google-doc.service';
import { FileUploadService } from './services/file-upload.service';

const LS_KEY = 'owiqsjdh09192';

interface IRegistration {
	id: string;
	reg_type: string;
	firstName: string;
	lastName: string;
	bus_reg_no: string;
	trust_reg_no: string;
	cell: string;
	email: string;
	tax_no: string;
	acc_holder: string;
	acc_type: string;
	acc_no: string;
	swift_code: string;
	iban: string;
	bank: string;
	file_id: any;
	file_poa: any;
	file_bus_reg: any;
	file_trust: any;
	passport: string;	
	user_id: string;
	updatedAt?: string,
	createdAt?: string,
}

interface IFormattedFile {
	file: File,
	result: FileReader
}

export enum fileTypes {
	ID = 'ID',
	PROOF_OF_ADDRESS = 'POA',
	BUS_REG_DOC = 'CPIC',
	TRUST_DOC = 'TRUST'
}

enum REG_TYPE {
  IND = 'individual',
  BUS = 'business',
  TRUST = 'trust'
}

enum CITIZEN_STATUS {
	sa = 'citizen',
	foreigner = 'foreigner'
}

interface IIdentity {
  id: string,
  name: string
}

/**
 * 
 * @param idNumber //Ref: http://www.sadev.co.za/content/what-south-african-id-number-made
 * @returns 
 */
function checkID(idNumber: any) {
	// assume everything is correct and if it later turns out not to be, just set this to false
	var correct = true;

	//Ref: http://www.sadev.co.za/content/what-south-african-id-number-made
	// SA ID Number have to be 13 digits, so check the length
	if (idNumber.length != 13 || !isNumber(idNumber)) {
		correct = false;
	}

	// get first 6 digits as a valid date
	var tempDate = new Date(idNumber.substring(0, 2), idNumber.substring(2, 4) - 1, idNumber.substring(4, 6));

	var id_date = tempDate.getDate();
	var id_month = tempDate.getMonth();
	var id_year = tempDate.getFullYear();
	
	if(id_year < (new Date()).getFullYear() - 100){
		id_year += 100
	}

	// apply Luhn formula for check-digits
	var tempTotal = 0;
	var checkSum = 0;
	var multiplier = 1;
	for (var i = 0; i < 13; ++i) {
		tempTotal = parseInt(idNumber.charAt(i)) * multiplier;
		if (tempTotal > 9) {
			tempTotal = parseInt(tempTotal.toString().charAt(0)) + parseInt(tempTotal.toString().charAt(1));
		}
		checkSum = checkSum + tempTotal;
		multiplier = (multiplier % 2 == 0) ? 1 : 2;
	}
	if ((checkSum % 10) != 0) {
		correct = false;
	};

	// if no error found, hide the error message
	if (correct) {
		return true;
	}
	// otherwise, show the error
	else {
		return false;
	}
}

function isNumber(n: string) {
	return !isNaN(parseFloat(n)) && isFinite(+n);
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
	regForm: FormGroup;
	applicationInProgress: boolean = true;
	localStore: any;
	isSACitizen: boolean = false;
	isForeigner: boolean = false;
	isBusiness: boolean = false;
	isTrust: boolean = false;
	regType: string = '';
	fileTypes = fileTypes;
	isLoading: boolean = false;
	formSubmissionErrors: Array<string> = [];
	rateLimiterActive: boolean = false;
	recordAlreadyExists: boolean = false;
	currentFile: any;
	readerResult: any;
	dbName: string = '';
	surname: string = '';

	constructor(
		private fb: FormBuilder, 
		private regService: RegistrationsService,
		private uploadGoogleDoc: UploadGoogleDocService,
		private fileUploadService: FileUploadService,
		@Inject(DOCUMENT) private document: Document,
	){

		this.localStore = document.defaultView?.localStorage;
		if (this.localStore && this.localStore.getItem(LS_KEY)) {
			const getLS = this.localStore.getItem(LS_KEY);
			//this.applicationInProgress = getLS === '1' ? false : true;
		}

		this.regForm = new FormGroup({
			reg_type: new FormControl('', [Validators.required]),
			user_id: new FormControl(''),
			firstName: new FormControl(''),
			lastName: new FormControl(''),
			bus_reg_no: new FormControl(''),
			trust_reg_no: new FormControl(''),
			cell: new FormControl(''),
			email: new FormControl('', [Validators.required, Validators.email]),
			tax_no: new FormControl(''),
			acc_holder: new FormControl(''),
			acc_type: new FormControl('', [Validators.required]),
			acc_no: new FormControl(''),
			swift_code: new FormControl(''),
			iban: new FormControl(''),
			bank: new FormControl('', [Validators.required]),
			file_id: new FormControl(''),
			file_poa: new FormControl(''),
			file_bus_reg: new FormControl(''),
			file_trust: new FormControl(''),
			passport: new FormControl(''),
			citizenStatus: new FormControl('', [Validators.required])
		}, {
			validators: [
				//testForValidSAId('user_id')
			]
		});

		const ctrls = this.regForm.controls;

		const listener_RegType$ = ctrls['reg_type'].valueChanges;
		const $_regType = listener_RegType$
			.subscribe(([reg_type]) => {
				this.formSubmissionErrors.length = 0; // reset UI Error list
				this.regType = reg_type;
				//this.isSACitizen = reg_type === REG_TYPE.IND;
				//this.isBusiness = reg_type === REG_TYPE.BUS;
				//this.isTrust = reg_type === REG_TYPE.TRUST;
		})

		const listener_CitizenStatus$ = ctrls['citizenStatus'].valueChanges;
		const $_citizenStatus = listener_CitizenStatus$
			.subscribe(([status]) => {
				this.formSubmissionErrors.length = 0; // reset UI Error list
				this.isSACitizen = status === 'c';
				this.isForeigner = status === 'f';
				//this.isBusiness = reg_type === REG_TYPE.BUS;
				//this.isTrust = reg_type === REG_TYPE.TRUST;
		})		

	} /* end ngOninit */

  typeTrackerSubject$: BehaviorSubject<any> = new BehaviorSubject([]); 

	accTypes: Array<IIdentity> = [
		{name: 'Cheque', id: 'cheque'},
		{name: 'Savings', id: 'savings'},
		{name: 'Debit', id: 'debit'},
	]

  reg_types: Array<IIdentity> = [
    {name: 'Individual', id: REG_TYPE.IND},
    {name: 'Trust', id: REG_TYPE.TRUST},
    {name: 'Business', id: REG_TYPE.BUS},
  ]

  banks: Array<IIdentity> = [
    {name: 'Absa Bank', id: 'absa'},
    {name: 'African Bank', id: 'african_bank' },
    {name: 'Bidvest Bank Ltd', id: 'bidvest'},
    {name: 'Capitec Bank', id: 'capitec'},
    {name: 'Discovery Bank', id: 'discovery'},
    {name: 'FirstRand Ltd', id: 'first_rand'},
    {name: 'Investec Bank Ltd', id: 'investec'},
    {name: 'Old Mutual Group', id: 'old_mutual'},
    {name: 'Nedbank', id: 'nedbank'},
    {name: 'Sasfin Bank', id: 'sasfin'},
    {name: 'Standard Bank', id: 'standard_bank'},
    {name: 'Tyme Bank', id: 'tyme_bank'},
    {name: 'Ubank', id: 'ubank'},
  ];

  updateRegType(value: string) {
		this.regType = value;
  }

  updateBank(value: string) {
		this.regForm.controls['bank'].setValue(value);
  }	

  updateAccType(value: string) {
		this.regForm.controls['acc_type'].setValue(value);
  }

	updateDBName(event: {file: File, result: FileReader}, fileType: fileTypes) {
		if (event.file) {
			const ctrl = this.regForm.controls;
			//console.log('event emitter value: ', file);
			const name = ctrl['firstName'].value;
			const surname = ctrl['lastName'].value;
			const id = ctrl['user_id'].value;
			const passport = ctrl['passport'].value;

			let type = event.file.type;
			let finalType = type.slice(type.indexOf('/') + 1, type.length);
			if (finalType.includes('sheet')) finalType = 'xls';
			if (finalType.includes('presentation')) finalType = 'pptx';
			if (finalType.includes('document')) finalType = 'doc';
			
			const DBName = `${surname} ${name} - ${fileType} - ${this.isSACitizen ? id : passport}.${finalType}`;
			this.dbName = DBName;
			this.surname = surname;

			const myNewFile = { file: new File([event.file], DBName, {type: event.file.type}), result: event.result };

			switch (fileType) {
				case fileTypes.ID: ctrl['file_id'].setValue(myNewFile);
					break;
				case fileTypes.BUS_REG_DOC: ctrl['file_bus_reg'].setValue(myNewFile);
					break;	
				case fileTypes.TRUST_DOC: ctrl['file_trust'].setValue(myNewFile);
					break;
				case fileTypes.PROOF_OF_ADDRESS: ctrl['file_poa'].setValue(myNewFile);
					break;																				
			}

		}
	}

  submitForm() {
		let formSubList = this.formSubmissionErrors;
		formSubList.length = 0;
		this.isLoading = true;
		this.recordAlreadyExists = false;

		// Trap Field validation errors
		this.fieldValidationChecker();
		
		if(formSubList.length > 0) {
			this.isLoading = false;
			return;
		}

		/** =================================================
		 *  API REFS --- TYPE: "INDIVIDUAL" - SA CITIZEN
		 * 	=================================================
		 * */ 

		if(this.regType === REG_TYPE.IND && this.isSACitizen) {
			const getCtrl_POA = this.regForm.controls['file_poa'].value;
			let result_poa = getCtrl_POA.result;
			const googleDocObj_POA: IGoogleDoc = {
				skipHumanReview: true,
				rawDocument: {
					mimeType: getCtrl_POA.file.type,
					content: result_poa.toString().includes('base64') ? result_poa.split('base64,')[1] : result_poa
				}
			}
			const getCtrl_ID = this.regForm.controls['file_id'].value;
			let result_id = getCtrl_ID.result;
			const googleDocObj_ID: IGoogleDoc = {
				skipHumanReview: true,
				rawDocument: {
					mimeType: getCtrl_ID.file.type,
					content: result_id.toString().includes('base64') ? result_id.split('base64,')[1] : result_id
				}
			}		
			const docAI_POA = this.uploadGoogleDoc.verifyGoogleAIDoc(googleDocObj_POA, fileTypes.PROOF_OF_ADDRESS);
			const docAI_ID = this.uploadGoogleDoc.verifyGoogleAIDoc(googleDocObj_ID, fileTypes.ID);
			this.forkJoinRunner([docAI_POA, docAI_ID], this.runValidationLogic_Individual.bind(this));
			return;
		}

		/** =================================================
		 *  API REFS --- TYPE: "INDIVIDUAL" - FOREIGNER
		 * 	=================================================
		 * */ 

		if (this.regType === REG_TYPE.IND && this.isForeigner) {
			// Do DB Dupe Check and Create registration if PASS = True
			this.dbDupeCheckAndRegistrationPost();
		}


		/** =================================================
		 *  API REFS --- TYPE: "BUSINESS"
		 * 	=================================================
		 * */

		if(this.regType === REG_TYPE.TRUST) {
			const getCtrl_TRUST = this.regForm.controls['file_trust'].value;
			let result_trust = getCtrl_TRUST.result;
			const googleDocObj_TRUST: IGoogleDoc = {
				skipHumanReview: true,
				rawDocument: {
					mimeType: getCtrl_TRUST.file.type,
					content: result_trust.toString().includes('base64') ? result_trust.split('base64,')[1] : result_trust
				}
			}			
			const docAI_TRUST = this.uploadGoogleDoc.verifyGoogleAIDoc(googleDocObj_TRUST, fileTypes.TRUST_DOC);		
			this.forkJoinRunner([docAI_TRUST], this.runValidationLogic_Trust.bind(this));
		}


		/** =================================================
		 *  API REFS --- TYPE: "TRUST"
		 * 	=================================================
		 * */		

		if(this.regType === REG_TYPE.BUS) {
			const getCtrl_BUS = this.regForm.controls['file_bus_reg'].value;
			let result_bus_reg = getCtrl_BUS.result;
			const googleDocObj_BUS: IGoogleDoc = {
				skipHumanReview: true,
				rawDocument: {
					mimeType: getCtrl_BUS.file.type,
					content: result_bus_reg.toString().includes('base64') ? result_bus_reg.split('base64,')[1] : result_bus_reg
				}
			}				
			const docAI_BUS_REG = this.uploadGoogleDoc.verifyGoogleAIDoc(googleDocObj_BUS, fileTypes.BUS_REG_DOC);
			this.forkJoinRunner([docAI_BUS_REG], this.runValidationLogic_BusReg.bind(this));
		}
		
  }

	forkJoinRunner(obsToRun: Array<Observable<any>>, cb: Function) {
		return forkJoin((obsToRun)).subscribe((resp) => cb(resp), (err:HttpErrorResponse) => {
			this.formSubmissionErrors.push('Google API error. Please reach out to your contact for help');
			console.log('Google API error: verify Doc methods', err);
			return;
		})
	}

	runValidationLogic_BusReg(response: any){
		let formSubList = this.formSubmissionErrors;
		const response_Trust = response[0];
		const errTag = 'Business Registration Doc';
		if (response_Trust && response_Trust.document) {
			const isDocValid = this.isDocValid(response_Trust.document.text, fileTypes.BUS_REG_DOC);
			if (!isDocValid) {
				formSubList.push(`Your ${errTag} is either not a valid document or it is but does not match your details above.`);
				this.isLoading = false;
				return;
			}
			// Do DB Dupe Check and Create registration if PASS = True
			this.dbDupeCheckAndRegistrationPost();	
		} else {
			formSubList.push(`We could not verify your ${errTag} document. Please reach out to your contact or try again later`);
			return;	
		}		
	}	

	runValidationLogic_Trust(response: any){
		let formSubList = this.formSubmissionErrors;
		const response_Trust = response[0];
		const errTag = 'Letter of authority';
		if (response_Trust && response_Trust.document) {
			const isDocValid = this.isDocValid(response_Trust.document.text, fileTypes.TRUST_DOC);
			if (!isDocValid) {
				formSubList.push(`Your ${errTag} is either not a valid document or it is but does not match your details above.`);
				this.isLoading = false;
				return;
			}
			// Do DB Dupe Check and Create registration if PASS = True
			this.dbDupeCheckAndRegistrationPost();	
		} else {
			formSubList.push(`We could not verify your ${errTag} document. Please reach out to your contact or try again later`);
			return;	
		}		
	}

	runValidationLogic_Individual(response: any){
		let formSubList = this.formSubmissionErrors;
		const response_POA = response[0];
		const response_ID = response[1];
		const errTag = 'Proof of address';

		if (response_POA && response_POA.document) {
			const isValidPOA = this.isDocValid(response_POA.document.text, fileTypes.PROOF_OF_ADDRESS);
			if (!isValidPOA) {
				formSubList.push(`Your ${errTag} is either not a valid document or it is but does not match your details above.`);
				this.isLoading = false;
				return;
			}
			// Do DB Dupe Check and Create registration if PASS = True
			this.dbDupeCheckAndRegistrationPost();	
		} else {
			formSubList.push(`We could not verify your ${errTag} document. Please reach out to your contact or try again later`);
			return;	
		}

		if (response_ID && response_ID.document) {
			const isValidID =  this.isDocValid(response_ID.document.text, fileTypes.ID);
			if (!isValidID) {
				formSubList.push(`Your ${fileTypes.ID} is either not a valid document or it is but does not match your details above.`);
				this.isLoading = false;
				return;
			}
			// Do DB Dupe Check and Create registration if PASS = True
			this.dbDupeCheckAndRegistrationPost();				
		} else {
			formSubList.push(`We could not verify your ${fileTypes.ID} document. Please reach out to your contact or try again later`);
			return;					
		}			
	}

	isDocValid(dataText: string, fileType: fileTypes): boolean {
		let isTrue = false;
		const text = dataText.toString().toLowerCase();
		const ctrl_surname = this.regForm.controls['lastName'].value;
		switch(fileType) {
			case fileTypes.PROOF_OF_ADDRESS:
				const poa_hasSurname = text.includes(ctrl_surname.toLowerCase());
				const poa_accountNumber = text.includes('account number');
				const poa_registrationNumber = text.includes('registration number');				
				return isTrue = poa_hasSurname && poa_accountNumber && poa_registrationNumber;
				break;
			case fileTypes.ID:
				const hasIDname = text.includes('');
				//const hasIDForeNameTag = text.includes('FORENAMES'.toLowerCase());
				//const hasIDForeNameTag = text.includes('FORENAMES'.toLowerCase());
				return isTrue = false;
				break;
			case fileTypes.TRUST_DOC:
				const ctrl_trustNo = this.regForm.controls['trust_reg_no'].value;
				const hasTrustSurname = text.includes(ctrl_surname.toLowerCase());
				const hasTrustTitle = text.includes('LETTERS OF AUTHORITY'.toLowerCase());
				const controlAct = text.includes('Trust Property Control Act'.toLowerCase());
				const hasTrustNo = text.includes(ctrl_trustNo.toLowerCase());
				return isTrue = hasTrustSurname && hasTrustTitle && controlAct && hasTrustNo;
				break;
			case fileTypes.BUS_REG_DOC:
				const ctrl_regNo = this.regForm.controls['bus_reg_no'].value;
				const hasCommissionerTag = text.includes('issued by the Commissioner of Companies & Intellectual'.toLowerCase());
				const hasCOR143Tag = text.includes('COR 14.3'.toLowerCase());
				const hasEffectiveDate = text.includes('Effective date'.toLowerCase());
				const hasRegNoTitle = text.includes('Registration number'.toLowerCase());
				const hasRegNo = text.includes(ctrl_regNo.toLowerCase());
				return isTrue = hasCommissionerTag && hasCOR143Tag && hasEffectiveDate && hasRegNoTitle && hasRegNo;
				break;								
		}
		return isTrue;
	}

	filterArrByField(arr: any, fieldName: string) {
		const body: IRegistration = this.regForm.value;
	}

	findInvalidControls() {
		const invalid = [];
		const controls = this.regForm.controls;
		for (const name in controls) {
			if (controls[name].invalid) {
				invalid.push(name);
			}
		}
		return invalid;
	}

	fieldValidationChecker() {
		let formSubList = this.formSubmissionErrors;

		/* Check for Validation of Fields first */
		const ctrls = this.regForm.controls;
		const user_id = ctrls['user_id'].value ?? '';
		const bus_reg_no = ctrls['bus_reg_no'].value ?? '';
		const trust_reg_no = ctrls['trust_reg_no'].value ?? '';
		const tax_no = ctrls['tax_no'].value ?? '';
		const passport = ctrls['passport'].value ?? '';
		const swift_code = ctrls['swift_code'].value ?? '';
		const iban = ctrls['iban'].value ?? '';

		// upload fields
		const file_id = ctrls['file_id'].value ?? '';
		const file_bus_reg = ctrls['file_bus_reg'].value ?? '';
		const file_trust = ctrls['file_trust'].value ?? '';
		const file_poa = ctrls['file_poa'].value ?? '';

		if (this.isSACitizen && this.regType === REG_TYPE.IND) {
			if (user_id.length <= 0) formSubList.push('Please fill in your ID number');
			if (user_id.length > 0 && !checkID(user_id)) formSubList.push('Your ID number is invalid');
			if (tax_no.length <= 0) formSubList.push('Please fill in your Tax number');
			if (file_id.length <= 0) formSubList.push('Please Upload a copy of your ID');
			if (file_poa.length <= 0) formSubList.push('Please Upload a copy of your Proof of Address');
		}

		if (this.isForeigner && this.regType === REG_TYPE.IND) {
			if (passport.length <= 0) formSubList.push('Please fill in your Passport number');
		}

		if (this.isForeigner) {
			if (swift_code.length <= 0) formSubList.push('Please fill in your Swift Code number');
			if (iban.length <= 0) formSubList.push('Please fill in your IBAN number');
		}
		
		if (this.regType === REG_TYPE.BUS) {
			if (bus_reg_no.length <= 0) formSubList.push('Please fill in your Business Registration number');
			if (file_bus_reg.length <= 0) formSubList.push('Please Upload a copy of your Business Registration Document');
		}

		if (this.regType === REG_TYPE.TRUST) {
			if (trust_reg_no.length <= 0) formSubList.push('Please fill in your Trust Registration number');
			if (file_trust.length <= 0) formSubList.push('Please Upload a copy of your Letter of Authority');
		}		
	}

	dbDupeCheckAndRegistrationPost() {
		const { localStore } = this;
		const body: IRegistration = this.regForm.value;
		console.log('final Obj for API req: ', body);

		//return;

		const qParams: IRequiredQParams = {
			user_id: body.user_id,
			email: body.email,
			acc_no: body.acc_no,
			passport: body.passport
		}		

		const $ = this.regService.getAll(qParams, this.isSACitizen).subscribe((responseData) => {

			// ***NB: BLOCK registration if data already exists in DB!
			if (responseData.length > 0) {
				this.recordAlreadyExists = true;
				this.isLoading = false;
				return;
			}

			/**
			 * !!!NB: We need to re-format the file_*** form fields
			 *  because at this point it has the entire file payload in it
			 * where all the DB table (and APIs) really need is the [simple file name] format
			 */
			if(typeof body.file_id === 'object') body.file_id = body.file_id.file.name;
			if(typeof body.file_bus_reg === 'object') body.file_bus_reg = body.file_bus_reg.file.name;
			if(typeof body.file_trust === 'object') body.file_trust = body.file_trust.file.name;
			if(typeof body.file_poa === 'object') body.file_poa = body.file_poa.file.name;			


			// BLOCKERS AND CHECKS ALL DONE --- CREATE RECORD!
			this.regService.create(body).pipe(
				delay(4000),
			)
			.subscribe(res => {
				//.log('response from within subscribe method!');
				if (localStore) localStore.setItem('owiqsjdh09192', '1');
				this.applicationInProgress = false;
				this.isLoading = false;

				// Form is Successfully stored in DB ... NOW we can upload File
				/*const myNewFile = new File([this.currentFile], this.dbName, {type: this.currentFile.type});
				this.fileUploadService.upload(myNewFile).subscribe((fileStatus) => {
					console.info('Your File has been SUCCESSFULLY uploaded to the File Server --- Please check folder! :D');
				}, (err) => {
					console.warn('Your File upload has FAILED!!', err);
					this.formSubmissionErrors.push('There was a technical error in our system while uploading files. Please reach out to your contact for help');
					return;					
				})*/				

			}, (err: HttpErrorResponse) => {
				if (err.status === 429) {
					this.rateLimiterActive = true;
				} else {
					this.rateLimiterActive = false;
				}
				this.isLoading = false;
				this.applicationInProgress = false;
				return;
			});

		}, (errResponse: HttpErrorResponse) => {
			console.log('err from regService API req: ', errResponse);
			if (errResponse.status === 429) {
				this.rateLimiterActive = true;
				this.applicationInProgress = false;
			}
			this.isLoading = false;
		})		
	}

}

