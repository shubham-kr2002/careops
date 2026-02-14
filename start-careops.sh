#!/bin/bash
# CareOps Docker Startup Script for Linux/Mac
# Usage: ./start-careops.sh [up|down|build|logs|restart]

COMMAND=${1:-up}

echo "=========================================="
echo "CareOps - Docker Management Script"
echo "=========================================="

case "$COMMAND" in
    up)
        echo "Starting CareOps containers..."
        docker-compose up -d
        echo ""
        echo "Waiting for services to start..."
        sleep 10
        echo ""
        echo "=========================================="
        echo "CareOps is running!"
        echo "=========================================="
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:8000"
        echo "API Docs: http://localhost:8000/docs"
        echo ""
        echo "Login Credentials:"
        echo "  Owner: admin@careops.com / Admin@123"
        echo "  Staff: staff@careops.com / Staff@123"
        echo "=========================================="
        ;;
    down)
        echo "Stopping CareOps containers..."
        docker-compose down
        ;;
    build)
        echo "Building CareOps containers..."
        docker-compose build --no-cache
        ;;
    logs)
        echo "Showing CareOps logs..."
        docker-compose logs -f
        ;;
    restart)
        echo "Restarting CareOps containers..."
        docker-compose restart
        echo ""
        echo "CareOps restarted!"
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:8000"
        ;;
    clean)
        echo "Cleaning CareOps containers and volumes..."
        docker-compose down -v
        docker system prune -f
        echo "Clean complete!"
        ;;
    *)
        echo "Usage: ./start-careops.sh [up|down|build|logs|restart|clean]"
        echo ""
        echo "Commands:"
        echo "  up      - Start all services (default)"
        echo "  down    - Stop all services"
        echo "  build   - Rebuild all containers"
        echo "  logs    - View logs"
        echo "  restart - Restart services"
        echo "  clean   - Remove containers and volumes"
        ;;
esac
