# V3D Platform - Local Development Setup Script (PowerShell)
# Automatiza la inicialización completa del ambiente local en Windows
# 
# Uso: .\setup.ps1 [opción]
#   Sin argumentos: setup completo
#   -Quick: solo docker-compose
#   -Clean: elimina volúmenes y reinicia
#   -Help: muestra esta ayuda
#
# Nota: Ejecutar como Administrator

param(
    [ValidateSet("Full", "Quick", "Clean", "Help")]
    [string]$Mode = "Full"
)

# ============================================
# CONFIGURATION
# ============================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors
$Colors = @{
    Red    = [System.ConsoleColor]::Red
    Green  = [System.ConsoleColor]::Green
    Yellow = [System.ConsoleColor]::Yellow
    Cyan   = [System.ConsoleColor]::Cyan
    Blue   = [System.ConsoleColor]::Blue
}

# ============================================
# LOGGING FUNCTIONS
# ============================================

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  INFO: " -ForegroundColor $Colors.Blue -NoNewline
    Write-Host $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ SUCCESS: " -ForegroundColor $Colors.Green -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  WARNING: " -ForegroundColor $Colors.Yellow -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ ERROR: " -ForegroundColor $Colors.Red -NoNewline
    Write-Host $Message
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Cyan
    Write-Host $Title -ForegroundColor $Colors.Cyan
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Cyan
    Write-Host ""
}

# ============================================
# REQUIREMENT CHECKS
# ============================================

function Test-CommandExists {
    param([string]$Command, [string]$Name)
    
    try {
        $null = Get-Command $Command -ErrorAction Stop
        Write-Success "$Name found"
        return $true
    } catch {
        Write-Error "$Name is not installed or not in PATH"
        return $false
    }
}

function Check-Requirements {
    Write-Section "Checking Prerequisites"
    
    $allFound = $true
    
    if (-not (Test-CommandExists "node" "Node.js")) {
        Write-Error "Please install Node.js 18+ from https://nodejs.org"
        $allFound = $false
    }
    
    if (-not (Test-CommandExists "docker" "Docker")) {
        Write-Error "Please install Docker from https://www.docker.com"
        $allFound = $false
    }
    
    if (-not (Test-CommandExists "docker-compose" "Docker Compose")) {
        Write-Error "Please install Docker Compose"
        $allFound = $false
    }
    
    if (-not (Test-CommandExists "pnpm" "pnpm")) {
        Write-Warning "pnpm not found, installing via npm..."
        try {
            npm install -g pnpm
            Write-Success "pnpm installed"
        } catch {
            Write-Error "Failed to install pnpm"
            $allFound = $false
        }
    }
    
    if (-not $allFound) {
        Write-Error "Please install missing prerequisites before proceeding"
        exit 1
    }
    
    Write-Success "All prerequisites met!"
}

# ============================================
# ENVIRONMENT SETUP
# ============================================

function Setup-EnvFiles {
    Write-Section "Setting Up Environment Files"
    
    # API environment file
    $apiEnvPath = "apps/api/.env.local"
    if (-not (Test-Path $apiEnvPath)) {
        Write-Info "Creating $apiEnvPath..."
        
        $apiEnvContent = @"
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/v3ddb

# Redis
REDIS_URL=redis://:redis123@localhost:6379

# JWT
JWT_SECRET=dev-secret-key-change-in-production-12345678901234567890

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# AWS (local mock)
AWS_REGION=us-east-1
S3_BUCKET=v3d-media-dev
"@
        
        Set-Content -Path $apiEnvPath -Value $apiEnvContent -Encoding UTF8
        Write-Success "Created $apiEnvPath"
    } else {
        Write-Warning "$apiEnvPath already exists, skipping"
    }
    
    # Frontend environment file
    $webEnvPath = "apps/web/.env.local"
    if (-not (Test-Path $webEnvPath)) {
        Write-Info "Creating $webEnvPath..."
        
        $webEnvContent = @"
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
"@
        
        Set-Content -Path $webEnvPath -Value $webEnvContent -Encoding UTF8
        Write-Success "Created $webEnvPath"
    } else {
        Write-Warning "$webEnvPath already exists, skipping"
    }
}

# ============================================
# DEPENDENCIES INSTALLATION
# ============================================

