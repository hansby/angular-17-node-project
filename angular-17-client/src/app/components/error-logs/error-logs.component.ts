import { Component, OnInit } from '@angular/core';
import { SearchService, searchType } from '../../services/search.service';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { LoggerService } from '../../services/logger.service';
import { Observable, of, tap } from 'rxjs';
@Component({
	selector: 'error-logs',
	templateUrl: './error-logs.component.html',
	styleUrl: './error-logs.component.css',
})
export class ErrorLogsComponent implements OnInit {
	searchBy: searchType | null = null;
	form = new UntypedFormGroup({
		search: new UntypedFormControl(''),
	});

	_logData$: Observable<any> | null = null;

	currentResolveID: number | null = null;
	searchText: string = '';

	searchType = searchType;
	_logResults: Array<any> = [];
	noResultsFound: boolean = false;
	apiIsLoading: boolean = false;
	bulkEditIsActive: boolean = false;
	activeFilter: string = 'unresolved';

	constructor(private search: SearchService, private logs: LoggerService) {}

	ngOnInit(): void {
		this._logData$ = this.logs.getAllRawLogs(true).pipe(
			tap((logs) => console.log('fetched logs: ', logs))
		);
	}

	updateSearchBy(type: searchType) {
		this.searchBy = type;
	}

	confirmResolve() {
		this.apiIsLoading = true;
		if (!this.currentResolveID) return;
		this.logs.resolveLog(this.currentResolveID).subscribe((res) => {
			// data-dismiss="modal"
			// @ts-ignore
			$('#modal_tandcs').modal('hide');

			this.apiIsLoading = false;

			this._logData$ = this.logs.getAllRawLogs(true).pipe(
				tap((logs) => {
					if (logs.length <= 0) this.noResultsFound = true;
					console.log('fetched logs after resolve: ', logs);
				})
			);
		}, (error) => {
			this.apiIsLoading = false;
			console.error('Error resolving log: ', error);
		});
	}

	doSearch() {
		this.noResultsFound = false;
		const keyword = this.searchText;
		if (!keyword || keyword.length <= 0) {
			this._logData$ = this.logs.getAllRawLogs(true);
			return;
		}
		this.logs.searchLogs(keyword).subscribe((results) => {
			if (results.length > 0) {
				this._logData$ = of(results);
			} else {
				this._logData$ = of([]);
				this.noResultsFound = true;
			}
		}, (error) => {
			console.error('Error fetching search results: ', error);
			this.noResultsFound = true;
		});
	}

	filterByStatus($event: Event) {
		const selectElement = $event.target as HTMLSelectElement;
		const filterValue = selectElement.value;
		if (filterValue === 'resolved') {
			this._logData$ = this.logs.filterLogsBy(true);
			this.activeFilter = 'resolved';
		} else {
			this._logData$ = this.logs.getAllRawLogs(true);
			this.activeFilter = 'unresolved';
		}
	}	

	resolveSelectedItems() {
		// check if any of 'logData' checkboxes are checked
		const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
		if (checkboxes.length === 0) {
			alert('Please select at least one item to resolve.');
			return;
		}
		const idsToResolve: number[] = [];
		checkboxes.forEach((checkbox) => {
			const id = parseInt((checkbox as HTMLInputElement).value, 10);
			if (!isNaN(id)) {
				idsToResolve.push(id);
			}
		});
		idsToResolve.forEach((id) => {
			this.logs.resolveLog(id).subscribe((res) => {
				console.log(`Resolved log with ID: ${id}`);
			}, (error) => {
				console.error(`Error resolving log with ID ${id}: `, error);
			});
		});
		// After all resolutions, refresh the log data
		setTimeout(() => {
			alert('Selected items have been successfully resolved.');
			this.activeFilter = 'unresolved';
			this._logData$ = this.logs.getAllRawLogs(true);
			this.bulkEditIsActive = false;
		}, 1000); // Delay to ensure all requests are processed
	}	

	goToDashboard() {
		window.location.href = '/dashboard';
	}

	formatDataLog(log: string): string {
		const serverPath = 'http://localhost:8080/assets/uploads/';
		const result = splitAndLink(serverPath, log);
		return `${result.leftText} | File Link: ${result.hyperlink}`;
	}

}

function splitAndLink(baseUrl: string, input: string): { leftText: string; hyperlink: string } {
  // Split on the first pipe |
  const [left, right] = input.split('|').map(s => s.trim());

  // Left side keeps original format (cellphone: xxx |)
  const leftText = left;

  // Right side becomes a hyperlink (no encoding)
  const hyperlink = `<a href="${baseUrl}${right}" target="_blank">${right}</a>`;

  return { leftText, hyperlink };
}