import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileUploadService } from '../../services/file-upload.service';
import { IGoogleDoc, UploadGoogleDocService } from '../../services/upload-google-doc.service';

@Component({
  selector: 'app-file-upload',
  //standalone: true,
  //imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css',
})
export class FileUploadComponent implements OnInit {
  currentFile?: File;
  message = '';
  fileInfos?: Observable<any>;
	@Input() fileName: string | undefined;
	@Input() fileType: string | undefined;
	@Output() dbName = new EventEmitter();
	base64File: any;

  constructor(private uploadService: FileUploadService, private uploadGoogleDoc: UploadGoogleDocService) {}

  ngOnInit(): void {
    this.fileInfos = this.uploadService.getFiles();
		// console.log(`${this.fileName} : ${this.fileType}`);
  }

  selectFile(event: any): void {
    this.message = '';
    this.currentFile = event.target.files.item(0);
		// console.log('lets see current file before uploading: ', this.currentFile);
		this.dbName.emit(this.currentFile);
		this.upload();
  }

	getBase64(file: File | undefined) {
		if (!file) return;
		let that = this;
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function () {
			//console.log(reader.result);
			that.base64File = reader.result;
		};
		reader.onerror = function (error) {
			//console.log('Error: ', error);
		};
 }

  upload(): void {
    if (this.currentFile) {
			let that = this;
			let reader = new FileReader();
			reader.readAsDataURL(this.currentFile);
			reader.onload = function () {

				const googleDocObj: IGoogleDoc = {
					skipHumanReview: true,
					rawDocument: {
						mimeType: that.currentFile ? that.currentFile.type : '',
						content: reader.result
					}
				}
	
				// console.log('googleDocObj ', googleDocObj);
				//console.log('getBase64File, ', this.base64File);

			
				that.uploadGoogleDoc.verifyDocumentbyGoogleAI(googleDocObj).subscribe({
					next: (event: any) => {
						if (event instanceof HttpResponse) {
							that.message = event.body.message;
							//this.fileInfos = this.uploadService.getFiles();
						}
					},
					error: (err: any) => {
						console.log(err);

						if (err.error && err.error.message) {
							that.message = err.error.message;
						} else {
							that.message = 'Could not upload the file!';
						}
					},
					complete: () => {
						that.currentFile = undefined;
					},
				});


			};
			reader.onerror = function (error) {
				console.log('File upload Error: ', error);
			};


    }
  }
}