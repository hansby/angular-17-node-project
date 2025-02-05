import { Component, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
	FormControl, FormGroup, ReactiveFormsModule,
	FormBuilder,
	Validators,
} from '@angular/forms';
import { RegistrationsService } from './services/registrations.service';

const LS_KEY = 'owiqsjdh09192';

enum REG_TYPE {
  IND = 'individual',
  BUS = 'business',
  TRUST = 'trust'
}

interface IIdentity {
  id: string,
  name: string
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

	constructor(
		private fb: FormBuilder, 
		private regService: RegistrationsService,
		@Inject(DOCUMENT) private document: Document,
	){

		this.localStore = document.defaultView?.localStorage;
		if (this.localStore && this.localStore.getItem(LS_KEY)) {
			const getLS = this.localStore.getItem(LS_KEY);
			alert(getLS);
		}

		this.regForm = new FormGroup({
			reg_type: new FormControl(''),
			id: new FormControl(''),
			firstName: new FormControl(''),
			lastName: new FormControl(''),
			bus_reg_no: new FormControl(''),
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

  updateRegType(value: string) {
    console.log(value);
		this.regForm.controls['reg_type'].setValue(value);
  }

  updateBank(value: string) {
    console.log(value);
		this.regForm.controls['bank'].setValue(value);
  }	

  updateAccType(value: string) {
    console.log(value);
		this.regForm.controls['acc_type'].setValue(value);
  }	

  submitForm() {
		const { localStore } = this;
		const body = this.regForm.value;
		console.log('final Obj for API req: ', body);
		
		
		/*this.regService.createRegistration(body).subscribe(res => {
			console.log('SUCCESS response from Subscribe: ',res);
			this.applicationInProgress = false;
			if (localStore) localStore.setItem('owiqsjdh09192', '1');
		}, (err) => {
			console.log('ERROR response from Subscribe: ',err);
			this.applicationInProgress = true;
		})*/
  }

}

