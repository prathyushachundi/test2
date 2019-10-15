import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventService } from '../../services/event.service';
import { Message } from '../../model/message.model';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewInit {
  messageSub: Subscription;
  messages: Message[];

  @ViewChild('messagesContainer')
  messagesContainer: ElementRef;

  constructor(private eventService: EventService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.messageSub = this.eventService.messagesSubject.subscribe(messages => {
      this.messages = messages;
    });
  }

  ngOnDestroy() {
    this.messageSub.unsubscribe();
  }

  clearMessage(message: Message) {
    this.eventService.clearMessage(message);
  }
}
