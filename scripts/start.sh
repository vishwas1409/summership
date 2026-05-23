#!/bin/bash
set -euo pipefail

export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-3306}"
export DB_USER="${DB_USER:-admin}"
export DB_PASSWORD="${DB_PASSWORD:-admin123}"
export DB_NAME="${DB_NAME:-hackathon_selection}"
export NODE_ENV="${NODE_ENV:-production}"

mkdir -p /var/run/mysqld
chown -R mysql:mysql /var/run/mysqld /var/lib/mysql 2>/dev/null || true

# IMPORTANT: Remove old database to force fresh initialization
rm -rf /var/lib/mysql/*

echo "Initializing fresh MariaDB..."
mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null

echo "Starting embedded MariaDB..."
mariadbd --user=mysql --bind-address=127.0.0.1 --datadir=/var/lib/mysql &
MYSQL_PID=$!

for attempt in $(seq 1 60); do
  if mariadb-admin ping -h 127.0.0.1 --silent 2>/dev/null; then
    echo "MariaDB ready after ${attempt} second(s)."
    break
  fi
  if [ "$attempt" -eq 60 ]; then
    echo "MariaDB failed to start."
    kill "$MYSQL_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

# Create custom admin user with password (using socket connection)
mariadb -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mariadb -e "GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'localhost' WITH GRANT OPTION;"
mariadb -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;"
mariadb -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
mariadb -e "FLUSH PRIVILEGES;"

echo "MariaDB initialized with user: ${DB_USER}"
echo "Starting Node app on port ${PORT:-3000}..."
exec node server.js
