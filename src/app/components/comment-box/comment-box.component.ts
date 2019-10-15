import { Component, OnInit } from '@angular/core';
import PDFJSAnnotate from '../../../assets/scripts/pdf-annotate';
import {DataService} from "../../services/data.service";
import {PdfInfo} from "../../model/pdf-info.model";
import {EventService} from "../../services/event.service";
import {SessionService} from "../../services/session.service";
import {Annotation, Comment} from "../../model/annotation.model";

@Component({
  selector: 'app-comment-box',
  templateUrl: './comment-box.component.html',
  styleUrls: ['./comment-box.component.css']
})
export class CommentBoxComponent implements OnInit {
  docLevelAnnotation: Annotation;
  inputComment: string;
  isNewAnnotation = false;
  collapseComment = true;
  fileId: string = null;

  constructor(private sessionService: SessionService,
              private eventService: EventService) { }

  ngOnInit() {
    this.eventService.annotationsLoaded.subscribe(() => {
      this.isNewAnnotation = false;
      this.fileId = this.sessionService.selectedFile.fileId;
      this.docLevelAnnotation = null;

      const annotations = PDFJSAnnotate.getStoreAdapter().getAllAnnotations(this.fileId);
      this.docLevelAnnotation = annotations.find(annotation => annotation.type === 'docLevelAnnotation');
      if (!this.docLevelAnnotation) {
        this.docLevelAnnotation = new Annotation('docLevelAnnotation', []);
        this.isNewAnnotation = true;
      }
    })
  }

  addComment() {
    if (this.inputComment.trim() !== '') {
      const comment = new Comment(this.sessionService.account.sAMAccountName, this.inputComment, new Date());
      this.docLevelAnnotation.comments.push(comment);
      if (this.isNewAnnotation) {
        PDFJSAnnotate.getStoreAdapter().addAnnotation(this.fileId, null, this.docLevelAnnotation);
        this.isNewAnnotation = false;
      } else {
        PDFJSAnnotate.getStoreAdapter().editAnnotation(this.fileId, this.docLevelAnnotation.uuid, this.docLevelAnnotation);
      }
    }
    this.inputComment = '';
  }
}
