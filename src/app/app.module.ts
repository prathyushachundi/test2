import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AppComponent } from './app.component';
import { DocListComponent } from './components/doc-list/doc-list.component';
import { PdfDisplayComponent } from './components/pdf-display/pdf-display.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { httpInterceptorProviders } from './http-interceptors';
import { LengthRestrictPipe } from './pipes/length-restrict.pipe';
import { MessagesComponent } from './components/messages/messages.component';
import { AppRoutingModule } from './app-routing.module';
import { ImagingComponent } from './components/imaging/imaging.component';
import { FooterComponent } from './components/footer/footer.component';
import { ImagingResolver } from './services/imaging-resolver.service';
import { ErrorComponent } from './components/error/error.component';
import { CommentBoxComponent } from './components/comment-box/comment-box.component';
import {FormsModule} from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';



@NgModule({
  declarations: [
    AppComponent,
    TopbarComponent,
    ToolbarComponent,
    DocListComponent,
    PdfDisplayComponent,
    MessagesComponent,
    ImagingComponent,
    LengthRestrictPipe,
    FooterComponent,
    ErrorComponent,
    CommentBoxComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgxSpinnerModule,
    AppRoutingModule,
    AngularSvgIconModule
  ],
  providers: [
    httpInterceptorProviders,
    ImagingResolver
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
