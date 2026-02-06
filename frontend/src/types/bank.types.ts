export interface Bank {
    id: number;
    name: string;
    branchName?: string;
    localBody?: string;
    isCasba: boolean;
    casbaCharge: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface BankCreateDTO {
    name: string;
    branchName?: string;
    localBody?: string;
    isCasba: boolean;
    casbaCharge: number;
    active: boolean;
}
