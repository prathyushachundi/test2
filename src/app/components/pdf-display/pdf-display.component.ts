import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import 'pdfjs-dist/build/pdf';
import {Subject, Subscription} from 'rxjs';
import twitter from 'twitter-text';
import PDFJSAnnotate from '../../../assets/scripts/pdf-annotate';
import '../../../assets/scripts/pdf_viewer.js';
import {PageEvent, PageEventData, RenderEvent, ToolbarEvent} from '../../model/event.model';
import {DataService} from '../../services/data.service';
import {EventService} from '../../services/event.service';
import {SessionService} from '../../services/session.service';
import {AuthService} from '../../services/auth.service';
import {Thumbnail} from '../../model/thumbnail.model';
import {NgxSpinnerService} from 'ngx-spinner';
import {Message, MsgConstants} from '../../model/message.model';
import {finalize, throttleTime} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {PdfInfo} from '../../model/pdf-info.model';
import {PdfService} from '../../services/pdf.service';
import {ResizeService} from '../../services/resize.service';
import {PrintService} from '../../services/print.service';

declare var PDFJS: any; // Variable defined in pdfjs-dist/build/pdf.js

const { UI } = PDFJSAnnotate;
if (PDFJS.workerSrc === null) {
  PDFJS.workerSrc = `${environment.appRoot}/assets/scripts/pdf.worker.min.js`;
}
PDFJS.imageResourcesPath = `${environment.appRoot}/assets/images/pdf_viewer/`;

@Component({
  selector: 'app-pdf-display',
  templateUrl: './pdf-display.component.html',
  styleUrls: ['./pdf-display.component.css'],
  providers: [ NgxSpinnerService ]
})
export class PdfDisplayComponent implements OnInit, OnDestroy {
  chatboxshow:boolean=true;
  PAGE_HEIGHT: number;
  commentlist=[];
  RENDER_OPTIONS: any = {
    documentId: null,
    pdfDocument: null,
    scale: 0,
    rotate: 0
  };
  NUM_PAGES = 0;
  batchSize = 15;
  maxPagesToKeepRendered = 75;
  selectedPage = null;
  selectedFile=false;
  pageRenderedIndicators: number[];
  lastRenderedPage = 0;
  currentVisiblePage = 1;
  renderInProgress = false;
  renderEvents = new Subject<RenderEvent>();
  renderQueue: RenderEvent[];
  lastScrollTop: number;

  // To throttle scroll events
  pdfScrollSubject = new Subject<Event>();
  pdfScrollObservable = this.pdfScrollSubject.pipe(throttleTime(200));

  thumbnails: Thumbnail[];
  thumbnailsLoaded: boolean;
  annotationsId: string;
  pdfInfo: PdfInfo;

  toolbarEventsSubscription: Subscription;
  pageEventsSubscription: Subscription;
  printRequestSubscription: Subscription;

  constructor(
    private dataService: DataService,
    private eventService: EventService,
    public sessionService: SessionService,
    private pdfService: PdfService,
    private authService: AuthService,
    private spinner: NgxSpinnerService,
    private resizeService: ResizeService,
    private printService: PrintService) {}

  ngOnInit() {
    // PDFJSAnnotate.setStoreAdapter(new PDFJSAnnotate.LocalStoreAdapter(
    //   {
    //     sAMAccountName: this.sessionService.account.sAMAccountName,
    //     displayName: this.sessionService.account.displayName
    //   }
    // ));

    PDFJSAnnotate.setStoreAdapter(new PDFJSAnnotate.LocalStoreAdapter(
      {
        sAMAccountName: 'user',
        displayName: 'john'
      }
    ));

    this.dataService.pdfPathSubject.subscribe(pdfInfo => {
      console.log(pdfInfo, 'pdf info...');
      this.pdfInfo = pdfInfo;

      this.RENDER_OPTIONS = {
        documentId: pdfInfo.fileId,
        pdfDocument: null,
        scale: 1.33,
        rotate: 0,
        options_by_page: null
      };

      this.loadAnnotations();
    });

    this.toolbarEventsSubscription = this.eventService.toolbarEventsSubject.subscribe(toolbarEvent => {
      if (this.sessionService.isPdfOnDisplay) {
        this.handleEvent(toolbarEvent);
      }
    });

    this.pageEventsSubscription = this.eventService.pageEventsSubject.subscribe(pageEvent => {
      if (this.sessionService.isPdfOnDisplay) {
        this.handlePageEvent(pageEvent);
      }
    });

    this.renderEvents.subscribe(renderEvent => {
      if (!this.renderInProgress) {
        this.renderBatch(renderEvent.startPosition, renderEvent.endPosition);
      } else {
        this.renderQueue.push(renderEvent);
      }
    });

    this.pdfScrollObservable.subscribe(event => this.onPdfScroll(event));

    this.printRequestSubscription = this.printService.requestRenderForPrint.subscribe(() => this.renderForPrint());
  }

