import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, combineLatest, delay, forkJoin, Observable, tap } from 'rxjs';
import {
	FormControl, FormGroup, ReactiveFormsModule,
	FormBuilder,
	Validators,
} from '@angular/forms';
import { IRequiredQParams, RegistrationsService } from '../../services/registrations.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IGoogleDoc, UploadGoogleDocService } from '../../services/upload-google-doc.service';
import { FileUploadService } from '../../services/file-upload.service';

const LS_KEY = 'owiqsjdh09192';

const TEXT_ENSURE_ALL_DOCS = `Please ensure all required documents are uploaded before submitting your application`;

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
	file_passport: any;
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
	PASSPORT = 'PASSPORT',
	PROOF_OF_ADDRESS = 'POA',
	BUS_REG_DOC = 'CPIC',
	TRUST_DOC = 'TRUST',
	BANK_CONF_LETTER = 'BCL',
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
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrl: './home.component.css',
})
export class HomeComponent {
	page: number = 1; // when all said and done this final value will be = 1
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
	formSubmissionErrors_PAGE2: Array<string> = [];
	formSubmissionErrors_PAGE3: Array<string> = [];
	rateLimiterActive: boolean = false;
	recordAlreadyExists: boolean = false;
	currentFile: any;
	readerResult: any;
	dbName: string = '';
	surname: string = '';
	//page1IsValid: boolean = true;
	//page2IsValid: boolean = true;
	radioPOPIModel: any;
	radioTandCModel: any;
	emailRegex = /^\S+@\S+\.\S+$/;
	proofOfAddressLabelText: string = 'Upload Proof of Address';

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

			address_1: new FormControl('', [Validators.required]),
			address_2: new FormControl('', [Validators.required]),
			suburb: new FormControl('', [Validators.required]),
			town: new FormControl('', [Validators.required]),
			postal_code: new FormControl('', [Validators.required]),

			acc_holder: new FormControl(''),
			acc_type: new FormControl('', [Validators.required]),
			acc_no: new FormControl(''),
			swift_code: new FormControl(''),
			iban: new FormControl(''),
			bank: new FormControl('', [Validators.required]),
			file_id: new FormControl(''),
			file_passport: new FormControl(''),
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
				this.proofOfAddressLabelText = 'Upload Proof of Address';
				switch(this.regType) {
					case 't': 
						this.proofOfAddressLabelText += ' (for Trust)';
						break;
					case 'b': 
						this.proofOfAddressLabelText += ' (for Business)';
						break;						
				}
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
				case fileTypes.PASSPORT: ctrl['file_passport'].setValue(myNewFile);
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
		this.isLoading = true;
		this.recordAlreadyExists = false;
		const errList = this.formSubmissionErrors_PAGE3;

		if (!this.page3IsValid()) {
			errList.push(TEXT_ENSURE_ALL_DOCS);
			this.isLoading = false;
			return;			
		}

		/** =================================================
		 *  API REFS --- FOREIGNER / PASSPORT
		 * 	=================================================
		 * */ 

		if (this.isForeigner) {
			const errMsg = `Please upload a copy of your Passport`;
			const getCtrl_PASSPORT = this.regForm.controls['file_passport'].value;
			let result_passport = getCtrl_PASSPORT.result;
			if (!result_passport || typeof result_passport === "undefined") {
				this.formSubmissionErrors_PAGE3.push(errMsg);
				this.isLoading = false;
				return;
			}
			const googleDocObj_PASS: IGoogleDoc = {
				skipHumanReview: true,
				rawDocument: {
					mimeType: getCtrl_PASSPORT.file.type,
					content: result_passport.toString().includes('base64') ? result_passport.split('base64,')[1] : result_passport
				}
			}
			const docAI_PASSPORT = this.uploadGoogleDoc.verifyGoogleAIDoc(googleDocObj_PASS, fileTypes.PASSPORT);
			this.forkJoinRunner([docAI_PASSPORT], this.runValidationLogic_Passport.bind(this));
		}		

		/** =================================================
		 *  API REFS --- TYPE: "INDIVIDUAL" - SA CITIZEN
		 * 	=================================================
		 * */ 

