import { Injectable } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { EventService } from './event.service';
import { ResizeSensor } from 'css-element-queries';

/*
  This class resizes various elements in the application so that they stay
  aligned. This could have been done with CSS media queries, but that would
  require a whole lot of code. Simpler to do it with JavaScript.
*/

@Injectable({
  providedIn: 'root'
})
export class ResizeService {
  constructor(private eventManager: EventManager) {
    eventManager.addGlobalEventListener('window', 'resize', e => {
      this.resizePanels();
    });

    eventManager.addGlobalEventListener('window', 'load', e => {
      this.resizePanels();

      // If the sidebar is expanded, collapsed, the 'page-list' element would
      // also change. Add a listener for it and do a resizePanels
      const pageList = document.getElementById('page-list');
      const sensor = new ResizeSensor(pageList, () => {
        this.resizePanels();
      });
    });
  }

  get currentSize(): any {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  resizePanels() {
    const topbar: HTMLElement = <HTMLElement>document.getElementById('topbar');
    const toolbar: HTMLElement = <HTMLElement>document.getElementById('toolbar');
    const docListHeader: HTMLElement = <HTMLElement>document.querySelector('div#doc-list div.panel-heading');
    const docListContainer: HTMLElement = <HTMLElement>document.querySelector('div#doc-list div.panel-body');
    const pageList: HTMLElement = <HTMLElement>document.getElementById('page-list');
    const contentWrapper: HTMLElement = <HTMLElement>document.getElementById('content-wrapper');
    const footer: HTMLElement = <HTMLElement>document.getElementById('footer');
    const commentBox: HTMLElement = <HTMLElement>document.getElementById('comment-box');

    // Calculate height that is available after excluding the height of the topbar and toolbar
    const availableHeight = this.currentSize.height - (topbar.offsetHeight + toolbar.offsetHeight + footer.offsetHeight);
    const docListHeight = availableHeight / 3;

    docListContainer.style.height = (docListHeight - docListHeader.offsetHeight).toString() + 'px';
    pageList.style.height = (availableHeight - docListHeight - 15).toString() + 'px';
    contentWrapper.style.height = (availableHeight - 10).toString() + 'px';

    // Width available for the pdf viewer is the total width minus the width of the sidebar (i.e. either the width of docList or pageList)
    const availableWidth = this.currentSize.width - docListHeader.offsetWidth-70;

    //contentWrapper.style.width = (availableWidth - 25).toString() + 'px';

    if (commentBox) {
      commentBox.style.bottom = (footer.offsetHeight) + 'px';
    }
  }
}
