export interface User {
    id: number;
    email: string;
    staffId: string;
    userId: string;
    firstName: string;
    lastName: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'MAKER' | 'CHECKER' | 'INVESTOR';
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    tenantId: number;
    createdAt: string;
    updatedAt: string;
}

export interface Tenant {
    id: number;
    tenantKey: string;
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    status: 'ACTIVE' | 'INACTIVE';
    subscriptionPlan: string;
    subscriptionExpiry: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User;
    tenant: Tenant;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    staffId: string;
    userId?: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MAKER' | 'CHECKER' | 'INVESTOR';
    tenantId: number;
}

export interface UpdateUserRequest {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'ADMIN' | 'MAKER' | 'CHECKER' | 'INVESTOR';
    status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    avatarUrl?: string;
    password?: string;
    userId?: string;
    staffId?: string;
}

// Customer Module Types

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type CustomerType = 'MAJOR' | 'MINOR';
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'RETURNED';
export type AccountType = 'SAVINGS' | 'CURRENT' | 'FIXED_DEPOSIT';
export type IPOStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'ALLOTTED' | 'LISTED';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALLOTTED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface Customer {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    gender: Gender;
    dateOfBirth: string;
    age: number;
    customerType: CustomerType;
    contactNumber?: string;
    bankAccountNumber?: string;
    bankId?: number;
    bankName?: string;
    address?: string;
    kycStatus: KycStatus;
    remarks?: string;
    customerCode?: string;
    citizenshipNumber?: string;
    nidNumber?: string;
    guardianId?: number;
    guardianName?: string;
    guardianRelation?: string;
    createdByUserId?: number;
    approvedByUserId?: number;
    photoPath?: string;
    signaturePath?: string;
    guardianPhotoPath?: string;
    guardianSignaturePath?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: Gender;
    dateOfBirth: string;
    contactNumber?: string;
    bankAccountNumber?: string;
    bankId: number;
    address?: string;
    citizenshipNumber?: string;
    nidNumber?: string;
    guardianId?: number;
    guardianName?: string;
    guardianRelation?: string;
    remarks?: string;
    photoPath?: string;
    signaturePath?: string;
    guardianPhotoPath?: string;
    guardianSignaturePath?: string;
    secondaryBankAccounts?: {
        bankId: number;
        accountNumber: string;
        accountType: AccountType;
        branchName?: string;
    }[];
}

export interface LedgerAccount {
    id: number;
    accountName: string;
    accountType: string;
    ownerId?: number;
    balance: number;
    currency: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface BankAccount {
    id: number;
    customerId: number;
    customerName: string;
    bankName: string;
    accountNumber: string;
    accountType: AccountType;
    ifscCode?: string;
    branchName?: string;
    isPrimary: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBankAccountRequest {
    customerId: number;
    bankName: string;
    accountNumber: string;
    accountType: AccountType;
    ifscCode?: string;
    branchName?: string;
    isPrimary?: boolean;
}

export interface IPO {
    id: number;
    companyName: string;
    symbol?: string;
    issueSize: number;
    pricePerShare: number;
    minQuantity: number;
    maxQuantity: number;
    openDate: string;
    closeDate: string;
    allotmentDate?: string;
    listingDate?: string;
    status: IPOStatus;
    description?: string;
    isOpen: boolean;
    isClosed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIPORequest {
    companyName: string;
    symbol?: string;
    issueSize: number;
    pricePerShare: number;
    minQuantity: number;
    maxQuantity: number;
    openDate: string;
    closeDate: string;
    allotmentDate?: string;
    listingDate?: string;
    description?: string;
}

export interface IPOApplication {
    id: number;
    customerId: number;
    customerName: string;
    ipoId: number;
    ipoCompanyName: string;
    bankAccountId?: number;
    bankAccountNumber?: string;
    quantity: number;
    amount: number;
    applicationNumber: string;
    applicationStatus: ApplicationStatus;
    paymentStatus: PaymentStatus;
    allotmentQuantity: number;
    allotmentStatus: string;
    appliedAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIPOApplicationRequest {
    customerId: number;
    ipoId: number;
    bankAccountId: number;
    quantity: number;
}

export interface DashboardStats {
    totalUsers: number;
    totalCustomers: number;
    activeCustomers: number;
    pendingApprovals: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
// Bulk Deposit Types
export interface BulkDepositItem {
    id: number;
    customerId: number;
    customerName: string;
    customerCode: string;
    amount: number;
    remarks: string;
    status: string;
}

export interface BulkDeposit {
    id: number;
    batchId: string;
    makerId: number;
    checkerId?: number;
    totalAmount: number;
    itemCount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
    remarks?: string;
    createdAt: string;
    items?: BulkDepositItem[];
}

export interface CreateBulkDepositRequest {
    remarks: string;
    items: {
        customerId: number;
        amount: number;
        remarks: string;
    }[];
}
