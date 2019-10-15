import { Injectable } from '@angular/core';
import { File } from '../model/file.model';
import { Account } from '../model/account.model';
import {VoucherInfo} from "../model/voucher-info.model";

/*
  Service class to store state that is common across components.
*/
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private _documentIds: string[] = null;
  private _selectedFile: File = null;
  private _savedAnnotations: string = null;
  private _isPdfOnDisplay = false;
  private _account: Account = null;
  private _errorPageMessage: string = null;
  private _voucherInfo: VoucherInfo = null;
  private _isOrgAdmin = false;
  private _isPrintInProgress = false;
  private _printWithAnnotations = false;
  private _documentTaskStatus = null;

  constructor() {}

  public get documentIds(): string[] {
    return this._documentIds;
  }
  public set documentIds(value: string[]) {
    this._documentIds = value;
  }
  public get selectedFile(): File {
    return this._selectedFile;
  }

  public set selectedFile(value: File) {
    this._selectedFile = value;
  }

  public get isPdfOnDisplay() {
    return this._isPdfOnDisplay;
  }

  public set isPdfOnDisplay(value) {
    this._isPdfOnDisplay = value;
  }

  public get savedAnnotations(): string {
    return this._savedAnnotations;
  }

  public set savedAnnotations(value: string) {
    this._savedAnnotations = value;
  }

  public get account(): Account {
    return this._account;
  }

  public set account(value: Account) {
    this._account = value;
  }


  public get errorPageMessage(): string {
    return this._errorPageMessage;
  }

  public set errorPageMessage(value: string) {
    this._errorPageMessage = value;
  }

  get voucherInfo(): VoucherInfo {
    return this._voucherInfo;
  }

  set voucherInfo(value: VoucherInfo) {
    this._voucherInfo = value;
  }


  get isOrgAdmin(): boolean {
    return this._isOrgAdmin;
  }

  set isOrgAdmin(value: boolean) {
    this._isOrgAdmin = value;
  }


  get isPrintInProgress(): boolean {
    return this._isPrintInProgress;
  }

  set isPrintInProgress(value: boolean) {
    this._isPrintInProgress = value;
  }

  get printWithAnnotations(): boolean {
    return this._printWithAnnotations;
  }

  set printWithAnnotations(value: boolean) {
    this._printWithAnnotations = value;
  }

  get documentTaskStatus(): string {
    return this._documentTaskStatus;
  }

  set documentTaskStatus(value: string) {
    this._documentTaskStatus = value;
  }
}
