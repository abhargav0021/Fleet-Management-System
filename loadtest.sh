#!/usr/bin/env bash
set -euo pipefail

URL="${USAGE_URL:-http://localhost:8082/locations}"
COUNT="${COUNT:-100}"

for i in $(seq 1 "$COUNT"); do
  vehicle_id=$(( (i % 10) + 1 ))
  driver_id=$(( (i % 25) + 1 ))
  latitude=$(awk -v i="$i" 'BEGIN { printf "%.6f", 41.800000 + (i / 10000) }')
  longitude=$(awk -v i="$i" 'BEGIN { printf "%.6f", -87.600000 - (i / 10000) }')
  speed=$(( 25 + (i % 45) ))
  heading=$(( (i * 7) % 360 ))

  curl -sS -o /dev/null -w "request ${i}: %{http_code}\n" \
    -H "Content-Type: application/json" \
    -X POST "$URL" \
    -d "{
      \"vehicleId\": ${vehicle_id},
      \"driverId\": ${driver_id},
      \"latitude\": ${latitude},
      \"longitude\": ${longitude},
      \"speed\": ${speed},
      \"heading\": ${heading}
    }" &
done

wait
echo "Sent ${COUNT} location updates to ${URL}"
