export class ToolbarEvent {
    constructor(public eventType: string, public eventData: any) {}
}

export class PageEventData {
    constructor(public pageNum: number) { }
}
export class PageEvent {
    public static SCROLL_TO_PAGE = 'scrollToPage';
    public static DELETE_PAGES = 'deletePages';

    constructor(public data: PageEventData, public action: string) {}
}

export class RenderEvent {
  constructor(public startPosition: number, public endPosition: number) { }

}
