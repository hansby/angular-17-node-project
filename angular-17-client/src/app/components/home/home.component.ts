import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, catchError, delay, forkJoin, Observable } from 'rxjs';
import {
	FormControl, FormGroup, FormBuilder, Validators,
} from '@angular/forms';
import { IRequiredQParams, RegistrationsService } from '../../services/registrations.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IGoogleDoc, UploadGoogleDocService } from '../../services/upload-google-doc.service';
import { FileUploadService } from '../../services/file-upload.service';
import { LoggerService } from '../../services/logger.service';

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
	bank_other: string;
	bank: string;
	file_id: any;
	file_poa: any;
	file_bus_reg: any;
	file_trust: any;
	file_passport: any;
	file_bcl: any;
	file_bcl_bustrust: any;
	file_poa_bustrust: any;
	passport: string;	
	user_id: string;
	updatedAt?: string,
	createdAt?: string,
}

export enum fileTypes {
	ID = 'ID',
	PASSPORT = 'PASSPORT',
	PROOF_OF_ADDRESS = 'POA',
	BUS_REG_DOC = 'CPIC',
	TRUST_DOC = 'TRUST',
	BANK_CONF_LETTER = 'BCL',
	BANK_CONF_LETTER_BUSTRUST = 'BCL_BUSTRUST',
	PROOF_OF_ADDRESS_BUSTRUST = 'POA_BUSTRUST'
}

export enum REG_TYPE {
	IND = 'individual',
	BUS = 'business',
	TRUST = 'trust'
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
	page: number = 2; // when all said and done this final value will be = 1
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
		private loggerService: LoggerService
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
			address_2: new FormControl(''),
			suburb: new FormControl('', [Validators.required]),
			town: new FormControl('', [Validators.required]),
			postal_code: new FormControl('', [Validators.required]),

			acc_holder: new FormControl(''),
			acc_type: new FormControl('', [Validators.required]),
			acc_no: new FormControl(''),
			swift_code: new FormControl(''),
			iban: new FormControl(''),
			bank_other: new FormControl(''),
			bank: new FormControl('', [Validators.required]),
			file_id: new FormControl(''),
			file_passport: new FormControl(''),
			
			file_bus_reg: new FormControl(''),
			file_trust: new FormControl(''),
			
			file_bcl: new FormControl(''),
			file_bcl_bustrust: new FormControl(''),

