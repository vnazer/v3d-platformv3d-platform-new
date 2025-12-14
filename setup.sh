#!/bin/bash

################################################################################
# V3D Platform - Local Development Setup Script
# Automatiza la inicialización completa del ambiente local
# 
# Uso: ./setup.sh [opción]
#   Sin argumentos: setup completo
#   --quick: solo docker-compose
#   --clean: elimina volúmenes y reinicia
#   --help: muestra esta ayuda
################################################################################

set -e  # Exit on any error

# ============================================
# COLOR DEFINITIONS
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# LOGGING FUNCTIONS
# ============================================

log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

log_section() {
    echo -e "\n${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${1}${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}\n"
}

# ============================================
# REQUIREMENT CHECKS
# ============================================

check_requirement() {
    local cmd=$1
    local name=$2
    
    if ! command -v "$cmd" &> /dev/null; then
        log_error "$name is not installed or not in PATH"
        return 1
    fi
    log_success "$name found: $(command -v $cmd)"
    return 0
}

check_requirements() {
    log_section "Checking Prerequisites"
    
    local failed=0
    
    if ! check_requirement "node" "Node.js"; then
        log_error "Please install Node.js 18+ from https://nodejs.org"
        failed=1
    fi
    
    if ! check_requirement "docker" "Docker"; then
        log_error "Please install Docker from https://www.docker.com"
        failed=1
    fi
    
    if ! check_requirement "docker-compose" "Docker Compose"; then
        log_error "Please install Docker Compose"
        failed=1
    fi
    
    if ! check_requirement "pnpm" "pnpm"; then
        log_warning "pnpm not found, will install via npm"
        log_info "Installing pnpm globally..."
        npm install -g pnpm
        if ! check_requirement "pnpm" "pnpm"; then
            log_error "Failed to install pnpm"
            failed=1
        fi
    fi
    
    if [ $failed -eq 1 ]; then
        log_error "Please install missing prerequisites before proceeding"
        exit 1
    fi
    
    log_success "All prerequisites met!"
}

# ============================================
# ENVIRONMENT SETUP
# ============================================

setup_env_files() {
    log_section "Setting Up Environment Files"
    
    # API environment file
    if [ ! -f "apps/api/.env.local" ]; then
        log_info "Creating apps/api/.env.local..."
        cat > "apps/api/.env.local" <<'EOF'
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
EOF
        log_success "Created apps/api/.env.local"
    else
        log_warning "apps/api/.env.local already exists, skipping"
    fi
    
    # Frontend environment file
    if [ ! -f "apps/web/.env.local" ]; then
        log_info "Creating apps/web/.env.local..."
        cat > "apps/web/.env.local" <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
EOF
        log_success "Created apps/web/.env.local"
    else
        log_warning "apps/web/.env.local already exists, skipping"
    fi
}

# ============================================
# DEPENDENCIES INSTALLATION
# ============================================

install_dependencies() {
    log_section "Installing Dependencies"
    
    log_info "Installing monorepo dependencies..."
    pnpm install
    log_success "Dependencies installed"
    
    log_info "Generating Prisma Client..."
    cd packages/database
    pnpm exec prisma generate
    cd - > /dev/null
    log_success "Prisma Client generated"
}

# ============================================
# DOCKER SETUP
# ============================================

start_docker_services() {
    log_section "Starting Docker Services"
    
    log_info "Building and starting containers..."
    docker-compose up -d
    
    log_info "Waiting for services to be healthy..."
    
    # Check PostgreSQL
    local pg_ready=0
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
            log_success "PostgreSQL is ready"
            pg_ready=1
            break
        fi
        log_info "Waiting for PostgreSQL... ($i/30)"
        sleep 2
    done
    
    if [ $pg_ready -eq 0 ]; then
        log_error "PostgreSQL failed to start"
        docker-compose logs postgres
        exit 1
    fi
    
    # Check Redis
    local redis_ready=0
    for i in {1..30}; do
        if docker-compose exec -T redis redis-cli ping &> /dev/null; then
            log_success "Redis is ready"
            redis_ready=1
            break
        fi
        log_info "Waiting for Redis... ($i/30)"
        sleep 2
    done
    
    if [ $redis_ready -eq 0 ]; then
        log_error "Redis failed to start"
        docker-compose logs redis
        exit 1
    fi
    
    log_success "All Docker services are healthy"
}

# ============================================
# DATABASE SETUP
# ============================================

setup_database() {
    log_section "Setting Up Database"
    
    log_info "Running Prisma migrations..."
    cd packages/database
    
    # Check if migrations already exist
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
        log_info "Existing migrations found, running deploy..."
        pnpm exec prisma migrate deploy
    else
        log_info "No migrations found, creating initial migration..."
        pnpm exec prisma migrate dev --name init --skip-generate
    fi
    
    cd - > /dev/null
    log_success "Database migrations completed"
}

# ============================================
# VERIFICATION
# ============================================

verify_setup() {
    log_section "Verifying Setup"
    
    # Check Docker services
    log_info "Checking Docker services..."
    docker-compose ps
    
    # Check API health
    log_info "Checking API health endpoint..."
    if timeout 10 bash -c 'until curl -s http://localhost:3000/health > /dev/null; do sleep 1; done'; then
        log_success "API health check passed"
    else
        log_warning "API not responding yet (will be ready after starting server)"
    fi
    
    # Check database connection
    log_info "Checking database connection..."
    if docker-compose exec -T postgres psql -U postgres -d v3ddb -c "SELECT 1" &> /dev/null; then
        log_success "Database connection verified"
    else
        log_error "Database connection failed"
        exit 1
    fi
    
    # Check Redis connection
    log_info "Checking Redis connection..."
    if docker-compose exec -T redis redis-cli ping &> /dev/null; then
        log_success "Redis connection verified"
    else
        log_error "Redis connection failed"
        exit 1
    fi
}

