export interface Account {
    id?: string;
    sAMAccountName: string;
    login: string;
    password?: string;
    firstName: string;
    lastName: string;
    email: string;
    activated: boolean;
    langKey?: string;
    imageUrl?: string;
    activationKey?: string;
    resetKey?: string;
    resetDate?: string;
    displayName: string;
    department: string;
    departmentDescription: string;
    distinguishedName: string;
    authorities: string[];
    rootOrganization: string;
    organizations: string[];
    authoritiesByOrg: Map<string, Authority[]>;
    tokenExpires: Date;
}

export interface Authority {
  authorityName: string;
  description?: string;
  shortName: string;
  privilegedAccessFlag: boolean;
  privilegedAccessGroup: string;
  formattedName: string;
}