function Install-Dependencies {
    Write-Section "Installing Dependencies"
    
    Write-Info "Installing monorepo dependencies..."
    try {
        pnpm install
        Write-Success "Dependencies installed"
    } catch {
        Write-Error "Failed to install dependencies: $_"
        exit 1
    }
    
    Write-Info "Generating Prisma Client..."
    try {
        Push-Location "packages/database"
        pnpm exec prisma generate
        Pop-Location
        Write-Success "Prisma Client generated"
    } catch {
        Write-Error "Failed to generate Prisma Client: $_"
        exit 1
    }
}

# ============================================
# DOCKER SETUP
# ============================================

function Start-DockerServices {
    Write-Section "Starting Docker Services"
    
    Write-Info "Building and starting containers..."
    try {
        docker-compose up -d
    } catch {
        Write-Error "Failed to start Docker services: $_"
        exit 1
    }
    
    Write-Info "Waiting for services to be healthy..."
    
    # Check PostgreSQL
    $pgReady = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            docker-compose exec -T postgres pg_isready -U postgres | Out-Null
            Write-Success "PostgreSQL is ready"
            $pgReady = $true
            break
        } catch {
            Write-Info "Waiting for PostgreSQL... ($i/30)"
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $pgReady) {
        Write-Error "PostgreSQL failed to start"
        docker-compose logs postgres
        exit 1
    }
    
    # Check Redis
    $redisReady = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            docker-compose exec -T redis redis-cli ping | Out-Null
            Write-Success "Redis is ready"
            $redisReady = $true
            break
        } catch {
            Write-Info "Waiting for Redis... ($i/30)"
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $redisReady) {
        Write-Error "Redis failed to start"
        docker-compose logs redis
        exit 1
    }
    
    Write-Success "All Docker services are healthy"
}

# ============================================
# DATABASE SETUP
# ============================================

function Setup-Database {
    Write-Section "Setting Up Database"
    
    Write-Info "Running Prisma migrations..."
    try {
        Push-Location "packages/database"
        
        $migrationPath = "prisma/migrations"
        if ((Test-Path $migrationPath) -and ((Get-ChildItem $migrationPath).Count -gt 0)) {
            Write-Info "Existing migrations found, running deploy..."
            pnpm exec prisma migrate deploy
        } else {
            Write-Info "No migrations found, creating initial migration..."
            pnpm exec prisma migrate dev --name init --skip-generate
        }
        
        Pop-Location
        Write-Success "Database migrations completed"
    } catch {
        Write-Error "Failed to run migrations: $_"
        exit 1
    }
}

# ============================================
# VERIFICATION
# ============================================

function Verify-Setup {
    Write-Section "Verifying Setup"
    
    # Check Docker services
    Write-Info "Checking Docker services..."
    docker-compose ps
    Write-Host ""
    
    # Check database connection
    Write-Info "Checking database connection..."
    try {
        docker-compose exec -T postgres psql -U postgres -d v3ddb -c "SELECT 1" | Out-Null
        Write-Success "Database connection verified"
    } catch {
        Write-Error "Database connection failed"
        exit 1
    }
    
    # Check Redis connection
    Write-Info "Checking Redis connection..."
    try {
        docker-compose exec -T redis redis-cli ping | Out-Null
        Write-Success "Redis connection verified"
    } catch {
        Write-Error "Redis connection failed"
        exit 1
    }
}

# ============================================
# PRINT SUMMARY
# ============================================