			file_poa_bustrust: new FormControl(''),
			file_poa: new FormControl(''),

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
				/*switch(this.regType) {
					case 't': 
						this.proofOfAddressLabelText += ' (for Trust)';
						break;
					case 'b': 
						this.proofOfAddressLabelText += ' (for Business)';
						break;						
				}*/
		})

		const listener_CitizenStatus$ = ctrls['citizenStatus'].valueChanges;
		const $_citizenStatus = listener_CitizenStatus$
			.subscribe(([status]) => {
				this.formSubmissionErrors.length = 0; // reset UI Error list
				this.isSACitizen = status === 'c';
				this.isForeigner = status === 'f';
				if (status === 'f') { // update Bank list on page 2
					this.banks = this.banks_namibia;
				} else {
					this.banks = this.allSaBanks;
				}
				this.regForm.controls['bank'].reset();
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
	];

	allSaBanks: Array<IIdentity> = [
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

	banks_namibia: Array<IIdentity> = [
		{name: 'ABSA BANK NAMIBIA LIMITED', id: 'nam_absa'},
		{name: 'BANK WINDHOEK LIMITED', id: 'nam_windhoek' },
		{name: 'BANK OF NAMIBIA', id: 'nam_bank_of_namibia'},
		{name: 'CITY SAVINGS AND INVESTMENT BANK HOLDINGS LTD.', id: 'nam_city_savings'},
		{name: 'FIRST NATIONAL BANK OF NAMIBIA LIMITED', id: 'nam_fnb'},
		{name: 'SIMONIS STORM SECURITIES (PTY) LTD', id: 'nam_simonis'},
		{name: 'INVESTMENT HOUSE NAMIBIA (PTY) LTD', id: 'nam_investment_house'},
		{name: 'LETSHEGO BANK NAMIBIA LIMITED', id: 'nam_letshego'},
		{name: 'NAMCLEAR (PTY) LIMITED', id: 'nam_namclear'},
		{name: 'CIRRUS SECURITIES (PTY) LTD', id: 'nam_cirrus'},
		{name: 'NEDBANK NAMIBIA LIMITED', id: 'nam_nedbank'},
		{name: 'STANDARD BANK NAMIBIA LIMITED', id: 'nam_standard_bank'},
		{name: 'TRUSTCO BANK NAMIBIA', id: 'nam_trustco'},
		{name: 'BANCO PRIVADO ATLANTICO', id: 'nam_banco_privado_atlantico'},
		{name: 'FIRST NATIONAL BANK OF NAMIBIA LIMITED', id: 'nam_fnb'},
		{name: 'STANDARD BANK NAMIBIA LIMITED', id: 'nam_standard_bank'},
		{name: 'IJG SECURITIES (PTY) LTD', id: 'nam_ijg_securities'},
		{name: 'ORNATE INVESTMENT BANK TRUST', id: 'nam_ornate_investment_bank'},
		{name: 'NAMIBIA POST LTD', id: 'nam_namibia_post'},
		{name: 'BANK BIC NAMIBIA LIMITED', id: 'nam_bank_bic'},
		{name: 'RMB NAMIBIA', id: 'nam_rmb'},
		{name: 'Other', id: 'bank_other'},
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
			const name = ctrl['firstName'].value;
			const surname = ctrl['lastName'].value;
			const id = ctrl['user_id'].value;
			const passport = ctrl['passport'].value;

			let type = event.file.type;
			let finalType = type.slice(type.indexOf('/') + 1, type.length);
			if (finalType.includes('sheet')) finalType = 'xls';
			if (finalType.includes('presentation')) finalType = 'pptx';
			if (finalType.includes('document')) finalType = 'doc';

			const DBName = `${surname} ${name} - ${fileType === fileTypes.TRUST_DOC ? 'LOA' : fileType} - ${this.isSACitizen ? id : passport}.${finalType}`;
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
				case fileTypes.PROOF_OF_ADDRESS_BUSTRUST: ctrl['file_poa_bustrust'].setValue(myNewFile);
					break;													
				case fileTypes.BANK_CONF_LETTER: ctrl['file_bcl'].setValue(myNewFile);
					break;		
				case fileTypes.BANK_CONF_LETTER_BUSTRUST: ctrl['file_bcl_bustrust'].setValue(myNewFile);
					break;																				
			}
		}
	}

	submitForm() {
		this.isLoading = true;
		this.recordAlreadyExists = false;
		const errList = this.formSubmissionErrors_PAGE3;
		const ctrls = this.regForm.controls;
		const user = {
			name: `${ctrls['firstName'].value} ${ctrls['lastName'].value}`,
			user_id: ctrls['user_id'].value,
			bus_reg_no: ctrls['bus_reg_no'].value,
			trust_reg_no: ctrls['trust_reg_no'].value,
		}
			
		if (!this.page3IsValid()) {
			errList.push(TEXT_ENSURE_ALL_DOCS);
			this.isLoading = false;
			return;
		}

		/** =========================================================================
		 *  NEW UPLOAD DOC STRUCTURE - LEFT COLUMN: FOR BUS and TRUST UPLOAD FIELDS
		 * 	=========================================================================
		 * */
		if (this.regType === REG_TYPE.BUS || this.regType === REG_TYPE.TRUST) {
			this.fileUploadValidationTemplate('file_bcl_bustrust', 'Bank confirmation letter', fileTypes.BANK_CONF_LETTER, user, this.runValidationLogic_BusReg_BCL);
			this.fileUploadValidationTemplate('file_poa_bustrust', `Proof of Address (${this.regType})`, fileTypes.PROOF_OF_ADDRESS, user, this.runValidationLogic_BusReg_POA);
			this.fileUploadValidationTemplate('file_poa', 'Proof of Address (individual)', fileTypes.PROOF_OF_ADDRESS, user, this.runValidationLogic_Individual_POA);
			if (this.isSACitizen) {
				this.fileUploadValidationTemplate('file_id', 'ID', fileTypes.ID, user, this.runValidationLogic_Individual_ID);
			}
			if (this.isForeigner) {
				this.fileUploadValidationTemplate('file_passport', 'Passport', fileTypes.PASSPORT, user, this.runValidationLogic_Passport);
			}			
		}
		if (this.regType === REG_TYPE.BUS) {
			this.fileUploadValidationTemplate('file_bus_reg', 'Business Registration', fileTypes.PASSPORT, user, this.runValidationLogic_BusReg);
		}
		if (this.regType === REG_TYPE.TRUST) {
			this.fileUploadValidationTemplate('file_trust', 'Letter of authority', fileTypes.TRUST_DOC, user, this.runValidationLogic_Trust);
		}		

		/** =========================================================================
		 *  NEW UPLOAD DOC STRUCTURE - RIGHT COLUMN: FOR IND UPLOAD FIELDS
		 * 	=========================================================================
		 * */

		if (this.regType === REG_TYPE.IND) {
			this.fileUploadValidationTemplate('file_bcl', 'Bank confirmation letter', fileTypes.BANK_CONF_LETTER, user, this.runValidationLogic_Individual_BCL);
			this.fileUploadValidationTemplate('file_poa', 'Proof of Address', fileTypes.PROOF_OF_ADDRESS, user, this.runValidationLogic_Individual_POA);
			if (this.isSACitizen) {
				this.fileUploadValidationTemplate('file_id', 'ID', fileTypes.ID, user, this.runValidationLogic_Individual_ID);
			}
			if (this.isForeigner) {
				this.fileUploadValidationTemplate('file_passport', 'Passport', fileTypes.PASSPORT, user, this.runValidationLogic_Passport);
			}			
		}
		
	}

	/** NEW GENERIC VALIDATION TEMPLATE */
	fileUploadValidationTemplate(ctrl: string, errorTag: string, fileType: fileTypes, user: any, cb: Function) {
		const ctrlValue = this.regForm.controls[ctrl].value;
		let result = ctrlValue.result;
		if (!result || typeof result === "undefined") {
			this.formSubmissionErrors_PAGE3.push(`Please upload a copy of your ${errorTag} document before continuing`);
			this.isLoading = false;
			return;
		}			
		const googleDocObj: IGoogleDoc = {
			skipHumanReview: true,
			rawDocument: {
				mimeType: ctrlValue.file.type,
				content: result.toString().includes('base64') ? result.split('base64,')[1] : result
			}
		}			
		const docAI = this.uploadGoogleDoc.verifyGoogleAIDoc(googleDocObj, fileType).pipe(
			catchError((err: HttpErrorResponse) => this.loggerService.sendLog(`verifyGoogleAIDoc API ERROR - ${errorTag}: ${user}`))
		);		
		if (this.formSubmissionErrors_PAGE3.length <= 0) { // if no errors so far, run the docAI call
			this.forkJoinRunner([docAI], cb.bind(this));
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
		this.runValidationLogicHelper('Passport Doc', response[0], fileTypes.PASSPORT);
	}

	runValidationLogic_BusReg(response: any){
		this.runValidationLogicHelper('Business Registration Doc', response[0], fileTypes.BUS_REG_DOC);	
	}	

	runValidationLogic_Trust(response: any){
		this.runValidationLogicHelper('Letter of authority', response[0], fileTypes.TRUST_DOC);
	}

	runValidationLogic_Individual_BCL(response: any){
		this.runValidationLogicHelper('Bank confirmation letter', response[0], fileTypes.BANK_CONF_LETTER);
	}	

	runValidationLogic_BusReg_BCL(response: any){
		this.runValidationLogicHelper('Bank confirmation letter', response[0], fileTypes.BANK_CONF_LETTER);
	}	

	runValidationLogic_BusReg_POA(response: any){
		this.runValidationLogicHelper('Proof of address', response[0], fileTypes.PROOF_OF_ADDRESS);
	}	

	runValidationLogic_Individual_POA(response: any){
		this.runValidationLogicHelper('Proof of address', response[0], fileTypes.PROOF_OF_ADDRESS);
	}

	runValidationLogic_Individual_ID(response: any){
		this.runValidationLogicHelper('ID', response[0], fileTypes.ID);
	}	

	runValidationLogicHelper(errTag: string, response: any, fileType: fileTypes){
		let formSubList = this.formSubmissionErrors_PAGE3;
		if (response && response.document) {
			const isValid = this.isDocValid(response.document.text, fileType);
			if (!isValid) {
				formSubList.push(`Your ${errTag} is either not a valid document or it is but does not match your details above.`);
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
		const ctrls = this.regForm.controls;
		let isTrue = false;
		if (!dataText && !dataText.entities) {
			return false;
		}
		const text = dataText.toString().toLowerCase();
		const ctrl_surname = ctrls['lastName'].value;
		const ctrl_userID = ctrls['user_id'].value;
		const ctrl_userPassport = ctrls['passport'].value;

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
				const address1 = text.includes(ctrls['address_1'].value.toLowerCase());
				const address2 = text.includes(ctrls['address_2'].value.toLowerCase());
				const suburb = text.includes(ctrls['suburb'].value.toLowerCase());
				const town = text.includes(ctrls['town'].value.toLowerCase());
				const postal_code = text.includes(ctrls['postal_code'].value.toLowerCase());	
				const poa_hasAccNo = text.includes('account number');
				const poa_hasAddress = (address1 || address2) && suburb && postal_code && town;
				return isTrue = poa_hasAccNo && poa_hasAddress;
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
			passport: body.passport,
			bus_reg_no: body.bus_reg_no,
			trust_reg_no: body.trust_reg_no
		}		

		const $ = this.regService.getAll(qParams, this.regType, this.isSACitizen).subscribe((responseData) => {

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
			
			if(typeof body.file_bcl === 'object') body.file_bcl = body.file_bcl.file.name;
			if(typeof body.file_bcl_bustrust === 'object') body.file_bcl_bustrust = body.file_bcl_bustrust.file.name;
			if(typeof body.file_poa_bustrust === 'object') body.file_poa_bustrust = body.file_poa_bustrust.file.name;
			
			
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
						this.loggerService.sendLog(`TRUST DOC UPLOAD FILE SUCCESS!: ${qParams}`);
						this.applicationInProgress = false;
						this.isLoading = false;						
					}, (err: HttpErrorResponse) => this.loggerService.sendLog(`TRUST DOC UPLOAD FILE ERROR!: ${qParams}`));
				}
		
				if (this.regType === REG_TYPE.BUS) {
					const busObj: File = bodyCopyForFileUploads.file_bus_reg.file;
					const myNewFile_bus = new File([busObj], busObj.name, {type: busObj.type});
					this.fileUploadService.upload(myNewFile_bus).subscribe((resp) => {
						this.loggerService.sendLog(`BUS DOC UPLOAD FILE SUCCESS!: ${qParams}`);
						this.applicationInProgress = false;
						this.isLoading = false;						
					}, (err: HttpErrorResponse) => this.loggerService.sendLog(`BUS DOC UPLOAD FILE ERROR!: ${qParams}`));
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
						this.loggerService.sendLog(`Proof of Address / ID doc UPLOAD FILE SUCCESS!: ${qParams}`);
					}, (err: HttpErrorResponse) => this.loggerService.sendLog(`Proof of Address / ID doc UPLOAD FILE Failed: ${qParams}`));			
				}

				if (this.isForeigner) {
					const Obj_PASSPORT: File = bodyCopyForFileUploads.file_passport.file;
					const myNewFile_PASSPORT = new File([Obj_PASSPORT], Obj_PASSPORT.name, {type: Obj_PASSPORT.type});
					const API_PASSPORT = this.fileUploadService.upload(myNewFile_PASSPORT);
					forkJoin(([API_PASSPORT])).subscribe((resp) => {
						this.applicationInProgress = false;
						this.isLoading = false;
						this.loggerService.sendLog(`Passport UPLOAD FILE SUCCESS!: ${qParams}`);
					}, (err: HttpErrorResponse) => this.loggerService.sendLog(`Passport UPLOAD FILE FAILED!: ${qParams}`));	
				}

			}, (err: HttpErrorResponse) => {
				if (err.status === 429) {
					this.rateLimiterActive = true;
					this.loggerService.sendLog(`Rate Limit Kicked in - Blocked Reqs!: ${qParams}`);
				} else {
					this.rateLimiterActive = false;
				}
				this.isLoading = false;
				this.applicationInProgress = false;
				return;
			});

		}, (errResponse: HttpErrorResponse) => {
			console.log('err from regService API req: ', errResponse);
			this.loggerService.sendLog(`err from regService API req: ${qParams}, ${errResponse}`);
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
		//if (address_2.length <= 0 && this.regType === REG_TYPE.IND) formSubList.push('Please complete address 2 field');
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
		const bank = ctrls['bank'].value ?? '';
		const bank_other = ctrls['bank_other'].value ?? '';		

		if (bus_reg_no.length <= 0 && reg === REG_TYPE.BUS) formSubList.push('Please fill in your Business Registration number');
		if (trust_reg_no.length <= 0 && reg === REG_TYPE.TRUST) formSubList.push('Please fill in your Trust Registration number');
		if (swift_code.length <= 0 && this.isForeigner) formSubList.push('Please fill in a valid Swift Code');
		if (iban.length <= 0 && this.isForeigner) formSubList.push('Please fill in a valid IBAN number');
		if (bank === 'bank_other' && bank_other.length <= 0) formSubList.push('Please select your Bank from the prescribed list or enter it manually in the "Bank (Other)" field');
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

