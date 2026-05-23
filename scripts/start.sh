#!/bin/bash
set -euo pipefail

export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-3306}"
export DB_USER="${DB_USER:-root}"
export DB_PASSWORD="${DB_PASSWORD:-rootpassword}"
export DB_NAME="${DB_NAME:-hackathon_selection}"
export NODE_ENV="${NODE_ENV:-production}"

mkdir -p /var/run/mysqld
chown -R mysql:mysql /var/run/mysqld /var/lib/mysql 2>/dev/null || true

if [ ! -d "/var/lib/mysql/mysql" ]; then
  echo "Initializing embedded MariaDB..."
  mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null
fi

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

# Use socket connection (no password needed) to set the password
mariadb -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mariadb -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;"

echo "Starting Node app on port ${PORT:-3000}..."
exec node server.js
