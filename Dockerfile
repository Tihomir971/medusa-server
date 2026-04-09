FROM node:24 AS builder

WORKDIR /app/medusa

COPY . .

RUN rm -rf node_modules

RUN apt-get update && apt-get install -y python3 python3-pip python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm ci --no-audit --no-fund

RUN npm run build


FROM node:24-slim

WORKDIR /app/medusa

RUN mkdir .medusa

COPY --from=builder /app/medusa/.medusa ./.medusa
COPY --from=builder /app/medusa/node_modules /app/medusa/.medusa/server/node_modules

WORKDIR /app/medusa/.medusa/server

RUN echo '#!/bin/sh\nif [ "$MEDUSA_WORKER_MODE" != "worker" ]; then\n  echo "Running migrations..."\n  npm run predeploy\nfi\nexec npm run start' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
