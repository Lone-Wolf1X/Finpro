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
export type IPOStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'ALLOTTED' | 'LISTED' | 'ALLOTMENT_PHASE';
export type ApplicationStatus = 'PENDING' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'ALLOTTED';
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
    initialDeposit?: number;
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
    initialDeposit?: number;
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
    accountCode?: string;
}

export interface ProfitSummary {
    accountId: number;
    accountName: string;
    currentBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
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
    balance?: number;
    heldBalance?: number;
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

export interface BankTransaction {
    id: number;
    date: string;
    type: string;
    amount: number;
    description: string;
    referenceId?: string;
    status: string;
}

export interface AccountStatement {
    accountId: number;
    accountNumber: string;
    bankName: string;
    customerName: string;
    currentBalance: number;
    transactions: BankTransaction[];
}

export interface IPO {
    id: number;
    companyName: string;
    symbol?: string;
    issueSize: number;
    pricePerShare: number;
    currentPrice?: number;
    lastClosingPrice?: number;
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
    bankAccountId: number;
    bankAccountNumber: string;
    quantity: number;
    amount: number;
    applicationNumber: string;
    applicationStatus: string;
    paymentStatus: string;
    allotmentQuantity: number;
    allotmentStatus: string;
    appliedAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    approvedBy?: string;
    makerId?: number;
    checkerId?: number;
    createdAt: string;
    updatedAt: string;
}

export interface AccountLien {
    id: number;
    bankAccountId: number;
    amount: number;
    purpose: string;
    referenceId: string;
    status: string;
    startDate?: string;
    expiryDate?: string;
    reason?: string;
    createdAt: string;
}

export interface AccountBalanceInfo {
    accountNumber: string;
    bankName: string;
    customerName: string;
    totalBalance: number;
    heldBalance: number;
    availableBalance: number;
    accountType: string;
    status: string;
}

export interface ATBRequest {
    accountNumber: string;
    amount: number;
    particulars: string;
    transactionType: 'DEPOSIT' | 'WITHDRAWAL';
}

export interface CreateIPOApplicationRequest {
    customerId: number;
    ipoId: number;
    bankAccountId: number;
    quantity: number;
    makerId?: number;
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

export interface PendingTransaction {
    id: number;
    transactionType: string;
    amount: number;
    customerName?: string;
    accountNumber?: string;
    targetAccountName?: string;
    description?: string;
    makerName?: string;
    createdAt: string;
    status: string;
}

export interface CustomerPortfolio {
    id: number;
    customerId: number;
    customerName: string;
    ipoId?: number;
    ipoCompanyName?: string;
    scripSymbol: string;
    quantity: number;
    purchasePrice: number;
    totalCost: number;
    currentPrice?: number;
    currentValue?: number;
    lastClosingPrice?: number;
    valueAsOfLastClosingPrice?: number;
    profitLoss?: number;
    holdingSince: string;
    status: string;
    isBonus: boolean;
}

export interface BankDTO {
    id: number;
    name: string;
    branchName: string;
    localBody?: string;
    isCasba?: boolean;
    casbaCharge?: number;
    active: boolean;
}

export interface AllotmentDraft {
    id: number;
    ipoId: number;
    ipoCompanyName: string;
    ipoSymbol: string;
    applicationId: number;
    applicationNumber: string;
    customerId: number;
    customerName: string;
    appliedQuantity: number;
    appliedAmount: number;
    isAllotted: boolean;
    allottedQuantity: number;
    status: string;
    makerId: number;
    makerName: string;
    checkerId?: number;
    checkerName?: string;
    createdAt: string;
    submittedAt: string;
    verifiedAt?: string;
    remarks?: string;
}

export interface AllotmentSubmission {
    ipoId: number;
    items: {
        applicationId: number;
        quantity: number;
        isAllotted: boolean;
    }[];
}

export interface PortfolioTransaction {
    id: number;
    customerId: number;
    scripSymbol: string;
    transactionType: 'BUY' | 'SELL' | 'ALLOTMENT' | 'BONUS';
    quantity: number;
    pricePerShare: number;
    totalAmount: number;
    transactionFee?: number;
    referenceId?: string;
    remarks?: string;
    transactionDate: string;
}
