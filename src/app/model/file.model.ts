export interface MetaData {
  uploadByUserName: string;
  UniqueIdentifier: string;
  uploadByUserId: string;
  _class: string;
  contentType: string;
}

export interface File {
  fileId: string;
  fileName: string;
  type: string;
  contentType: string;
  fileSize: string;
  metaData: MetaData;
  status: string;
  errorMessage?: string;
  uploadDate: string;
  uploadBy: string;
  updatedDate?: string;
  updatedBy?: string;
}
