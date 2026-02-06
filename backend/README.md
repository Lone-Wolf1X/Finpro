# Finpro Backend

Fintech SaaS Application - Java Spring Boot Backend

## Tech Stack
- Java 21
- Spring Boot 3.2.2
- PostgreSQL 18
- Maven
- JWT Authentication
- Flyway Migration
- Swagger/OpenAPI

## Database Setup
PostgreSQL is running on port **5433** (not default 5432)
- Database: `fintech_saas`
- Username: `postgres`
- Password: `123`

## Running the Application

### Prerequisites
- Java 21
- Maven 3.6+
- PostgreSQL 18

### Build and Run
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Access Points
- API Base URL: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- Health Check: http://localhost:8080/api/health

## Project Structure
```
backend/
├── src/main/java/com/fintech/finpro/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST controllers
│   ├── entity/          # JPA entities
│   ├── repository/      # Data repositories
│   ├── service/         # Business logic
│   ├── dto/             # Data Transfer Objects
│   ├── security/        # Security & JWT
│   ├── tenant/          # Multi-tenancy support
│   └── FinproBackendApplication.java
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/    # Flyway migrations
└── pom.xml
```

## Development Notes
- Multi-tenant architecture with tenant isolation
- Role-based access control (ADMIN, MAKER, CHECKER, INVESTOR)
- JWT-based authentication
- Audit logging for all entities
