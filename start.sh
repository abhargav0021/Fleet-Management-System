#!/usr/bin/env bash
set -euo pipefail

echo "Building and starting Fleet Management System..."
docker-compose up --build -d

wait_healthy() {
  local name="$1"
  local url="$2"
  printf "  Waiting for %-25s" "$name..."
  until curl -sf "$url" > /dev/null 2>&1; do
    printf "."
    sleep 3
  done
  printf " ready\n"
}

echo ""
echo "Waiting for services to become healthy..."
wait_healthy "service-registry"     "http://localhost:8761/actuator/health"
wait_healthy "vehicle-microservice" "http://localhost:8080/actuator/health"
wait_healthy "driver-microservice"  "http://localhost:8081/actuator/health"
wait_healthy "usage-microservice"   "http://localhost:8082/actuator/health"
wait_healthy "api-gateway"          "http://localhost:8090/actuator/health"

RABBIT_USER="${RABBITMQ_USER:-guest}"
RABBIT_PASS="${RABBITMQ_PASS:-guest}"

echo ""
echo "============================================="
echo "  Fleet Management System is up and running!"
echo "============================================="
echo ""
echo "  Frontend          →  http://localhost"
echo "  API Gateway       →  http://localhost:8090"
echo "  Vehicle Service   →  http://localhost:8080"
echo "  Driver Service    →  http://localhost:8081"
echo "  Usage Service     →  http://localhost:8082"
echo "  Service Registry  →  http://localhost:8761"
echo "  RabbitMQ Console  →  http://localhost:15672  (${RABBIT_USER} / ${RABBIT_PASS})"
echo ""
echo "Run 'docker-compose logs -f <service>' to tail logs."
echo "Run 'docker-compose down -v' to stop and remove all data."
echo ""