function Print-Summary {
    Write-Section "Setup Summary"
    
    Write-Host "✅ V3D Platform Local Development Environment Ready!`n" -ForegroundColor $Colors.Green
    
    Write-Host "📦 Services Running:" -ForegroundColor $Colors.Blue
    Write-Host "  Cyan PostgreSQL  → localhost:5432"
    Write-Host "  Cyan Redis       → localhost:6379"
    Write-Host "  Cyan pgAdmin     → http://localhost:5050"
    Write-Host "  Cyan Redis CMD   → http://localhost:8081"
    
    Write-Host "`n🚀 Next Steps:" -ForegroundColor $Colors.Blue
    Write-Host "  1. Start the API server:"
    Write-Host "     Cyan cd apps/api && pnpm run dev"
    Write-Host ""
    Write-Host "  2. In another terminal, start the frontend:"
    Write-Host "     Cyan cd apps/web && pnpm run dev"
    Write-Host ""
    Write-Host "  3. Open your browser:"
    Write-Host "     Cyan http://localhost:3001"
    
    Write-Host "`n📝 Useful Commands:" -ForegroundColor $Colors.Blue
    Write-Host "  View logs:           Cyan docker-compose logs -f [service]"
    Write-Host "  Stop services:       Cyan docker-compose down"
    Write-Host "  Reset database:      Cyan docker-compose down -v && .\setup.ps1"
    Write-Host "  Prisma Studio:       Cyan cd packages/database && pnpm exec prisma studio"
    Write-Host "  Run migrations:      Cyan cd packages/database && pnpm exec prisma migrate dev"
    
    Write-Host "`n🔗 Access Points:" -ForegroundColor $Colors.Blue
    Write-Host "  pgAdmin:             Cyan http://localhost:5050 (admin@v3d.local / admin)"
    Write-Host "  Redis Commander:     Cyan http://localhost:8081"
    Write-Host "  API (local):         Cyan http://localhost:3000"
    Write-Host "  Frontend (local):    Cyan http://localhost:3001"
    
    Write-Host "`n📚 Documentation:" -ForegroundColor $Colors.Blue
    Write-Host "  See DEVELOPMENT_ROADMAP.md for next phases"
    Write-Host "  See DEPLOYMENT_GUIDE.md for production setup"
    
    Write-Host "`nHappy coding! 🚀`n" -ForegroundColor $Colors.Green
}

# ============================================
# CLEANUP FUNCTION
# ============================================

function Cleanup-Setup {
    Write-Section "Cleanup - Removing All Data"
    
    Write-Warning "This will remove all Docker volumes and data!"
    $response = Read-Host "Are you sure? (yes/no)"
    
    if ($response -eq "yes") {
        Write-Info "Stopping containers and removing volumes..."
        docker-compose down -v
        Write-Success "Containers and volumes removed"
        
        Write-Info "Running full setup..."
        Full-Setup
    } else {
        Write-Info "Cleanup cancelled"
    }
}

# ============================================
# QUICK SETUP
# ============================================

function Quick-Setup {
    Write-Section "Quick Setup - Docker Only"
    
    Write-Info "Assuming dependencies are already installed..."
    Start-DockerServices
    Verify-Setup
    
    Write-Host "`n✅ Docker services are running!" -ForegroundColor $Colors.Green
    Write-Host "Run the following in separate terminals:"
    Write-Host "  cd apps/api && pnpm run dev" -ForegroundColor $Colors.Cyan
    Write-Host "  cd apps/web && pnpm run dev" -ForegroundColor $Colors.Cyan
    Write-Host ""
}

# ============================================
# FULL SETUP
# ============================================

function Full-Setup {
    Check-Requirements
    Setup-EnvFiles
    Install-Dependencies
    Start-DockerServices
    Setup-Database
    Verify-Setup
    Print-Summary
}

# ============================================
# HELP
# ============================================

function Show-Help {
    Write-Host "V3D Platform - Local Development Setup" -ForegroundColor $Colors.Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor $Colors.Blue
    Write-Host "  .\setup.ps1 [Mode]"
    Write-Host ""
    Write-Host "Modes:" -ForegroundColor $Colors.Blue
    Write-Host "  (no args)    Full setup: prerequisites, dependencies, Docker, database"
    Write-Host "  -Quick       Quick setup: only Docker services (assumes deps installed)"
    Write-Host "  -Clean       Full cleanup and reset (removes all volumes and data)"
    Write-Host "  -Help        Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.Blue
    Write-Host "  .\setup.ps1              # Complete setup from scratch"
    Write-Host "  .\setup.ps1 -Quick       # Just start Docker services"
    Write-Host "  .\setup.ps1 -Clean       # Remove everything and start fresh"
    Write-Host ""
    Write-Host "Requirements:" -ForegroundColor $Colors.Blue
    Write-Host "  - Node.js 18+"
    Write-Host "  - Docker"
    Write-Host "  - Docker Compose"
    Write-Host "  - pnpm (will be installed if missing)"
    Write-Host ""
    Write-Host "For more information:" -ForegroundColor $Colors.Blue
    Write-Host "  See DEPLOYMENT_GUIDE.md or DEVELOPMENT_ROADMAP.md"
    Write-Host ""
}

# ============================================
# MAIN SCRIPT
# ============================================

switch ($Mode.ToLower()) {
    "help" {
        Show-Help
    }
    "quick" {
        Quick-Setup
    }
    "clean" {
        Cleanup-Setup
    }
    "full" {
        Full-Setup
    }
    default {
        Write-Error "Unknown mode: $Mode"
        Show-Help
        exit 1
    }
}
