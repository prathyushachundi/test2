import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { VoucherInfo } from '../../model/voucher-info.model';
import { BaseComponent } from '../base.component';
import { Account } from '../../model/account.model';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent extends BaseComponent implements OnInit, AfterViewInit {
  documentIds: string[];
  voucherInfo: VoucherInfo;
  account: Account;
  thumbnail: string;

  @ViewChild('profileImg')
  profileImg: HTMLImageElement;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private authService: AuthService,
    private sessionService: SessionService) {
    super();
  }

  ngOnInit() {
    this.documentIds = this.sessionService.documentIds;
    this.voucherInfo = this.sessionService.voucherInfo;
    this.account = this.sessionService.account;

    this.dataService.fetchAccountThumbnail(this.account.sAMAccountName).subscribe(response => {
      this.thumbnail = `data:image/jpeg;base64,${response}`;
    });
  }

  ngAfterViewInit() {
  }

  logout() {
    // Logout and then redirect to application root (i.e. FMIS)
    this.authService.logout().subscribe(() => window.location.href = '/');
  }
}
