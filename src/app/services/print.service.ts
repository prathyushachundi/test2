import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs';
import {SessionService} from './session.service';

@Injectable({
  providedIn: 'root'
})
export class PrintService implements OnDestroy {
  private _requestRenderForPrint = new Subject();
  private _availableForPrint = new Subject();
  private printSubscription: Subscription = null;

  constructor(private sessionService: SessionService) { }

  print(withAnnotations) {
    // Set up a subscription for when a pdf is ready for printing
    if (this.printSubscription === null) {
      this.printSubscription = this.availableForPrint.subscribe(() => {
        this.sessionService.isPrintInProgress = false;
        const elems = document.querySelectorAll('svg.annotationLayer');
        for (let i = 0; i < elems.length; i++) {
          if (this.sessionService.printWithAnnotations) {
            elems[i].classList.remove('no-print');
          } else {
            elems[i].classList.add('no-print');
          }
        }
        window.print();
      });
    }

    this.sessionService.isPrintInProgress = true;
    this.sessionService.printWithAnnotations = withAnnotations;

    // Send a request to make pdf available for printing.
    this.requestRenderForPrint.next();
  }

  ngOnDestroy(): void {
    if (this.printSubscription !== null) {
      this.printSubscription.unsubscribe();
    }
  }

  get requestRenderForPrint(): Subject<any> {
    return this._requestRenderForPrint;
  }

  get availableForPrint(): Subject<any> {
    return this._availableForPrint;
  }
}
