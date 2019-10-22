import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ToolbarEvent, PageEvent } from '../model/event.model';
import { Thumbnail } from '../model/thumbnail.model';
import { Message } from '../model/message.model';

/*
  Service class to send and receive events across components.
*/
@Injectable({
  providedIn: 'root'
})
export class EventService {
  private _toolbarEventsSubject = new Subject<ToolbarEvent>();
  private _pageEventsSubject = new Subject<PageEvent>();
  private _resetPdfDisplay = new Subject();
  private _thumbsSubject = new Subject<Thumbnail[]>();
  private _messagesSubject = new Subject<Message[]>();
  private _expandSidebarSubject = new Subject<boolean>();
  private _annotationsLoaded = new Subject();
  private _sendcollapseevent=new Subject();

  private messages: Message[] = [];

  constructor() {}

  sendToolbarEvent(toolbarEvent: ToolbarEvent) {
    this._toolbarEventsSubject.next(toolbarEvent);
  }
  sendcollapseevent(collapse){
   this._sendcollapseevent.next(collapse)
  }

  sendPageEvent(pageEvent: PageEvent) {
    this._pageEventsSubject.next(pageEvent);
  }

  setThumbnails(thumbnails) {
    this._thumbsSubject.next(thumbnails);
  }

  clearThumbs() {
    this._thumbsSubject.next([]);
  }

  addMessage(message: Message) {
    this.messages.push(message);
    this.messagesSubject.next(this.messages);
  }

  clearMessages() {
    this.messages = [];
    this.messagesSubject.next(this.messages);
  }

  clearMessage(message: Message) {
    const index = this.messages.indexOf(message);
    if (index > -1) {
      this.messages.splice(index, 1);
      this.messagesSubject.next(this.messages);
    }
  }

  get thumbsSubject() {
    return this._thumbsSubject;
  }

  get toolbarEventsSubject() {
    return this._toolbarEventsSubject;
  }

  get pageEventsSubject() {
    return this._pageEventsSubject;
  }

  get resetPdfDisplay() {
    return this._resetPdfDisplay;
  }

  public get messagesSubject() {
    return this._messagesSubject;
  }
  public get sendcollapseEvent()
  {
    return this._sendcollapseevent;
  }
  public get expandSidebarSubject() {
    return this._expandSidebarSubject;
  }

  get annotationsLoaded() {
    return this._annotationsLoaded;
  }
}
