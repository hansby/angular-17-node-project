import { Component, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
	FormControl, FormGroup, ReactiveFormsModule,
	FormBuilder,
	Validators,
	ValidatorFn,
	FormArray,
	AbstractControl,
} from '@angular/forms';
import { RegistrationsService } from './services/registrations.service';

const LS_KEY = 'owiqsjdh09192';

export enum fileTypes {
	ID = 'id',
	PROOF_OF_ADDRESS = 'poa',
	BUS_REG_DOC = 'bus_reg_doc',
	TRUST_DOC = 'trust_doc'
}

enum REG_TYPE {
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
function checkID(idNumber: string) {
	let correct = true;
	if (idNumber.length != 13 || !isNumber(idNumber)) {
		console.warn('ID number does not appear to be authentic - input not a valid number');
		correct = false;
	}
	let yearString = idNumber.substring(0, 2);
	let monthString = idNumber.substring(2, 4);
	let dayString = idNumber.substring(4, 6);

	// get first 6 digits as a valid date
	let tempDate = new Date(+yearString, (+monthString - 1) , +dayString);
	let id_date = tempDate.getDate();
	let id_month = tempDate.getMonth();
	let id_year = tempDate.getFullYear();
	if (!((id_year === +yearString) && (id_month === (+monthString - 1)) && (id_date === +dayString))) {
		console.warn('ID number does not appear to be authentic - date part not valid');
		correct = false;
	}

	// get the gender
	let genderCode = idNumber.substring(6, 10);
	//let gender = parseInt(genderCode) < 5000 ? "Female" : "Male";

	// get country ID for citzenship
	//let citzenship = parseInt(idNumber.substring(10, 11)) == 0 ? "Yes" : "No";

	// apply Luhn formula for check-digits
	let tempTotal = 0;
	let checkSum = 0;
	let multiplier = 1;
	for (let i = 0; i < 13; ++i) {
		tempTotal = parseInt(idNumber.charAt(i)) * multiplier;
	if (tempTotal > 9) {
		tempTotal = parseInt(tempTotal.toString().charAt(0)) + parseInt(tempTotal.toString().charAt(1));
	}
	checkSum = checkSum + tempTotal;
		multiplier = (multiplier % 2 == 0) ? 1 : 2;
	}
	if ((checkSum % 10) != 0) {
		console.warn('ID number does not appear to be authentic - check digit is not valid');
		correct = false;
	};

	// if no error found, hide the error message
	if (correct) {
		console.info("SUCCESS");
		return true;
	}
	// otherwise, show the error
	else {
		console.warn("ERROR!")
	}
	return false;
}

function isNumber(n: string) {
	return !isNaN(parseFloat(n)) && isFinite(+n);
}	

const testForValidSAId = (idNum: string) => {
  const validator = (c: AbstractControl): { [key: string]: boolean } | null => {
    const isIDValid = checkID(idNum);
		console.log('is ID valid?? : ', isIDValid);
    //const soonest = new Date(ttt.getFullYear(), ttt.getMonth(), ttt.getDate()).getTime();
    //const date = c.get(dateField).value?.getTime?.();
    if (!isIDValid) { return { idError: true }; }
    return null;
  };
  return validator;
};

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
	isSACitizen: boolean = true;
	isBusiness: boolean = false;
	regType: string = '';
	fileTypes = fileTypes;

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
			reg_type: new FormControl(''),
			user_id: new FormControl(''),
			firstName: new FormControl(''),
			lastName: new FormControl(''),
			bus_reg_no: new FormControl(''),
			trust_reg_no: new FormControl(''),
			cell: new FormControl(''),
			email: new FormControl('', [Validators.required, Validators.email]),
			tax_no: new FormControl(''),
			acc_holder: new FormControl(''),
			acc_type: new FormControl(''),
			acc_no: new FormControl(''),
			swift_code: new FormControl(''),
			iban: new FormControl(''),
			bank: new FormControl(''),
			file_id: new FormControl(''),
			file_poa: new FormControl(''),
			file_bus_reg: new FormControl(''),
			file_trust: new FormControl(''),
			passport: new FormControl(''),
		}, {
			validators: [
				testForValidSAId('user_id')
			]
		});

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

	checkIDNumberValidity(idNum: HTMLInputElement) {
		const inptID = idNum.value;
		//console.log('check id num: ', idNum.value);
		// this.checkID();
	}	

  updateRegType(value: string) {
    console.log(value);
		this.regForm.controls['reg_type'].setValue(value);
		this.regType = value;
  }

  updateBank(value: string) {
    console.log(value);
		this.regForm.controls['bank'].setValue(value);
  }	

  updateAccType(value: string) {
    console.log(value);
		this.regForm.controls['acc_type'].setValue(value);
  }

	uploadFile(e: any) {
		console.log('file upload: ', e);
	}

  submitForm() {
		const { localStore } = this;
		const body = this.regForm.value;
		console.log('final Obj for API req: ', body);

		this.regService.create(body).subscribe(res => {
			console.log('response from within subscribe method!');
			if (localStore) localStore.setItem('owiqsjdh09192', '1');
			this.applicationInProgress = false;
		}, err => {
			console.log('ERROR response from Subscribe: ',err);
			this.applicationInProgress = true;			
		})
		
  }

}

