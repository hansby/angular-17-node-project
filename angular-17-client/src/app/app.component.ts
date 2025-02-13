import { Component, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { BehaviorSubject, combineLatest, delay, tap } from 'rxjs';
import {
	FormControl, FormGroup, ReactiveFormsModule,
	FormBuilder,
	Validators,
	ValidatorFn,
	FormArray,
	AbstractControl,
} from '@angular/forms';
import { IRequiredQParams, RegistrationsService } from './services/registrations.service';
import { HttpErrorResponse } from '@angular/common/http';

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
	file_id: string;
	file_poa: string;
	file_bus_reg: string;
	file_trust: string;
	passport: string;	
	user_id: string;
	updatedAt?: string,
	createdAt?: string,
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

	/*
	if (!((tempDate.getFullYear() == idNumber.substring(0, 2)) && (id_month == idNumber.substring(2, 4) - 1) && (id_date == idNumber.substring(4, 6)))) {
			correct = false;
	}*/

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
  //imports: [CommonModule, ReactiveFormsModule],
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

	constructor(
		private fb: FormBuilder, 
		private regService: RegistrationsService,
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
			citizenStatus: new FormControl('')
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
    //console.log(value);
		//this.regForm.controls['reg_type'].setValue(value);
		this.regType = value;
  }

  updateBank(value: string) {
    //console.log(value);
		this.regForm.controls['bank'].setValue(value);
  }	

  updateAccType(value: string) {
		this.regForm.controls['acc_type'].setValue(value);
  }

	updateDBName(file: File | undefined, fileType: fileTypes) {
		if (file) {
			const ctrl = this.regForm.controls;
			console.log('event emitter value: ', file);
			const name = ctrl['firstName'].value;
			const surname = ctrl['lastName'].value;
			const id = ctrl['user_id'].value;
			const passport = ctrl['passport'].value;

			let type = file.type;
			let finalType = type.slice(type.indexOf('/') + 1, type.length);
			if (finalType.includes('sheet')) finalType = 'xls';
			if (finalType.includes('presentation')) finalType = 'pptx';
			if (finalType.includes('document')) finalType = 'doc';
			
			const DBName = `${surname} ${name} - ${fileType} - ${id}.${finalType}`;
			console.log('DBName for upload: ', DBName);

			switch (fileType) {
				case fileTypes.ID: ctrl['file_id'].setValue(DBName);
					break;
				case fileTypes.BUS_REG_DOC: ctrl['file_bus_reg'].setValue(DBName);
					break;	
				case fileTypes.TRUST_DOC: ctrl['file_trust'].setValue(DBName);
					break;
				case fileTypes.PROOF_OF_ADDRESS: ctrl['file_poa'].setValue(DBName);
					break;																				
			}

		}
	}

  submitForm() {
		let formSubList = this.formSubmissionErrors;
		formSubList.length = 0;
		this.isLoading = true;
		const { localStore } = this;

		/* Check for Validation of Fields first */
		const ctrls = this.regForm.controls;
		const user_id = ctrls['user_id'].value;
		const bus_reg_no = ctrls['bus_reg_no'].value;
		const trust_reg_no = ctrls['trust_reg_no'].value;
		const tax_no = ctrls['tax_no'].value;
		const passport = ctrls['passport'].value;

		if (this.isSACitizen && this.regType === REG_TYPE.IND) {
			if (user_id.length <= 0) formSubList.push('Please fill in your ID number');
			if (user_id.length > 0 && !checkID(user_id)) formSubList.push('Your ID number is invalid');
			if (tax_no.length <= 0) formSubList.push('Please fill in your Tax number');
			this.isLoading = false;
		}

		if (this.isForeigner) {
			if (passport.length <= 0) formSubList.push('Please fill in your Passport number');
			this.isLoading = false;
		}
		
		if (this.regType === REG_TYPE.BUS) {
			if (bus_reg_no.length <= 0) formSubList.push('Please fill in your Business Registration number');
			this.isLoading = false;
		}		

		alert('YO 1');

		if (this.regType === REG_TYPE.TRUST) {
			if (trust_reg_no.length <= 0) formSubList.push('Please fill in your Tax Registration number');
			this.isLoading = false;
		}		

		alert('YO 2');
		
		if(formSubList.length > 0) return;

		// const params = { ... } *** EG: /api/registrations?acc_no=81711&email=hansby

		const body: IRegistration = this.regForm.value;
		console.log('final Obj for API req: ', body);

		return;

		const qParams: IRequiredQParams = {
			user_id: body.user_id,
			email: body.email,
			acc_no: body.acc_no,
			passport: body.passport
		}

		const $ = this.regService.getAll(qParams, this.isSACitizen).subscribe((res) => {
			console.log('NEW getAll API resp', res);
			
			/*const duplicate_ID = body.user_id.length > 0 ? body.user_id === res.user_id : false;
			const duplicate_EMAIL = body.email === res.email;
			const duplicate_PASSPORT = body.passport.length > 0 ? body.passport === res.passport : false;
			if (duplicate_ID) formSubList.push('The ID you are trying to register already exists in our system');
			if (duplicate_EMAIL) formSubList.push('The Email address you are trying to register already exists in our system');
			if (duplicate_PASSPORT) formSubList.push('The Passport number you are trying to register already exists in our system');
			this.isLoading = false;*/


		}, (errResponse: HttpErrorResponse) => {
			console.log('err from regService API req: ', errResponse);
			if (errResponse.status === 429) this.rateLimiterActive = true;
		})

		
		this.regService.create(body).pipe(
			delay(4000),
		)
		.subscribe(res => {
			//.log('response from within subscribe method!');
			if (localStore) localStore.setItem('owiqsjdh09192', '1');
			this.applicationInProgress = false;
			this.isLoading = false;
		}, err => {
			//console.log('ERROR response from Subscribe: ',err);
			this.applicationInProgress = true;
			this.isLoading = false;		
		})
		
  }

	filterArrByField(arr: any, fieldName: string) {
		const body: IRegistration = this.regForm.value;
		//return arr.filter((reg: any) => reg[fieldName] === body[fieldName])
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

}

