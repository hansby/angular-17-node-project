import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
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
	@Output() fileStatus = new EventEmitter();
	base64File: any;

  constructor(private uploadService: FileUploadService, private uploadGoogleDoc: UploadGoogleDocService) {}

  ngOnInit(): void {
    this.fileInfos = this.uploadService.getFiles();
		// console.log(`${this.fileName} : ${this.fileType}`);
  }

  selectFile(event: any): void {
    this.message = '';
    this.currentFile = event.target.files.item(0);
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
				/*that.fileStatus.emit({
					currentFile: that.currentFile,
					readerResult: reader.result
				})*/
				that.dbName.emit({file: that.currentFile, result: reader.result});
			};
			reader.onerror = function (error) {
				console.log('File upload Error: ', error);
			};


    }
  }
}