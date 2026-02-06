# Finpro - Quick Start Guide

**© 2026 Next Gen Innovations Nepal**

## 🚀 Starting the Application

### Method 1: Using npm (Recommended)
```powershell
cd G:\Earnmore\Finpro
npm start
```

### Method 2: Using PowerShell Script
```powershell
cd G:\Earnmore\Finpro
.\start.ps1
```

## 🛑 Stopping the Application

```powershell
# Stop all servers
npm stop

# OR
.\stop.ps1
```

## 🔧 Additional Commands

```powershell
# Clean ports only (without starting servers)
npm run clean:ports

# Start backend only
npm run start:backend

# Start frontend only
npm run start:frontend

# Install all dependencies
npm run install:all
```

## 📝 What Happens When You Start

1. **Cleanup Phase**
   - Kills all Java processes (old backend)
   - Kills all Node processes (old frontend)
   - Clears port 8080 (backend)
   - Clears port 5173 (frontend)

2. **Startup Phase**
   - Opens Backend in new window (Spring Boot on port 8080)
   - Opens Frontend in new window (Vite on port 5173)

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html

## 👤 Default SUPERADMIN Login

- **User ID**: 100
- **Email**: nextgeninnovationsprivatelimit@gmail.com
- **Password**: 100

## ⚠️ Troubleshooting

### Port Already in Use
If you get "port already in use" error:
```powershell
npm run clean:ports
```

### Processes Not Stopping
Manually kill processes:
```powershell
# Kill all Java processes
Get-Process -Name "java" | Stop-Process -Force

# Kill all Node processes
Get-Process -Name "node" | Stop-Process -Force
```

---

**Need detailed setup instructions?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