  private loadAnnotations() {
    this.dataService.loadAnnotations(this.pdfInfo.fileId).subscribe(response => {
      console.log(response);
      let annotations = '[]';
      if (response && response.annotateJson && response.annotateJson.annotations) {
        annotations = response.annotateJson.annotations;
        this.annotationsId = response.id;
        this.sessionService.savedAnnotations = annotations;
      } else {
        this.annotationsId = null;
        this.sessionService.savedAnnotations = null;
      }
      PDFJSAnnotate.getStoreAdapter().storeAnnotationsAsString(this.RENDER_OPTIONS.documentId, annotations);
      this.initialRender();
      this.eventService.annotationsLoaded.next();
    }, error => {
      // Try to render pdf even if we could not load annotations
      PDFJSAnnotate.getStoreAdapter().storeAnnotationsAsString(this.RENDER_OPTIONS.documentId, '[]');
      this.initialRender();
    });
  }

  private initialRender() {
    this.thumbnails = [];
    this.thumbnailsLoaded = false;
    this.sessionService.isPdfOnDisplay = false;
    this.eventService.resetPdfDisplay.next();
    this.lastRenderedPage = 0;
    this.renderQueue = [];
    this.lastScrollTop = 0;
    this.currentVisiblePage = 1;
    this.renderDocument();
  }

  ngOnDestroy() {
    this.toolbarEventsSubscription.unsubscribe();
    this.pageEventsSubscription.unsubscribe();
    this.printRequestSubscription.unsubscribe();
  }

