import { File } from './../model/file.model';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject, } from 'rxjs';
import { Preferences } from '../model/preferences.model';
import { environment } from '../../environments/environment';
import { EventService } from './event.service';
import { tap } from 'rxjs/operators';
import { Message, MsgConstants } from '../model/message.model';
import { VoucherInfo } from '../model/voucher-info.model';
import { PdfInfo } from '../model/pdf-info.model';
import { Account } from '../model/account.model';

/*
  Service class to send and receive data from the backend.
*/
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private _selectedDocId: string;
  private _pdfPathSubject = new Subject<PdfInfo>();

  constructor(private http: HttpClient, private eventService: EventService) {}

  fetchVoucherInfo(documentIds: string[]) {
    return this.http
      .get<VoucherInfo>(`${environment.voucherServiceUrl}api/fmis/document/data/v2/imaging/voucher/info/${documentIds}`)
      .pipe(
        tap(
          data => {},
          error => {
            this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.LOAD_ERR_VOUCHER_INFO));
          }
        )
      );
  }


  fetchAccountInfo() {
    return this.http.get<Account>('api/account');
  }

  fetchAccountThumbnail(samAccountName: string) {
    return this.http.get(`/uaasservice/api/uaas/ldap/user/thumbnail/${samAccountName}`, { responseType: 'text' });
  }

  fetchPdf(documentIds: string[], fileId: string) {
    this._pdfPathSubject.next(
      // new PdfInfo(`${environment.imagingServiceUrl}api/imaging/download/document/${fileId}`, documentIds, fileId)
      new PdfInfo(`assets/files/${fileId}`, documentIds, fileId)
    );
  }

  fetchFileList(documentIds: string[]) {
    return this.http
      .get<File[]>(`${environment.imagingServiceUrl}api/imaging/documents/${documentIds}`)
      .pipe(
        tap(
          data => {},
          error => {
            this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.LOAD_ERR_FILE_LIST));
          }
        )
      );
  }

  get pdfPathSubject() {
    return this._pdfPathSubject;
  }

  loadAnnotations(fileId: string): Observable<any> {
    return this.http.get(`${environment.imagingServiceUrl}api/imaging/annotations/${fileId}`).pipe(
      tap(
        data => {},
        error => {
          //this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.LOAD_ERR_ANNOTATIONS));
        }
      )
    );
  }

  saveAnnotations(documentIds, fileId, annotationsId, annotations): Observable<any> {
    const postObj = {
      id: annotationsId,
      annotateJson: { annotations: annotations },
      documentId: documentIds.join(','),
      fileId: fileId
    };

    return this.http.post(`${environment.imagingServiceUrl}api/imaging/annotations`, postObj).pipe(
      tap(
        data => {},
        error => {
          this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.SAVE_ERR_ANNOTATIONS));
        }
      )
    );
  }

  deleteAnnotations(documentId, fileId): Observable<{}> {
    return this.http
      .delete(`${environment.imagingServiceUrl}api/imaging/annotations/${fileId}`, { responseType: 'text' })
      .pipe(
        tap(
          data => {},
          error => {
            this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.SAVE_ERR_ANNOTATIONS));
          }
        )
      );
  }

  deletePages(fileId, pagesToDelete) {
    return this.http
      .delete<File>(`${environment.imagingServiceUrl}api/imaging/document/page/${fileId}/${pagesToDelete}`)
      .pipe(
        tap(
          data => {},
          error => {
            this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.SAVE_ERR_ANNOTATIONS));
          }
        )
      );
  }

  private getPreferences(fileId: string) {
    const preferences = new Preferences();
    preferences.toolType = localStorage.getItem(`${fileId}/tooltype`);
    return preferences;
  }

  savePreferences(fileId: string, preferences: Preferences) {}

  get selectedDocId() {
    return this._selectedDocId;
  }
}
