import { Injectable } from '@angular/core';
import PDFJSAnnotate from '../../assets/scripts/pdf-annotate';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(private sessionService: SessionService) { }

  isPdfDirty() {
    if (this.sessionService.isPdfOnDisplay) {
      if (this.sessionService.savedAnnotations === null) { // There are no saved annotations
        const annotations = PDFJSAnnotate.getStoreAdapter().getAllAnnotations(this.sessionService.selectedFile.fileId);
        if (annotations.length > 0) { // If new annotations were added, return true
          return true;
        }
      }

      // Get annotations as string
      const annotationsStr = PDFJSAnnotate.getStoreAdapter().getAnnotationsAsString(this.sessionService.selectedFile.fileId);
      // If the string values differ, then annotations were modified. Return true.
      if (this.sessionService.savedAnnotations !== null && annotationsStr !== this.sessionService.savedAnnotations) {
        return true;
      }
    }
    return false;
  }

  deleteAnnotationsForPages(fileId, pageNumsToDelete: number[]) {
    // Get all page level annotations
    const annotations = PDFJSAnnotate.getStoreAdapter().getAllAnnotations(fileId).filter(annotation => annotation.type !== 'docLevelAnnotation');

    const remainingAnnotations = [];
    const commentAnnotations = annotations.filter(annotation => annotation.class === 'Comment');
    annotations.forEach(annotation => {
      if (annotation.class !== 'Comment') { // We'll deal with comment annotations later
        if (pageNumsToDelete.indexOf(annotation.page) === -1) {
          remainingAnnotations.push(annotation);
        }
      }
    });

    /*
      After a page is deleted, we need to adjust the page numbers in the annoations
      of other pages.
    */

    // Map annotations by page number
    const pageAnnotationMap = new Map();
    remainingAnnotations.forEach(annotation => {
      let annotationsForPage = pageAnnotationMap.get(annotation.page);
      if (!annotationsForPage) {
        annotationsForPage = [];
      }
      annotationsForPage.push(annotation);
      pageAnnotationMap.set(annotation.page, annotationsForPage);
    });

    // Sort the keys i.e. sort by page number
    const keysArray = [];
    pageAnnotationMap.forEach((value, key) => keysArray.push(key));
    keysArray.sort();

    // Get annotations for each page number and re-number them starting at 1
    let newAnnotations = [];
    let newCommentAnnotations = [];
    keysArray.forEach((key, index) => {
      const annotationsForPage = pageAnnotationMap.get(key);
      annotationsForPage.forEach((annotation) => {
        annotation.page = (index + 1);
        newAnnotations.push(annotation);
        // If this is a 'point' annotation, add the comment annotations associated with it.
        if (annotation.type === 'point') {
          newCommentAnnotations = newCommentAnnotations.concat(commentAnnotations
            .filter(commentAnnotation => commentAnnotation.annotation === annotation.uuid));
        }
      });
    });

    newAnnotations = newAnnotations.concat(newCommentAnnotations);

    // Get doc level annotation
    const docLevelAnnotation = PDFJSAnnotate.getStoreAdapter().getAllAnnotations(fileId).find(annotation => annotation.type === 'docLevelAnnotation');
    // Add it to the new list
    if (docLevelAnnotation) {
      newAnnotations.push(docLevelAnnotation);
    }
    return newAnnotations;
  }
}
