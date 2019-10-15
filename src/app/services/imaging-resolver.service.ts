import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Account } from '../model/account.model';
import { Observable } from 'rxjs';
import { DataService } from './data.service';
import {map, flatMap} from 'rxjs/operators';
import { SessionService } from './session.service';
import { MsgConstants } from '../model/message.model';
import {VoucherInfo} from "../model/voucher-info.model";

/*
  Resolver that makes sures that minimal set of data necessary for the Imaging
  app to work are available before loading the app.
*/
@Injectable()
export class ImagingResolver implements Resolve<VoucherInfo> {
  constructor(
    private dataService: DataService,
    private sessionService: SessionService,
    private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<VoucherInfo> {
    let documentId = <any> route.queryParamMap.get('documentId');

    if (documentId === null) {
      documentId = <any> localStorage.getItem('imagingDocumentIds');
      localStorage.removeItem('imagingDocumentIds');
    }

    if (documentId === null) {
      this.sessionService.errorPageMessage = MsgConstants.LOAD_ERR_DOC_ID;
      this.router.navigate(['error']);
      return null;
    }

    if (documentId instanceof Array) {
      this.sessionService.documentIds = documentId;
    } else {
      this.sessionService.documentIds = [documentId];
    }

    // First get user account and then get the voucher info
    return this.dataService.fetchAccountInfo().pipe(
      map(account => {
        this.sessionService.account = account;
        return account;
      })
    ).pipe(flatMap(account => {
      return this.dataService.fetchVoucherInfo(this.sessionService.documentIds).pipe(map(voucherInfo => {
        this.sessionService.voucherInfo = voucherInfo;
        let authorities = account.authoritiesByOrg[this.sessionService.voucherInfo.officeCode.trim()];
        if (authorities) {
          let orgAdminAuthority = authorities.find(auth => auth.authorityName === 'ORG_ADMIN');
          if (orgAdminAuthority) {
            this.sessionService.isOrgAdmin = true;
          }
        }
        return voucherInfo;
      }));
    }))
  }
}