  renderDocument() {
    this.spinner.show();
    // this.pdfInfo.url = "assets/files/test.pdf";
    this.selectedFile=true;
    PDFJS.getDocument({
      'url': this.pdfInfo.url
    }).then(pdf => {
      this.RENDER_OPTIONS.pdfDocument = pdf;
      const viewer = document.getElementById('viewer');
      viewer.innerHTML = '';
      this.NUM_PAGES = pdf.pdfInfo.numPages;

      if (this.sessionService.savedAnnotations) {
        const annotations = JSON.parse(this.sessionService.savedAnnotations).filter(annotation => annotation.type === 'rotation');
        if (annotations && !this.RENDER_OPTIONS.options_by_page) {
          this.RENDER_OPTIONS.options_by_page = [];
          for ( let i = 0; i < this.NUM_PAGES; i++ ) {
            let renderOption = {
              documentId: this.RENDER_OPTIONS.documentId,
              pdfDocument: pdf,
              scale: this.RENDER_OPTIONS.scale,
              rotate: annotations[i].rotate
            };
            this.RENDER_OPTIONS.options_by_page.push(renderOption);
          }
        }
      }




      this.thumbnails.length = 0;
      for (let i = 0; i < this.NUM_PAGES; i++) {
        const page = UI.createPage(i + 1);
        viewer.appendChild(page);
        if (i === 0) { // Set a default height until the first pdf page is rendered and we have the actual height
          this.PAGE_HEIGHT = (<HTMLElement>page).offsetHeight;
        }

        this.thumbnails.push(new Thumbnail(i + 1, false, null));
      }
      console.log(this.thumbnails);
      UI.closeInput();
      // var input:any=document.getElementById('pdf-annotate-text-input');
      // if(input)
      // {
      //   input.style.display="none"
      // }
     
      this.eventService.setThumbnails(this.thumbnails);

      // Init indicators for page render status. 0 indicates that page is not rendered. 1 indicates that it is.
      this.pageRenderedIndicators = Array(this.NUM_PAGES).fill(0);

      // Render first n pages
      this.renderEvents.next(new RenderEvent(1, this.batchSize));

      // Also render the last n pages
      this.renderEvents.next(new RenderEvent(this.NUM_PAGES - this.batchSize, this.NUM_PAGES));
    }).catch(error => {
      console.log(error);
      this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.LOAD_ERR_PDF));
      this.spinner.hide();
    });
  }

  renderSelectedDocument(selectedPage:number, rotation:number) {
    this.spinner.show();
    this.pdfInfo.url = "http://localhost:4200/imaging/assets/test.pdf";
    this.selectedFile = true;
    PDFJS.getDocument({
      'url': this.pdfInfo.url
    }).then(pdf => {
      this.RENDER_OPTIONS.pdfDocument = pdf;

      const viewer = document.getElementById('viewer');
      viewer.innerHTML = '';
      this.NUM_PAGES = pdf.pdfInfo.numPages;

      /*
        On first initialization of rotating a single page.
        Define the array that will track options by page
       */
      if(!this.RENDER_OPTIONS.options_by_page){
        this.RENDER_OPTIONS.options_by_page = [];
        for( let i=0; i < this.NUM_PAGES; i++ ){
          let renderOption = {
            documentId: this.RENDER_OPTIONS.documentId,
            pdfDocument: pdf,
            scale: this.RENDER_OPTIONS.scale,
            rotate: this.RENDER_OPTIONS.rotate
          };
          if( selectedPage === i + 1 ){
            renderOption.rotate = this.getNewRotation(this.RENDER_OPTIONS.rotate, rotation);
          }
          this.RENDER_OPTIONS.options_by_page.push(renderOption);
        }
      } else {
        this.RENDER_OPTIONS.options_by_page[selectedPage - 1].rotate = this.getNewRotation(this.RENDER_OPTIONS.options_by_page[selectedPage - 1].rotate, rotation);
      }


      this.thumbnails.length = 0;
      for (let i = 0; i < this.NUM_PAGES; i++) {
        const page = UI.createPage(i + 1);
        viewer.appendChild(page);
        if (i === 0) { // Set a default height until the first pdf page is rendered and we have the actual height
          this.PAGE_HEIGHT = (<HTMLElement>page).offsetHeight;
        }

        this.thumbnails.push(new Thumbnail(i + 1, false, null));
      }
      this.eventService.setThumbnails(this.thumbnails);

      // Init indicators for page render status. 0 indicates that page is not rendered. 1 indicates that it is.
      this.pageRenderedIndicators = Array(this.NUM_PAGES).fill(0);
        // Render first n pages
      this.renderEvents.next(new RenderEvent(1, this.batchSize));
      // Also render the last n pages
      this.renderEvents.next(new RenderEvent(this.NUM_PAGES - this.batchSize, this.NUM_PAGES));


    }).catch(error => {
      console.log(error);
      this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.LOAD_ERR_PDF));
      this.spinner.hide();
    });
  }

  renderBatch(startPosition, endPosition) {
    if (this.renderInProgress) {
      return;
    }

    this.renderInProgress = true;
    if (endPosition > this.NUM_PAGES) {
      endPosition = this.NUM_PAGES;
    }
    if (startPosition < 1) {
      startPosition = 1;
    }

    let numberOfPagesToRender = (endPosition - startPosition) + 1;
    for (let i = startPosition; i <= endPosition; i++) {
      if (!this.pageRenderedIndicators[i - 1]) {
        this.spinner.show();
        // If Render Options is not an array then use document level options,
        // If options as array is defined as an array then leverage the options at the page level
        let renderOptions = Array.isArray(this.RENDER_OPTIONS.options_by_page) ? this.RENDER_OPTIONS.options_by_page[i - 1] : this.RENDER_OPTIONS;
        UI.renderPage(i, renderOptions).then(([pdfPage, annotations]) => {

          numberOfPagesToRender--;
          this.pageRenderedIndicators[i - 1] = 1;

          // Use the first rendered page to calculate the actual height of a page
          if (i === 1) {
            const viewport = pdfPage.getViewport(this.RENDER_OPTIONS.scale, renderOptions.rotate);
            this.PAGE_HEIGHT = viewport.height;
          }

          if (this.thumbnails[i - 1].canvasElement === null) {
            this.generateThumbnail(pdfPage).then(canvas => {
              this.thumbnails[i - 1].canvasElement = canvas.toDataURL();
            });
          }

          this.sessionService.isPdfOnDisplay = true;

          // All pages in the batch have been rendered
          if (numberOfPagesToRender === 0) {
            this.postRender(endPosition);
          }
        }).catch(error => {
          console.log(error);
          this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.LOAD_ERR_PDF));
          this.postRender(i);
        });
      } else {
        numberOfPagesToRender--;
        if (numberOfPagesToRender === 0) {
          this.postRender(endPosition);
        }
      }
    }
  }

  postRender(endPosition) {
    this.spinner.hide();
    this.lastRenderedPage = endPosition;
    this.renderInProgress = false;
    this.putAnnotationLayerOnTop();
    if (this.renderQueue.length > 0) {
      this.renderEvents.next(this.renderQueue.shift());
    }
    if (this.sessionService.isPrintInProgress) { // Do not destroy pages while print is in progress
      this.printService.availableForPrint.next(); // Emit event to indicate that pdf has rendered fully and is available for printing.
    } else {
      this.destroyPages();
    }

    // For annotation tooltips to show on hover, need to put the annotation layer on top
    this.putAnnotationLayerOnTop();

    // After loading the PDF, resize the panels
    this.resizeService.resizePanels();
  }

  renderForPrint() {
    const renderedPageCount = this.pageRenderedIndicators.reduce(function(prev, cur) {
      return prev + cur;
    });
    if (renderedPageCount === this.NUM_PAGES) { // Means all pages are already rendered
      this.printService.availableForPrint.next(true);
    } else { // Render the whole pdf
      this.renderEvents.next(new RenderEvent(1, this.NUM_PAGES));
    }
  }

  onPdfScroll(event: Event) {
    const containerElement = <HTMLElement>event.target;
    const pages = containerElement.querySelectorAll('[id^="pageContainer"]');
    let maxVisiblePageNum = -1;
    if (pages) {
      for (let i = 0; i < pages.length; i++) {
        const page = pages.item(i);
        const rect = page.getBoundingClientRect();
        // Detect the last visible page in the viewport
        if (rect.top < containerElement.clientHeight && rect.bottom > containerElement.clientHeight) {
            maxVisiblePageNum = Number(page.getAttribute('data-page-number'));
            break;
        }
      }
    }
    if (isNaN(maxVisiblePageNum) || maxVisiblePageNum === -1) {
      return;
    }
    if (maxVisiblePageNum > this.NUM_PAGES) {
      maxVisiblePageNum = this.NUM_PAGES;
    }

    this.currentVisiblePage = maxVisiblePageNum;
    const scrollTop = containerElement.scrollTop;
    if (this.pageRenderedIndicators[maxVisiblePageNum - 1] === 0) { // If page is not rendered, trigger a render
      if (scrollTop > this.lastScrollTop) { // Scrolling down
        this.renderEvents.next(new RenderEvent(maxVisiblePageNum, maxVisiblePageNum + this.batchSize));
      } else { // Scrolling up
        this.renderEvents.next(new RenderEvent(maxVisiblePageNum - this.batchSize, maxVisiblePageNum));
      }
    }
    this.lastScrollTop = scrollTop;
  }

  onPdfKeyPress(event: KeyboardEvent) {
    // For Home and End key presses, prevent event propagation and use the handlePageEvent() function.
    // We don't want to trigger a scroll event for these keys.
    if (event.key === 'Home') {
      event.preventDefault();
      this.handlePageEvent(new PageEvent(new PageEventData(1), PageEvent.SCROLL_TO_PAGE));
    } else if (event.key === 'End') {
      event.preventDefault();
      this.handlePageEvent(new PageEvent(new PageEventData(this.NUM_PAGES), PageEvent.SCROLL_TO_PAGE));
    }
  }

  destroyPages() {
    const renderedPageCount = this.pageRenderedIndicators.reduce(function(prev, cur) {
      return prev + cur;
    });
    const pagesToDelete = [];

    if (renderedPageCount > this.maxPagesToKeepRendered) {
      let keepRangeStart, keepRangeEnd = 0;
      if (this.currentVisiblePage === 1) {
        keepRangeStart = 0;
        keepRangeEnd = this.maxPagesToKeepRendered - 1;
      } else if (this.currentVisiblePage === this.NUM_PAGES) {
        keepRangeEnd = this.NUM_PAGES - 1;
        keepRangeStart = this.NUM_PAGES - 1 - this.maxPagesToKeepRendered;
      } else {
        keepRangeStart = Math.round(this.currentVisiblePage - this.maxPagesToKeepRendered / 2);
        keepRangeEnd = Math.round(this.currentVisiblePage + this.maxPagesToKeepRendered / 2);
      }

      if (keepRangeStart < 0) {
        keepRangeStart = 0;
      }
      if (keepRangeEnd >= this.NUM_PAGES) {
        keepRangeEnd = this.NUM_PAGES - 1;
      }

      for (let i = 0; i < this.pageRenderedIndicators.length; i++) {
        if (i < keepRangeStart || i > keepRangeEnd) {
          if (this.pageRenderedIndicators[i] === 1) {
            if (i > this.batchSize && i < this.NUM_PAGES - this.batchSize) { // Always retain the first and last n pages
              pagesToDelete.push(i + 1);
            }
          }
        }
      }

      pagesToDelete.forEach(pageNum => {
        UI.derenderPage(pageNum).then(page => {
          this.pageRenderedIndicators[pageNum - 1] = 0; // Mark page as not rendered
        });
      });
    }
  }

  generateThumbnail(page) {
    // draw page to fit into 120x90 canvas
    const vp = page.getViewport(1);
    const canvas = document.createElement('canvas');
    canvas.width = 90;
    canvas.height = 120;
    const scale = Math.min(canvas.width / vp.width, canvas.height / vp.height);
    return Promise.all([
      page.render({ canvasContext: canvas.getContext('2d'), viewport: page.getViewport(scale) })
    ]).then(function() {
      return canvas;
    });
  }

  commentHandler(overlay) {
    const annotationId = overlay.getAttribute('data-target-id');
    PDFJSAnnotate.getStoreAdapter()
      .getComments(this.RENDER_OPTIONS.documentId, annotationId)
      .then(comments => {
        if (comments.length > 0) {
          const annotation = PDFJSAnnotate.getStoreAdapter().getAnnotationWithoutPromise(this.RENDER_OPTIONS.documentId, annotationId);
          let readOnly = false;
          if (annotation.user) {
            if (annotation.user.sAMAccountName !== this.sessionService.account.sAMAccountName) {
              readOnly = true;
            }
          }

          const commentWrapper = document.createElement('div');
          commentWrapper.setAttribute('id', 'comment-wrapper');
          commentWrapper.addEventListener('click', e => e.preventDefault());
          commentWrapper.className = 'alert alert-warning';
          commentWrapper.innerHTML =
            `<div class="comment-list">
                  <div class="comment-list-container">
                  </div>
                  <form class="comment-list-form">
                      <input type="text" placeholder="Add a Comment" />
                  </form>
              </div>`;
          overlay.appendChild(commentWrapper);

          const insertComment = function(comment) {
            const child = document.createElement('div');
            child.className = 'comment-list-item';
            child.innerHTML = twitter.autoLink(twitter.htmlEscape(comment.content));
            commentList.appendChild(child);
          };

          const commentList: HTMLElement = document.querySelector('#comment-wrapper .comment-list-container');
          const commentForm: HTMLFormElement = document.querySelector('#comment-wrapper .comment-list-form');
          const commentText: HTMLInputElement = commentForm.querySelector('input[type="text"]');

          if (readOnly) {
            commentForm.style.display = 'none';
          }

          comments.forEach(insertComment);
          commentForm.onsubmit = () => {
            PDFJSAnnotate.getStoreAdapter()
              .addComment(this.RENDER_OPTIONS.documentId, annotationId, commentText.value.trim())
              .then(insertComment)
              .then(() => {
                commentText.value = '';
                commentText.focus();
              });
            return false;
          };
          commentText.focus();
        }
      });
  }

  handleEvent(toolbarEvent: ToolbarEvent) {
    // Disable all annotators
    UI.disableEdit();
    UI.disablePen();
    UI.disableText();
    UI.disablePoint();
    UI.disableRect();
    UI.disableArrow();
    UI.disableCircle();

    // A note on the placement of the annotation layer:
    //
    // By default we want the annotation layer on top (for tooltips to work)
    // However some tools do not work when the annotation layer is on top. These
    // tools need to call putAnnotationLayerOnBottom() to push the annotation layer
    // down. For example, the highlight tool needs to select text. So the PDF layer
    // should be on top for the text select to work.

    this.putAnnotationLayerOnTop();

    // Enable the relevant annotator
    switch (toolbarEvent.eventType) {
      case 'cursor':
        UI.enableEdit(overlay => { this.commentHandler(overlay); }, ['comment-wrapper']);
        break;
      case 'draw':
        UI.setPen(toolbarEvent.eventData.size, toolbarEvent.eventData.color);
        UI.enablePen();
        break;
      case 'text':
        UI.setText(toolbarEvent.eventData.size, toolbarEvent.eventData.color);
        UI.enableText();
        break;
      case 'arrow':
        UI.setArrow(toolbarEvent.eventData.size, toolbarEvent.eventData.color);
        UI.enableArrow();
        break;
      case 'point':
        UI.enablePoint();
        break;
      case 'area':
        UI.enableRect(toolbarEvent.eventType);
        break;
      case 'highlight':
      case 'strikeout':
        this.putAnnotationLayerOnBottom();
        UI.enableRect(toolbarEvent.eventType);
        break;
      case 'emptycircle':
        UI.enableCircle(toolbarEvent.eventType);
        break;
      case 'scale':
        if(this.selectedPage && Array.isArray(this.RENDER_OPTIONS.options_by_page)){
          // set each page option to the selected scale from toolbar
          // this functionality is extendable where in the future if the client request zoom by page
          // we would only need to set the scale for the currently selected index (page)
          this.RENDER_OPTIONS.options_by_page.forEach( (option) => {
            option.scale = parseFloat(toolbarEvent.eventData.scale)
          });
          this.renderDocument();
        } else {
          this.RENDER_OPTIONS.scale = parseFloat(toolbarEvent.eventData.scale);
          this.renderDocument();
        }

        break;
      case 'rotate-cw':
        if(this.selectedPage) {
          this.renderSelectedDocument(this.selectedPage, 90);
        } else {
          this.RENDER_OPTIONS.rotate = this.getNewRotation(this.RENDER_OPTIONS.rotate, 90);
          this.renderDocument();
        }
        break;
      case 'rotate-ccw':
        if(this.selectedPage) {
          this.renderSelectedDocument(this.selectedPage, -90);
        } else {
          this.RENDER_OPTIONS.rotate = this.getNewRotation(this.RENDER_OPTIONS.rotate, -90);
          this.renderDocument();
        }
        break;
      case 'clear':
        // Reload annotations and re-render, effectively discarding any new edits since the last save
        this.loadAnnotations();
        break;
      case 'save':
        this.saveAnnotations();
    }
  }

  handlePageEvent(pageEvent: PageEvent) {
    switch (pageEvent.action) {
      case PageEvent.SCROLL_TO_PAGE:
        document.getElementById(`pageContainer${pageEvent.data.pageNum}`).scrollIntoView();
        document.getElementById('topbar').scrollIntoView();

        // Handle batched page rendering
        this.currentVisiblePage = pageEvent.data.pageNum;
        //Storing pageNum in a separate variable because the value for this.currentVisiblePage is dynamic
        //and for the needs of the single page rotation feature we need a more stable variable
        this.selectedPage = pageEvent.data.pageNum;
        let beginningPage = pageEvent.data.pageNum;
        let endPage = beginningPage + this.batchSize;
        if (pageEvent.data.pageNum === this.NUM_PAGES) {
          beginningPage = this.NUM_PAGES - this.batchSize + 1;
          if (beginningPage <= 0) {
            beginningPage = 1;
          }
          endPage = this.NUM_PAGES;
        }
        this.renderEvents.next(new RenderEvent(beginningPage, endPage));

        break;
    }
  }

  private putAnnotationLayerOnTop() {
    const annotationLayerElements = <HTMLElement[]>(<any>document.querySelectorAll('svg.annotationLayer'));
    // Put the annotation layer on top of the PDF layer
    annotationLayerElements.forEach((e: HTMLElement) => {
      e.style.zIndex = '10';
    });
  }

  private putAnnotationLayerOnBottom() {
    const annotationLayerElements = <HTMLElement[]>(<any>document.querySelectorAll('svg.annotationLayer'));
    // Reset zIndex so that annotation layer falls below the PDF layer
    annotationLayerElements.forEach((e: HTMLElement) => {
      e.style.zIndex = 'auto';
    });
  }
  addcomment()
  {

    let val:any=document.querySelector(".type-mes");
   
    var comemse={"name":val.value}
    this.commentlist.push(comemse)
    val.value="";
    
         //alert(this.commentlist)
  }
  chatboxminmize()
  {
    this.chatboxshow =! this.chatboxshow;
    var chatnox:any=document.querySelector('.chat-box');
    if (!this.chatboxshow){
      chatnox.style.top="721px";
      
      
    }
    else{
      chatnox.style.top="466px";
    }
  }

  saveAnnotations() {
    this.spinner.show();
    let annotations = PDFJSAnnotate.getStoreAdapter().getAnnotationsAsString(this.RENDER_OPTIONS.documentId);

    // If there are no annotations, try to delete
    if (annotations === null || annotations === 'null') {
      annotations = '[]';
    }

    if (this.RENDER_OPTIONS.options_by_page) {
      annotations = JSON.parse(annotations).filter((annotation) => annotation.type !== 'rotation');
      this.RENDER_OPTIONS.options_by_page.forEach((option, page) => {
        annotations.push({
          page: page + 1,
          type: 'rotation',
          rotate: option.rotate
        });
      });
      annotations = JSON.stringify(annotations);
    }

    this.dataService
      .saveAnnotations(this.pdfInfo.documentIds, this.pdfInfo.fileId, this.annotationsId, annotations)
      .pipe(finalize(() => {
          this.spinner.hide();
      }))
      .subscribe(response => {
        this.sessionService.savedAnnotations = response.annotateJson.annotations;
        this.annotationsId = response.id;
      });
  }

  // pdf-annotate.js can't handle negative rotation values. So for negative
  // rotations, we're going to keep rotating right till we to where we want.
  private getNewRotation(currentRotation: number, rotateBy: number): number {
    if (currentRotation + rotateBy < 0) {
      return currentRotation + rotateBy + 360;
    } else {
      return currentRotation + rotateBy;
    }
  }

  cancel() {
    // Clear the viewer
    const viewer = document.getElementById('viewer');
    viewer.innerHTML = '';

    // Set state/events to indicate that no PDF is being displayed.
    this.sessionService.isPdfOnDisplay = false;
    this.eventService.clearThumbs();
    this.sessionService.selectedFile = null;
    this.sessionService.savedAnnotations = null;
    this.eventService.resetPdfDisplay.next();
  }

  @HostListener('window:beforeunload')
  confirmExit() {
    if (this.pdfService.isPdfDirty()) {
      if (confirm()) {
        return true;
      } else {
        return false;
      }
    }
  }
}
