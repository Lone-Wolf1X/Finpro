# Finpro - Fintech SaaS Application

**© 2026 Next Gen Innovations Nepal**

Complete fintech SaaS platform with multi-tenant architecture, built with Java Spring Boot backend and React frontend.

## 🚀 Quick Start

### Easy Startup (Recommended)

```powershell
# Start both backend and frontend (kills old processes automatically)
npm start

# OR use PowerShell script directly
.\start.ps1

# To stop all servers
.\stop.ps1
```

### Prerequisites
Before you begin, ensure you have installed:
- ✅ PostgreSQL 18 (Already installed, running on port 5433)
- ✅ Java 21
- ✅ Apache Maven 3.9+
- ✅ Node.js 18+

**👉 See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed installation instructions**

---

## 📁 Project Structure

```
Finpro/
├── backend/              # Java Spring Boot API
│   ├── src/
│   │   ├── main/java/com/fintech/finpro/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── entity/          # JPA entities
│   │   │   ├── repository/      # Data repositories
│   │   │   ├── service/         # Business logic
│   │   │   ├── security/        # JWT & Security
│   │   │   └── tenant/          # Multi-tenancy
│   │   └── resources/
│   │       ├── application.properties
│   │       └── db/migration/    # Flyway migrations
│   └── pom.xml
├── frontend/             # React + Vite (Coming soon)
├── database/             # Database scripts
│   ├── init_database.sql
│   └── create_schema.sql
└── SETUP_GUIDE.md        # Installation guide
```

---

## 🗄️ Database

**PostgreSQL 18** - Multi-tenant SaaS architecture

- **Database:** `fintech_saas`
- **Port:** 5433 (not default 5432)
- **Username:** `postgres`
- **Password:** `123`

### Core Tables
- `tenants` - Tenant/company management
- `users` - Staff users (Admin, Maker, Checker, Investor)
- `activity_logs` - Audit trail

### Modules (Coming in phases)
- **Customer Module** - Customer management, KYC
- **Bank Module** - Accounts, transactions, fees
- **IPO Module** - IPO listings, applications, allotments
- **Investor Module** - Portfolio, holdings, investments

---

## 🛠️ Tech Stack

### Backend
- Java 21
- Spring Boot 3.2.2
- Spring Data JPA
- Spring Security + JWT
- PostgreSQL Driver
- Flyway Migration
- Lombok
- ModelMapper
- Swagger/OpenAPI

### Frontend (Planned)
- React 19
- Vite
- TypeScript
- Redux Toolkit
- Tailwind CSS

---

## 🏃 Running the Application

### 1. Install Prerequisites
Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) to install Java 21 and Maven.

### 2. Build Backend
```powershell
cd backend
mvn clean install
```

### 3. Run Backend
```powershell
mvn spring-boot:run
```

### 4. Access Application
- **API Base:** http://localhost:8080/api
- **Swagger UI:** http://localhost:8080/api/swagger-ui.html
- **Health Check:** http://localhost:8080/api/health

---

## 📋 Development Phases

### ✅ Phase 0: Planning & Setup
- [x] Project structure created
- [x] PostgreSQL database initialized
- [x] Maven project configured

### 🔄 Phase 1: Core Infrastructure (In Progress)
- [x] Base entities and repositories
- [x] Multi-tenant context
- [x] Health check endpoint
- [ ] JWT authentication
- [ ] Security configuration

### 📅 Phase 2: Customer Module (Upcoming)
- Customer CRUD operations
- KYC management
- Bulk upload

### 📅 Phase 3: Bank Module
- Account management
- Transactions
- Fee calculations

### 📅 Phase 4: IPO Module
- IPO listings
- Application processing
- Allotment & refunds

### 📅 Phase 5: Investor Module
- Portfolio tracking
- Investment management
- Profit distribution

### 📅 Phase 6: Frontend
- React + Vite setup
- Authentication UI
- Module-specific interfaces

---

## 🔐 Authentication & Roles

### Roles
- **ADMIN** - Full system access, user management
- **MAKER** - Create records, submit applications
- **CHECKER** - Verify and approve submissions
- **INVESTOR** - View portfolio, track investments

### Default Superadmin
- Email: `admin@fintech.com`
- Staff ID: `STAFF-000`
- Role: ADMIN
- Tenant: SUPERADMIN

---

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Installation instructions
- [Backend README](./backend/README.md) - Backend-specific docs
- [Implementation Plan](./docs/implementation_plan.md) - Detailed technical plan

---

## 🤝 Contributing

This is a phase-wise development project. Each module will be built, tested, and verified before moving to the next phase.

---

## 📝 License

Proprietary - Fintech SaaS Platform

---

## 🆘 Support

For issues or questions:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for installation help
2. Review [Implementation Plan](./docs/implementation_plan.md) for architecture details
3. Contact the development team

---

**Current Status:** Phase 1 - Core Infrastructure Development 🚧
