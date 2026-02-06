# Finpro - Setup Guide

## Prerequisites Installation

### 1. Install Java 21

**Download:**
- Go to: https://www.oracle.com/java/technologies/downloads/#java21
- Download "Windows x64 Installer" for Java 21

**Installation Steps:**
1. Run the downloaded `.exe` file
2. Follow the installation wizard
3. Note the installation path (usually `C:\Program Files\Java\jdk-21`)

**Set JAVA_HOME Environment Variable:**
1. Open "Environment Variables":
   - Press `Win + X` → System → Advanced system settings → Environment Variables
2. Under "System variables", click "New"
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-21` (your actual path)
3. Edit the `Path` variable:
   - Add: `%JAVA_HOME%\bin`
4. Click OK to save

**Verify Installation:**
```powershell
java -version
# Should show: java version "21.x.x"
```

---

### 2. Install Apache Maven

**Download:**
- Go to: https://maven.apache.org/download.cgi
- Download "Binary zip archive" (e.g., `apache-maven-3.9.6-bin.zip`)

**Installation Steps:**
1. Extract the ZIP file to `C:\Program Files\Apache\maven`
2. The final path should be: `C:\Program Files\Apache\maven\bin`

**Set MAVEN_HOME Environment Variable:**
1. Open "Environment Variables" (same as above)
2. Under "System variables", click "New"
   - Variable name: `MAVEN_HOME`
   - Variable value: `C:\Program Files\Apache\maven`
3. Edit the `Path` variable:
   - Add: `%MAVEN_HOME%\bin`
4. Click OK to save

**Verify Installation:**
```powershell
mvn -version
# Should show: Apache Maven 3.9.x
```

---

### 3. PostgreSQL (Already Installed ✅)

PostgreSQL 18 is already installed and running on port **5433**.

**Connection Details:**
- Host: `localhost`
- Port: `5433`
- Database: `fintech_saas`
- Username: `postgres`
- Password: `123`

---

## After Installation

### Restart PowerShell/Terminal
After setting environment variables, **close and reopen** your PowerShell/Terminal for changes to take effect.

### Verify All Tools
```powershell
# Check Java
java -version

# Check Maven
mvn -version

# Check PostgreSQL
$env:PGPASSWORD='123'; & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -p 5433 -c "SELECT version();"
```

---

## Build and Run Backend

Once Java 21 and Maven are installed:

```powershell
# Navigate to backend directory
cd G:\Earnmore\Finpro\backend

# Clean and compile
mvn clean compile

# Run the application
mvn spring-boot:run
```

The backend will start on: **http://localhost:8080/api**

---

## Quick Commands

### Build Project
```powershell
mvn clean install
```

### Run Application
```powershell
mvn spring-boot:run
```

### Run Tests
```powershell
mvn test
```

### Package as JAR
```powershell
mvn package
java -jar target/finpro-backend-1.0.0.jar
```

---

## Troubleshooting

### "java is not recognized"
- Ensure `JAVA_HOME` is set correctly
- Ensure `%JAVA_HOME%\bin` is in PATH
- Restart terminal

### "mvn is not recognized"
- Ensure `MAVEN_HOME` is set correctly
- Ensure `%MAVEN_HOME%\bin` is in PATH
- Restart terminal

### PostgreSQL Connection Failed
- Check if PostgreSQL service is running:
  ```powershell
  Get-Service -Name postgresql*
  ```
- Verify port 5433 (not 5432)
- Check password is `123`

---

## Next Steps

After successful setup:
1. ✅ Java 21 installed and verified
2. ✅ Maven installed and verified
3. ✅ PostgreSQL running
4. 🚀 Build and run backend: `mvn spring-boot:run`
5. 📚 Access Swagger UI: http://localhost:8080/api/swagger-ui.html
6. ❤️ Check health: http://localhost:8080/api/health
