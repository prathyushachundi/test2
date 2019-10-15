export interface OfficeCode {
    officeCd: string;
    officeFundingCd: string;
    groupKey: string;
    endDt?: any;
    officeAbbr: string;
    officeTitleTxt: string;
    startDt: string;
    stateAbbr?: any;
}

export interface ContactInfo {
    contactKey: number;
    addressKey: number;
    emailTxt?: any;
    fullNameNm: string;
    lastNameNm: string;
    preferredNm: string;
    userId?: any;
    officialTitleTxt?: any;
    addressInfo?: any;
}

export interface AddressInfo {
    contactNm: string;
    countryCd: string;
    countryNm?: any;
    line1StreetAddr: string;
    line2StreetAddr: string;
    line3StreetAddr: string;
    phoneNbr: string;
    faxNbr?: any;
    prefCityName: string;
    stateAbbrev: string;
    zipCodeCd: string;
}

export interface VoucherOfficeInfo {
    officeCode: OfficeCode;
    contactInfo: ContactInfo;
    addressInfo: AddressInfo;
}

export interface VoucherInfo {
    voucherNo: string;
    voucherNos: string[];
    voucherCreator: string;
    voucherCreatorDisplayName: string;
    createDate: Date;
    officeCode: string;
    officeTitle: string;
    fundTitle: string;
    fundCode: string;
    voucherOfficeInfo: VoucherOfficeInfo;
    voucherAmount: number;
}
