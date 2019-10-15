import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { EventService } from '../../services/event.service';
import initColorPicker from '../../../assets/scripts/initColorPicker';
import { ToolbarEvent } from '../../model/event.model';
import { DataService } from '../../services/data.service';
import { ResizeService } from '../../services/resize.service';
import { PrintService } from '../../services/print.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit, AfterViewInit {
  eventType: string;
  selectedPenSize = 3;
  textSizes = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96];
  penSizes = [];
  arrowSizes = [1, 2, 3, 4, 5];
  modalDisplay = 'none';

  @ViewChild('navbarHeader')
  navbarHeader: ElementRef;

  @ViewChild('textColorId')
  textColorElement: ElementRef;

  @ViewChild('textSizeId')
  textSizeElement: ElementRef;

  @ViewChild('penColorId')
  penColorElement: ElementRef;

  @ViewChild('penSizeId')
  penSizeElement: ElementRef;

  @ViewChild('arrowColorId')
  arrowColorElement: ElementRef;

  @ViewChild('arrowSizeId')
  arrowSizeElement: ElementRef;

  @ViewChild('scaleId')
  scaleElement: ElementRef;

  chosenTextColor: string;
  chosenPenColor: string;
  chosenArrowColor: string;
  selecttool:any;
  circletool:any;
  striketool:any;
  highlighttool:any;
  rotattool:any;
  texttool:any;
  pentool:any;
  zoomtool:any;
  arrowtool:any;

  constructor(
    private eventService: EventService,
    public printService: PrintService,
    public sessionService: SessionService) { }

  ngOnInit() {
    for (let i = 1; i <= 20; i++) {
      this.penSizes.push(i);
    }
  }

  ngAfterViewInit() {
    initColorPicker(this.textColorElement.nativeElement, '#000000', (newColor: string) => {
      this.chosenTextColor = newColor;

      // If the text annotator is currently selected, send an event to update the color
      if (this.eventType === 'text') {
        this.sendEvent('text');
      }
    });

    initColorPicker(this.penColorElement.nativeElement, '#000000', (newColor: string) => {
      this.chosenPenColor = newColor;

      // If the pen annotator is currently selected, send an event to update the color
      if (this.eventType === 'draw') {
        this.sendEvent('draw');
      }
    });

    initColorPicker(this.arrowColorElement.nativeElement, '#000000', (newColor: string) => {
      this.chosenArrowColor = newColor;

      // If the pen annotator is currently selected, send an event to update the color
      if (this.eventType === 'arrow') {
        this.sendEvent('arrow');
      }
    });

    this.textSizeElement.nativeElement.value = '14';

    this.eventService.resetPdfDisplay.subscribe( () => {
      this.scaleElement.nativeElement.value = '1.33';
    });
  }

  sendEvent(eventType) {
  this.eventType=eventType;
    //this.selecttool=null;
    this.circletool=null;
    this.highlighttool=null;
    this.striketool=null;
  var activevnt:any=document.querySelector(".active img");
  var path=activevnt.src.substring(activevnt.src.lastIndexOf('/')+1).split(".svg");
  document.querySelector(".active img").getAttribute("src")=="";

  var file
    let eventData = null;
    if (eventType=="cursor")
    {
      this.selecttool="imaging/assets/icons/circle-select.svg";
    }
    else if (eventType=="emptycircle")
    {
      this.selecttool="imaging/assets/icons/circle-select.svg";
    }
    else if (eventType=="area")
    {
      this.selecttool="imaging/assets/icons/circle-select.svg";
    }else if (eventType=="strikeout")
    {
      this.striketool="imaging/assets/icons/strikethrough-selected.svg";
    }else if (eventType=="highlight")
    {
      this.selecttool="imaging/assets/icons/circle-select.svg";
    }else if (eventType=="text")
    {
      this.selecttool="imaging/assets/icons/circle-select.svg";
    }else if (eventType=="draw")
    {
      this.selecttool="imaging/assets/icons/circle-select.svg";
    }else if (eventType=="arrow")
    {
      this.selecttool="imaging/assets/icons/circle-select.svg";
    }else if (eventType=="emptycircle")
    {
      this.selecttool="imaging/assets/icons/circle-select.svg";
    }
    //this.selecttool=true;

    switch (this.eventType) {
      case 'draw':
        eventData = { size: this.penSizeElement.nativeElement.value, color: this.chosenPenColor };
        break;
      case 'text':
        eventData = { size: this.textSizeElement.nativeElement.value, color: this.chosenTextColor };
        break;
      case 'arrow':
        eventData = { size: this.arrowSizeElement.nativeElement.value, color: this.chosenArrowColor };
        break;
      case 'scale':
        eventData = { scale: this.scaleElement.nativeElement.value };
        break;
    }

    this.eventService.sendToolbarEvent(new ToolbarEvent(this.eventType, eventData));
  }

  updateTextSize() {
    if (this.eventType === 'text') {
      this.sendEvent('text');
    }
  }

  updatePenSize() {
    if (this.eventType === 'draw') {
      this.sendEvent('draw');
    }
  }

  updateArrowSize() {
    if (this.eventType === 'arrow') {
      this.sendEvent('arrow');
    }
  }

  zoom(zoomType: string) {
    const currentIndex = this.scaleElement.nativeElement.selectedIndex;
    const dropdownSize = this.scaleElement.nativeElement.options.length;
    if (zoomType === 'in') {
      if (currentIndex < dropdownSize - 1) {
        this.scaleElement.nativeElement.selectedIndex = currentIndex + 1;
        this.sendEvent('scale');
      }
    } else if (zoomType === 'out') {
      if (currentIndex !== 0) {
        this.scaleElement.nativeElement.selectedIndex = currentIndex - 1;
        this.sendEvent('scale');
      }
    }
  }

  modalCancel() {
    this.modalDisplay = 'none';
  }

  modalOk() {
    this.modalDisplay = 'none';
    this.sendEvent('clear');
  }
}
