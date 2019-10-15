export class Message {
    constructor(
        public type: string,
        public text: string
    ) {}
}

export class MsgConstants {
    // Message types. (Use bootstrap alert class values for now)
    public static INFO = 'info';
    public static WARN = 'warning';
    public static ERROR = 'danger';

    // Error messages
    public static LOAD_ERR_DOC_ID = 'No Document Id.';
    public static LOAD_ERR_VOUCHER_INFO = 'Error while loading voucher info. Contact FMIS Support.';
    public static LOAD_ERR_FILE_LIST = 'Error while loading file list. Contact FMIS Support.';
    public static LOAD_ERR_PDF = 'Error while loading PDF. Contact FMIS Support.';
    public static LOAD_ERR_ANNOTATIONS = 'Error while loading annotations. Contact FMIS Support.';
    public static SAVE_ERR_ANNOTATIONS = 'Error while saving annotations. Contact FMIS Support.';
    public static DEL_ERR_ALL_PAGES = 'You cannot delete all pages in a document.';
}
