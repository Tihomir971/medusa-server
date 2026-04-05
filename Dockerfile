FROM node:24 AS builder

WORKDIR /app/medusa

COPY . .

RUN rm -rf node_modules

RUN apt-get update && apt-get install -y python3 python3-pip python-is-python3

# Add verbose logging and timeout protection
# Use ci for faster, deterministic installs
RUN npm ci --verbose --no-audit --no-fund || npm install --verbose --no-audit --no-fund --prefer-offline

RUN echo "Build starting..." && npm run build && echo "Build completed!"


FROM node:24

RUN echo "${PORT}"

WORKDIR /app/medusa

RUN mkdir .medusa

RUN apt-get update && apt-get install -y python3 python3-pip python-is-python3

COPY --from=builder /app/medusa/.medusa ./.medusa
COPY --from=builder /app/medusa/node_modules /app/medusa/.medusa/server/node_modules

WORKDIR /app/medusa/.medusa/server

# Create startup script that runs migrations then starts the server
RUN echo '#!/bin/sh\nif [ "$MEDUSA_WORKER_MODE" != "worker" ]; then\n  echo "Running migrations..."\n  npm run predeploy\nfi\nexec npm run start' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
