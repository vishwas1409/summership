FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends mariadb-server \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN chmod +x scripts/start.sh

ENV NODE_ENV=production
ENV DB_HOST=127.0.0.1
ENV DB_PORT=3306
ENV DB_USER=admin
ENV DB_PASSWORD=admin123
ENV DB_NAME=hackathon_selection

EXPOSE 3000

CMD ["scripts/start.sh"]
