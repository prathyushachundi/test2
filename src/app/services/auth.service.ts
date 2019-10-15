import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public static AUTH_TOKEN_KEY = 'jhi-authenticationToken';

  constructor(private dataService: DataService) {}

  getToken() {
    let jwt = localStorage.getItem(AuthService.AUTH_TOKEN_KEY);
     if(!jwt){
      jwt = sessionStorage.getItem(AuthService.AUTH_TOKEN_KEY);
     }
    jwt = jwt.replace(/(^\")|(\"$)/g, '');
    return `Bearer ${jwt}`;
  }

  logout() {
              sessionStorage.removeItem(AuthService.AUTH_TOKEN_KEY);
    return of(localStorage.removeItem(AuthService.AUTH_TOKEN_KEY));
  }
}
