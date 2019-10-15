import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, finalize } from 'rxjs/operators';
import { PageEvent, PageEventData } from '../../model/event.model';
import { File, MetaData } from '../../model/file.model';
import { Thumbnail } from '../../model/thumbnail.model';
import { DataService } from '../../services/data.service';
import { EventService } from '../../services/event.service';
import { SessionService } from '../../services/session.service';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Message, MsgConstants } from '../../model/message.model';
import { PdfService } from '../../services/pdf.service';
import {BaseComponent} from "../base.component";

@Component({
  selector: 'app-doc-list',
  templateUrl: './doc-list.component.html',
  styleUrls: ['./doc-list.component.css'],
  providers: [ NgxSpinnerService ]
})
export class DocListComponent extends BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchBox')
  searchBox: ElementRef;

  docTypes = ['', 'Transportation', 'Per Diem hotel', 'Per Diem meals'];
  thumbnails: any;
  bulkDeleteMode = false;
  fileList: File[] = [];
  filteredFileList: File[] = [];
  modalDisplay = 'none';
  modalType = '';
  documentIds: string[];
  lastSelectedFile: File = null;
  expandTable = false;
  currentlySelectedThumbnail: Thumbnail;

  spinnerInFileList = false;
  spinnerInThumbList = false;

  private testThumbnails = [];

  searchFilterSubscription: Subscription;
  thumbsSubscription: Subscription;
  fileListSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    public sessionService: SessionService,
    private dataService: DataService,
    private spinner: NgxSpinnerService,
    private pdfService: PdfService, 
    private changeDetectionRef: ChangeDetectorRef) {
    super();
  }
  private getthu(callback){
    //this.thumbnails=[]
    this.eventService.thumbsSubject.subscribe(thumbnails =>{
      
      this.thumbnails = thumbnails;
      console.log(this.thumbnails, 'this thumbnails....')
      callback(thumbnails)
      // this.changeDetectionRef.markForCheck();      

    });
  }

  ngOnInit() {
    

    this.documentIds = this.sessionService.documentIds;
    this.loadFileList();
    this.generateeFileList();
  }

  private loadFileList() {
    this.dataService.fetchFileList(this.documentIds)
    .pipe(
      finalize(() => {
        this.spinnerInFileList = false;
        this.spinner.hide();
      })
    )
    .subscribe(fileList => {
      this.fileList = fileList;
      this.filteredFileList = this.fileList;

      // If we are reloading the file list and already have a file selected,
      // check if that file was modified. If it was, ask to reload the file.
      if (this.lastSelectedFile !== null) {
        for (let i = 0; i < this.fileList.length; i++) {
          if (this.lastSelectedFile.fileId === this.fileList[i].fileId) {
            if (this.lastSelectedFile.uploadDate !== this.fileList[i].uploadDate) {
              this.modalType = 'reloadFile';
              this.showModal();
            }
          }
        }
      }
    });
  }

  ngAfterViewInit() {
    const searchFilter = fromEvent(this.searchBox.nativeElement, 'input').pipe(
      map((e: KeyboardEvent) => (<HTMLInputElement>e.target).value),
      debounceTime(10),
      distinctUntilChanged()
    );

    this.searchFilterSubscription = searchFilter.subscribe(data => this.filterFileList(data));
  }

  ngOnDestroy() {
    this.searchFilterSubscription.unsubscribe();
    this.thumbsSubscription.unsubscribe();
    this.fileListSubscription.unsubscribe();
  }


  generateeFileList() {
    const fileNames = ['test.pdf', 'sample.pdf','product.pdf']

    const files: File[] = [];
    for(const fileName of fileNames){
      const file: File = <File>{};
      file.fileName = fileName;
      file.fileId = fileName;
      file.contentType = '';
      file.fileSize = '';
      file.metaData = <MetaData>{uploadByUserName: '', uploadByUserId: '', UniqueIdentifier: '', contentType: ''};
      file.status = '';
      file.errorMessage = '';
      file.updatedBy = '';
      file.uploadBy = '';
      file.uploadDate = '';
      file.updatedBy = '';
      file.updatedDate = '';
      files.push(file);
    }
    this.filteredFileList = files;
  }


  filterFileList(data: string, fields: string[] = ['name', 'uploadBy', 'uploadDate', 'type']) {
    if (data === '') {
      this.filteredFileList = this.fileList;
      return;
    }

    data = data.toLowerCase();

    this.filteredFileList = [];
    this.fileList.forEach(file => {
      let match = false;
      for (let i = 0; i < fields.length; i++) {
        if (fields[i] === 'name') {
          if (file.fileName.toLowerCase().indexOf(data) !== -1) {
            match = true;
          }
        }

        if (!match && fields[i] === 'uploadBy') {
          if (file.uploadBy.toLowerCase().indexOf(data) !== -1) {
            match = true;
          }
        }

        if (!match && fields[i] === 'uploadDate') {
          // Use the same date format as that in the html template
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          const uploadDate = new Date(file.uploadDate);
          if (uploadDate.toLocaleDateString('en-US', options).indexOf(data) !== -1) {
            match = true;
          }
        }

        if (!match && fields[i] === 'type') {
          if (file.type && file.type.toLowerCase().indexOf(data) !== -1) {
            match = true;
          }
        }
      }

      if (match) {
        this.filteredFileList.push(file);
      }
    });
  
  }

  thumbnailClick(event, thumbnail: Thumbnail):void {
    // Check if we are trying to select multiple pages with Ctrl + click
    if (event.ctrlKey || event.metaKey) {

      // If no delete authority, no point in allowing user to select multiple thumbnails
      if (!this.canDelete()) {
        return;
      }

      // If this thumbnail was selected before, de-select it
      if (thumbnail.selected) {
        thumbnail.selected = false;

        // If we are left with no thumbnails selected, exit bulk delete mode
        const isSomeThumbnailSelected = this.thumbnails.some(t => t.selected);
        if (!isSomeThumbnailSelected) {
          this.bulkDeleteMode = false;
        }
      } else {
        thumbnail.selected = true;
        // Enter bulk delete mode
        this.bulkDeleteMode = true;
      }
      return;
    }

    // If we are not selecting multiple pages, select just the clicked thumbnail
    thumbnail.selected = true;
    this.currentlySelectedThumbnail = thumbnail;
    this.thumbnails.forEach(t => {
      if (t.pageNum !== thumbnail.pageNum) {
        t.selected = false;
      }
    });

    // If we were in bulk delete mode, but clicked on a thumbnail, exit bulk delete mode
    this.bulkDeleteMode = false;

    // Send out an event so that the page for the selected thumbnail scrolls into view
    const data = new PageEventData(thumbnail.pageNum);
    this.eventService.pageEventsSubject.next(new PageEvent(data, PageEvent.SCROLL_TO_PAGE));
  }

  bulkAction(action: string) {
    this.eventService.clearMessages();
    if (action === 'delete') {
      const pagesToDelete =
        this.thumbnails
          .filter(thumbnail => thumbnail.selected)
          .map(thumbnail => thumbnail.pageNum);

      this.deletePages(pagesToDelete);
    } else {
      // De-select all thumbnails
      this.thumbnails.forEach(thumbnail => {
        thumbnail.selected = false;
      });
      this.bulkDeleteMode = false;
    }
  }

  private deletePages(pagesToDelete: number[]) {
    if (pagesToDelete.length === this.thumbnails.length) {
      this.eventService.clearMessages();
      this.eventService.addMessage(new Message(MsgConstants.ERROR, MsgConstants.DEL_ERR_ALL_PAGES));
      return;
    }
    this.spinner.show();
    this.spinnerInThumbList = true;
    const fileId = this.sessionService.selectedFile.fileId;

    this.dataService.deletePages(fileId, pagesToDelete)
      .pipe(finalize(() => {
        this.spinner.hide();
        this.spinnerInThumbList = false;
      }))
      .subscribe(newFile => {
        this.bulkDeleteMode = false;
        const oldFile = this.sessionService.selectedFile;
        const newAnnotations = this.pdfService.deleteAnnotationsForPages(oldFile.fileId, pagesToDelete);
        this.thumbnails = [];

        this.dataService
          .saveAnnotations(this.documentIds, newFile.fileId, null, JSON.stringify(newAnnotations))
          .subscribe(response => {
            // Replace old file in the file list
            const index = this.fileList.indexOf(oldFile);
            this.fileList[index] = newFile;
            // Replace old file in session
            this.sessionService.selectedFile = newFile;
            // Re-load new file
            this.dataService.fetchPdf(this.documentIds, newFile.fileId);
          });
      });
  }

  getFile(file: File, noModal: boolean = false) {
    let ser=this.getthu(function(val){
      this.testThumbnails = val;
    })
    this.lastSelectedFile = file;
    this.bulkDeleteMode = false;

    if (!noModal && this.pdfService.isPdfDirty()) {
      this.modalType = 'confirmSwitch';
      this.showModal();
      return;
    }

    this.sessionService.selectedFile = file;
    this.eventService.clearMessages();
    this.thumbnails = [];
    this.dataService.fetchPdf(this.documentIds, file.fileId);
  }

  refreshFileList() {
    this.spinnerInFileList = true;
    this.spinner.show();
    this.loadFileList();
  }

  toggleExpand(elem: HTMLElement) {
    this.expandTable = !this.expandTable;
    this.eventService.expandSidebarSubject.next(this.expandTable);
  }

  showModal() {
    this.modalDisplay = 'flex';
  }

  modalCancel() {
    this.modalDisplay = 'none';
  }

  modalOk() {
    if (this.modalType === 'confirmSwitch') {
      this.getFile(this.lastSelectedFile, true);
    }

    if (this.modalType === 'reloadFile') {
      setTimeout(() => { // Needed to let this modal finish up
        this.getFile(this.lastSelectedFile);
      });
    }

    if (this.modalType === 'bulkDeletePage') {
        this.bulkAction('delete');
    }

    if (this.modalType === 'deletePage') {
      this.deletePages([this.currentlySelectedThumbnail.pageNum]);
    }

    this.modalDisplay = 'none';
  }

  canDelete(): boolean {
    // if (this.sessionService.documentTaskStatus === 'COMPLETED') {
    //   return false;
    // }
    // if (this.sessionService.isOrgAdmin) {
    //   return true;
    // }
    // if (this.sessionService.selectedFile != null) {
    //   return this.sessionService.selectedFile.metaData.uploadByUserId === this.sessionService.account.sAMAccountName;
    // }
    return true;
  }
}
