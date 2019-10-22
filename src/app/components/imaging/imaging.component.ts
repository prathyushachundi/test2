import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { EventService } from '../../services/event.service';
import { Subscription } from 'rxjs';
import { ResizeService } from '../../services/resize.service';
import { ToolbarComponent } from '../toolbar/toolbar.component';




@Component({
  selector: 'app-imaging',
  templateUrl: './imaging.component.html',
  styleUrls: ['./imaging.component.css'],
  providers:[ToolbarComponent]
})
export class ImagingComponent implements OnInit, OnDestroy, AfterViewInit {
  expandSidbar = false;
  expandSidebarSubscription: Subscription;
  collapesub:Subscription
  coolapseexpand:any;
  modalDisplay = 'none';

  constructor(private eventService: EventService, private resizeService: ResizeService,private toolbarcomponent:ToolbarComponent) {}
  print()
  {
    window.print();
  }

  clear(){
    this.modalDisplay;
  }
  modalCancel() {
    this.modalDisplay = 'none';
  }
  modalOk() {
    this.modalDisplay = 'none';
    
    this.toolbarcomponent.sendEvent('clear');

  }
  ngOnInit() {
    this.expandSidebarSubscription = this.eventService.expandSidebarSubject.subscribe(
      isExpand => (this.expandSidbar = isExpand)
    );
    
    this.collapesub=this.eventService.sendcollapseEvent.subscribe(
      collIsExpand => (this.coolapseexpand = collIsExpand)
    )
  }

  ngOnDestroy() {
    this.expandSidebarSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.resizeService.resizePanels();
  }
  
}