		if(this.regType === REG_TYPE.IND && this.isSACitizen) {
			const getCtrl_POA = this.regForm.controls['file_poa'].value;
			let result_poa = getCtrl_POA.result;
			if (!result_poa || typeof result_poa === "undefined") {
				this.formSubmissionErrors_PAGE3.push(`Please upload a copy of your Proof of Address document before continuing`);
				this.isLoading = false;
				return;
			}				
			const googleDocObj_POA: IGoogleDoc = {
				skipHumanReview: true,
				rawDocument: {
					mimeType: getCtrl_POA.file.type,
					content: result_poa.toString().includes('base64') ? result_poa.split('base64,')[1] : result_poa
				}
			}
			const getCtrl_ID = this.regForm.controls['file_id'].value;
			let result_id = getCtrl_ID.result;
			if (!result_id || typeof result_id === "undefined") {
				this.formSubmissionErrors_PAGE3.push(`Please upload a copy of your ID document before continuing`);
				this.isLoading = false;
				return;
			}				
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
		 *  API REFS --- TYPE: "BUSINESS"
		 * 	=================================================
		 * */

		if(this.regType === REG_TYPE.TRUST) {
			const getCtrl_TRUST = this.regForm.controls['file_trust'].value;
			let result_trust = getCtrl_TRUST.result;
			if (!result_trust || typeof result_trust === "undefined") {
				this.formSubmissionErrors_PAGE3.push(`Please upload a copy of your Trust document before continuing`);
				this.isLoading = false;
				return;
			}			
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
			if (!result_bus_reg || typeof result_bus_reg === "undefined") {
				this.formSubmissionErrors_PAGE3.push(`Please upload a copy of your Business Registration document before continuing`);
				this.isLoading = false;
				return;
			}
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
			if (err.status === 413 && err.message && err.message.includes('Payload Too Large')) {
				this.formSubmissionErrors_PAGE3.push('The sizes of one or more of your files are too large. We allow a maximum size of 10Mb per file');
				return;
			}
			if (err.status === 429 && err.message && err.message.includes('Too Many Requests')) {
				this.formSubmissionErrors_PAGE3.push(`Our system is currently experiencing lots of traffic. We do apologize for the inconvenience and ask that you try again later`);
				return;
			}			
			this.formSubmissionErrors_PAGE3.push(err.error?.error?.message ?? 'There was a Google API request error while trying to verify your details')
			return;
		})
	}

	runValidationLogic_Passport(response: any) {
		let formSubList = this.formSubmissionErrors_PAGE3;
		const response_Passport = response[0];
		const errTag = 'Passport Doc';
		if (response_Passport && response_Passport.document) {
			const isDocValid = this.isDocValid(response_Passport.document, fileTypes.PASSPORT);
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

	runValidationLogic_BusReg(response: any){
		let formSubList = this.formSubmissionErrors_PAGE3;
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
		let formSubList = this.formSubmissionErrors_PAGE3;
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
		//let formSubList = this.formSubmissionErrors;
		let formSubList = this.formSubmissionErrors_PAGE3;
		const response_POA = response[0];
		const response_ID = response[1];
		const errTag = 'Proof of address';

		if (response_POA && response_POA.document && response_ID && response_ID.document) {
			const isValidPOA = this.isDocValid(response_POA.document.text, fileTypes.PROOF_OF_ADDRESS);
			const isValidID =  this.isDocValid(response_ID.document, fileTypes.ID);
			if (!isValidPOA) {
				formSubList.push(`Your ${errTag} is either not a valid document or it is but does not match your details above.`);
				this.isLoading = false;
				return;
			} else if (!isValidID) {
				formSubList.push(`Your ${fileTypes.ID} is either not a valid document or it is but does not match your details above.`);
				this.isLoading = false;
				return;
			} else {
				// Do DB Dupe Check and Create registration if PASS = True
				this.dbDupeCheckAndRegistrationPost();	
			}
		} else {
			formSubList.push(`We could not verify your ${errTag} document. Please reach out to your contact or try again later`);
			return;	
		}		
	}

	isDocValid(dataText: any, fileType: fileTypes): boolean {
		let isTrue = false;
		if (!dataText && !dataText.entities) {
			return false;
		}
		const text = dataText.toString().toLowerCase();
		const ctrl_surname = this.regForm.controls['lastName'].value;
		const ctrl_userID = this.regForm.controls['user_id'].value;
		const ctrl_userPassport = this.regForm.controls['passport'].value;
		switch(fileType) {
			case fileTypes.PASSPORT:
				const document_pass = dataText.text.toString().toLowerCase();
				const arr_pass = dataText.entities[3];
				const getPassportNo = arr_pass && arr_pass.mentionText ? arr_pass.mentionText.replace(/\s/g, '') : '';
				const pass_hasSurname = document_pass.includes(ctrl_surname.toLowerCase());
				const isPassportsMatching = getPassportNo === ctrl_userPassport;
				const pass_nationality = document_pass.includes('Nationality'.toLowerCase());
				const pass_sex = document_pass.includes('Sex'.toLowerCase());
				const pass_dateOfIssue = document_pass.includes('Date of issue'.toLowerCase());
				return isTrue = pass_hasSurname && isPassportsMatching && pass_nationality && pass_sex && pass_dateOfIssue;
				break;
			case fileTypes.PROOF_OF_ADDRESS:
				const poa_hasSurname = text.includes(ctrl_surname.toLowerCase());
				const poa_hasValidDate = true;
				const poa_hasValidAddress = true;
				return isTrue = poa_hasSurname;
				break;
			case fileTypes.ID:
				const document = dataText.text.toString().toLowerCase();
				const arr = dataText.entities[3];
				const getIDNo = arr && arr.mentionText ? arr.mentionText.replace(/\s/g, '') : '';
				const isIDsMatching = getIDNo === ctrl_userID;
				const id_hasSurname = document.includes(ctrl_surname.toLowerCase());
				const id_hasForenames = document.includes('FORENAMES'.toLowerCase());
				const id_hasDateIssued = document.includes('DATE ISSUED'.toLowerCase());
				const id_hasCountryOfBirth = document.includes('COUNTRY OF BIRTH'.toLowerCase());
				return isTrue = id_hasSurname && id_hasForenames && id_hasDateIssued && id_hasCountryOfBirth && isIDsMatching;
				break;
			case fileTypes.TRUST_DOC:
				const ctrl_trustNo = this.regForm.controls['trust_reg_no'].value;
				const getTrustNo = ctrl_trustNo && ctrl_trustNo.length > 0 ? ctrl_trustNo.replace(/\s/g, '') : '';
				const hasTrustSurname = text.includes(ctrl_surname.toLowerCase());
				const hasTrustTitle = text.includes('LETTERS OF AUTHORITY'.toLowerCase());
				const controlAct = text.includes('Trust Property Control Act'.toLowerCase());
				const hasTrustNo = text.includes(getTrustNo.toLowerCase());
				return isTrue = hasTrustSurname && hasTrustTitle && controlAct && hasTrustNo;
				break;
			case fileTypes.BUS_REG_DOC:
				const ctrl_regNo = this.regForm.controls['bus_reg_no'].value;
				const getBusRegNo = ctrl_regNo && ctrl_regNo.length > 0 ? ctrl_regNo.replace(/\s/g, '') : '';
				const hasCommissionerTag = text.includes('issued by the Commissioner of Companies & Intellectual'.toLowerCase());
				const hasCOR143Tag = text.includes('COR 14.3'.toLowerCase());
				const hasEffectiveDate = text.includes('Effective date'.toLowerCase());
				const hasRegNoTitle = text.includes('Registration number'.toLowerCase());
				const hasRegNo = text.includes(getBusRegNo.toLowerCase());
				return isTrue = hasCommissionerTag && hasCOR143Tag && hasEffectiveDate && hasRegNoTitle && hasRegNo;
				break;								
		}
		return isTrue
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
		const passport = ctrls['passport'].value ?? '';
		const swift_code = ctrls['swift_code'].value ?? '';
		const iban = ctrls['iban'].value ?? '';

		// upload fields
		const file_id = ctrls['file_id'].value ?? '';
		const file_passport = ctrls['file_passport'].value ?? '';
		const file_bus_reg = ctrls['file_bus_reg'].value ?? '';
		const file_trust = ctrls['file_trust'].value ?? '';
		const file_poa = ctrls['file_poa'].value ?? '';

		if (this.isSACitizen) {
			if (user_id.length <= 0) formSubList.push('Please fill in your ID number');
			if (user_id.length > 0 && !checkID(user_id)) formSubList.push('Your ID number is invalid');
			if (file_id.length <= 0) formSubList.push('Please Upload a copy of your ID');
			if (file_poa.length <= 0) formSubList.push('Please Upload a copy of your Proof of Address');
		}

		if (this.isForeigner) {
			if (passport.length <= 0) formSubList.push('Please fill in your Passport number');
			if (file_passport.length <= 0) formSubList.push('Please Upload a copy of your Passport');
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
		if (this.formSubmissionErrors_PAGE3.length > 0) {
			return;
		}		
		const { localStore } = this;
		const body: IRegistration = this.regForm.value;
		const bodyCopyForFileUploads = Object.assign({}, body);

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
			if(typeof body.file_passport === 'object') body.file_passport = body.file_passport.file.name;
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

				// Form is Successfully stored in DB ... NOW we can upload Files

				if (this.regType === REG_TYPE.TRUST) {
					const trustObj: File = bodyCopyForFileUploads.file_trust.file;
					const myNewFile_trust = new File([trustObj], trustObj.name, {type: trustObj.type});
					this.fileUploadService.upload(myNewFile_trust).subscribe((resp) => {
						console.log('YES MAN!! File successfully uploaded! :DD');
						this.applicationInProgress = false;
						this.isLoading = false;						
					}, (err: HttpErrorResponse) => console.log('OH CRAP! TRUST File upload FAILED! :((( '));
				}
		
				if (this.regType === REG_TYPE.BUS) {
					const busObj: File = bodyCopyForFileUploads.file_bus_reg.file;
					const myNewFile_bus = new File([busObj], busObj.name, {type: busObj.type});
					this.fileUploadService.upload(myNewFile_bus).subscribe((resp) => {
						console.log('YES MAN!! File successfully uploaded! :DD');
						this.applicationInProgress = false;
						this.isLoading = false;						
					}, (err: HttpErrorResponse) => console.log('OH CRAP! BUS DOC File upload FAILED! :((( '));
				}		
		
				if (this.isSACitizen && this.regType === REG_TYPE.IND) {
					const Obj_POA: File = bodyCopyForFileUploads.file_poa.file;
					const Obj_ID: File = bodyCopyForFileUploads.file_id.file;
					const myNewFile_POA = new File([Obj_POA], Obj_POA.name, {type: Obj_POA.type});
					const myNewFile_ID = new File([Obj_ID], Obj_ID.name, {type: Obj_ID.type});
		
					const API_POA = this.fileUploadService.upload(myNewFile_POA);
					const API_ID = this.fileUploadService.upload(myNewFile_ID);
		
					forkJoin(([API_POA, API_ID])).subscribe((resp) => {
						this.applicationInProgress = false;
						this.isLoading = false;						
						console.log('YES MAN!! POA and ID files were successfully uploaded! :DD');
					}, (err: HttpErrorResponse) => console.log('OH CRAP! POA and ID File uploads have FAILED! :((( '));			
				}

				if (this.isForeigner) {
					const Obj_PASSPORT: File = bodyCopyForFileUploads.file_passport.file;
					const myNewFile_PASSPORT = new File([Obj_PASSPORT], Obj_PASSPORT.name, {type: Obj_PASSPORT.type});
					const API_PASSPORT = this.fileUploadService.upload(myNewFile_PASSPORT);
					forkJoin(([API_PASSPORT])).subscribe((resp) => {
						this.applicationInProgress = false;
						this.isLoading = false;
						console.log('YES MAN!! PASSPORT file was successfully uploaded! :DD');
					}, (err: HttpErrorResponse) => console.log('OH CRAP! PASSPORT File uploads have FAILED! :((( '));	
				}

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
			} else {
				this.formSubmissionErrors_PAGE3.push('System error: We could not connect to our services. Please try again later.')
			}
			this.isLoading = false;
		})		
	}

	page2IsValid(){
		this.formSubmissionErrors_PAGE2.length = 0;
		let formSubList = this.formSubmissionErrors_PAGE2;

		/* Fields to validate */
		const ctrls = this.regForm.controls;
		const reg_type = ctrls['reg_type'].value ?? '';
		const firstname = ctrls['firstName'].value ?? '';
		const lastname = ctrls['lastName'].value ?? '';
		const citizenStatus = ctrls['citizenStatus'].value ?? '';
		const cellphone = ctrls['cell'].value ?? '';
		const email = ctrls['email'].value ?? '';
		const emailIsValid = this.emailRegex.test(email);
		const user_id = ctrls['user_id'].value ?? '';
		const passport = ctrls['passport'].value ?? '';
		const numbersOnly = /^\d+$/;

		// Address
		const address_1 = ctrls['address_1'].value ?? '';
		const address_2 = ctrls['address_2'].value ?? '';
		const suburb = ctrls['suburb'].value ?? '';
		const town = ctrls['town'].value ?? '';
		const postal_code = ctrls['postal_code'].value ?? '';	

		if (citizenStatus.length <= 0) formSubList.push('Please select your Citizen status (SA / Foreigner) under "I am a"');
		if (this.isSACitizen) {
			if (user_id.length <= 0) formSubList.push('Please fill in your ID number');
			if (user_id.length > 0 && !checkID(user_id)) formSubList.push('Your ID number is invalid');
		}
		if (reg_type.length <= 0) formSubList.push('Please choose your Registration Type');
		if (firstname.length <= 0) formSubList.push('First name');
		if (lastname.length <= 0) formSubList.push('Last name');
		if (cellphone.length <= 0) formSubList.push('Cellphone number');
		if (cellphone.length > 0 && cellphone.length < 10) formSubList.push('Cellphone must be 10 or more digits');
		if (!numbersOnly.test(cellphone)) formSubList.push('Cellphone must be numbers only');
		if (email.length <= 0) formSubList.push('Email address');
		if (email.length > 0 && !emailIsValid) formSubList.push('Email address is not valid');

		// Address
		if (address_1.length <= 0 && this.regType === REG_TYPE.IND) formSubList.push('Please complete address 1 field');
		if (address_2.length <= 0 && this.regType === REG_TYPE.IND) formSubList.push('Please complete address 2 field');
		if (suburb.length <= 0 && this.regType === REG_TYPE.IND) formSubList.push('Please complete your Suburb');
		if (town.length <= 0 && this.regType === REG_TYPE.IND) formSubList.push('Please complete your Town');
		if (postal_code.length <= 0 && this.regType === REG_TYPE.IND) formSubList.push('Please complete your Postal code');

		if (this.isForeigner) {
			if (passport.length <= 0) formSubList.push('Please fill in your Passport number');			
		}

		return formSubList.length <= 0;
	}

	page3IsValid(){
		this.formSubmissionErrors_PAGE3.length = 0;
		let formSubList = this.formSubmissionErrors_PAGE3;
		const reg = this.regType;

		/* Fields to validate */
		const ctrls = this.regForm.controls;
		const bus_reg_no = ctrls['bus_reg_no'].value ?? '';
		const trust_reg_no = ctrls['trust_reg_no'].value ?? '';
		const swift_code = ctrls['swift_code'].value ?? '';
		const iban = ctrls['iban'].value ?? '';		

		if (bus_reg_no.length <= 0 && reg === REG_TYPE.BUS) formSubList.push('Please fill in your Business Registration number');
		if (trust_reg_no.length <= 0 && reg === REG_TYPE.TRUST) formSubList.push('Please fill in your Trust Registration number');
		if (swift_code.length <= 0 && this.isForeigner) formSubList.push('Please fill in your Swift Code');
		if (iban.length <= 0 && this.isForeigner) formSubList.push('Please fill in your IBAN number');

		return formSubList.length <= 0;			
	}	

	clearAddressFields() {
		const ctrls = this.regForm.controls;
		ctrls['address_1'].setValue('');
		ctrls['address_2'].setValue('');
		ctrls['suburb'].setValue('');
		ctrls['town'].setValue('');
		ctrls['postal_code'].setValue('');
		this.regForm.updateValueAndValidity();	
	}

	nextPage(){
		const { page } = this;
		if (page === 2 && !this.page2IsValid()) return;
		if (this.regType !== REG_TYPE.IND) this.clearAddressFields();
		this.formSubmissionErrors_PAGE2.length = 0;
		this.formSubmissionErrors_PAGE3.length = 0;
		this.page++;
	}

	previousPage(){
		this.page--;
	}

}