# ============================================
# PRINT SUMMARY
# ============================================

print_summary() {
    log_section "Setup Summary"
    
    echo -e "${GREEN}✅ V3D Platform Local Development Environment Ready!${NC}\n"
    
    echo -e "${BLUE}📦 Services Running:${NC}"
    echo -e "  ${CYAN}PostgreSQL${NC}  → localhost:5432"
    echo -e "  ${CYAN}Redis${NC}       → localhost:6379"
    echo -e "  ${CYAN}pgAdmin${NC}     → http://localhost:5050"
    echo -e "  ${CYAN}Redis CMD${NC}   → http://localhost:8081"
    
    echo -e "\n${BLUE}🚀 Next Steps:${NC}"
    echo -e "  1. Start the API server:"
    echo -e "     ${CYAN}cd apps/api && pnpm run dev${NC}"
    echo -e ""
    echo -e "  2. In another terminal, start the frontend:"
    echo -e "     ${CYAN}cd apps/web && pnpm run dev${NC}"
    echo -e ""
    echo -e "  3. Open your browser:"
    echo -e "     ${CYAN}http://localhost:3001${NC}"
    
    echo -e "\n${BLUE}📝 Useful Commands:${NC}"
    echo -e "  View logs:           ${CYAN}docker-compose logs -f [service]${NC}"
    echo -e "  Stop services:       ${CYAN}docker-compose down${NC}"
    echo -e "  Reset database:      ${CYAN}docker-compose down -v && ./setup.sh${NC}"
    echo -e "  Prisma Studio:       ${CYAN}cd packages/database && pnpm exec prisma studio${NC}"
    echo -e "  Run migrations:      ${CYAN}cd packages/database && pnpm exec prisma migrate dev${NC}"
    
    echo -e "\n${BLUE}🔗 Access Points:${NC}"
    echo -e "  pgAdmin:             ${CYAN}http://localhost:5050${NC} (admin@v3d.local / admin)"
    echo -e "  Redis Commander:     ${CYAN}http://localhost:8081${NC}"
    echo -e "  API (local):         ${CYAN}http://localhost:3000${NC}"
    echo -e "  Frontend (local):    ${CYAN}http://localhost:3001${NC}"
    
    echo -e "\n${BLUE}📚 Documentation:${NC}"
    echo -e "  See ${CYAN}DEVELOPMENT_ROADMAP.md${NC} for next phases"
    echo -e "  See ${CYAN}DEPLOYMENT_GUIDE.md${NC} for production setup"
    
    echo -e "\n${GREEN}Happy coding! 🚀${NC}\n"
}

# ============================================
# CLEANUP FUNCTION
# ============================================

cleanup_setup() {
    log_section "Cleanup - Removing All Data"
    
    log_warning "This will remove all Docker volumes and data!"
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Cleanup cancelled"
        return
    fi
    
    log_info "Stopping containers..."
    docker-compose down -v
    log_success "Containers and volumes removed"
    
    log_info "Running full setup..."
    full_setup
}

# ============================================
# QUICK SETUP
# ============================================

quick_setup() {
    log_section "Quick Setup - Docker Only"
    
    log_info "Assuming dependencies are already installed..."
    start_docker_services
    verify_setup
    
    echo -e "\n${GREEN}✅ Docker services are running!${NC}"
    echo -e "Run the following in separate terminals:"
    echo -e "  ${CYAN}cd apps/api && pnpm run dev${NC}"
    echo -e "  ${CYAN}cd apps/web && pnpm run dev${NC}\n"
}

# ============================================
# FULL SETUP
# ============================================

full_setup() {
    check_requirements
    setup_env_files
    install_dependencies
    start_docker_services
    setup_database
    verify_setup
    print_summary
}

# ============================================
# HELP
# ============================================

show_help() {
    cat <<EOF
${CYAN}V3D Platform - Local Development Setup${NC}

${BLUE}Usage:${NC}
  ./setup.sh [OPTION]

${BLUE}Options:${NC}
  (no args)    Full setup: prerequisites, dependencies, Docker, database
  --quick      Quick setup: only Docker services (assumes deps installed)
  --clean      Full cleanup and reset (removes all volumes and data)
  --help       Show this help message

${BLUE}Examples:${NC}
  ./setup.sh              # Complete setup from scratch
  ./setup.sh --quick      # Just start Docker services
  ./setup.sh --clean      # Remove everything and start fresh

${BLUE}Requirements:${NC}
  - Node.js 18+
  - Docker
  - Docker Compose
  - pnpm (will be installed if missing)

${BLUE}For more information:${NC}
  See DEPLOYMENT_GUIDE.md or DEVELOPMENT_ROADMAP.md

EOF
}

# ============================================
# MAIN SCRIPT
# ============================================

main() {
    case "${1:-}" in
        --help)
            show_help
            ;;
        --quick)
            quick_setup
            ;;
        --clean)
            cleanup_setup
            ;;
        "")
            full_setup
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
