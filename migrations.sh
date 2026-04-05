#!/bin/bash

# FIXED: Changed WORKER_MODE to MEDUSA_WORKER_MODE to match Medusa v2 documentation
if [ "$MEDUSA_WORKER_MODE" != "worker" ]; then
  echo "Running migrations for MEDUSA_WORKER_MODE=$MEDUSA_WORKER_MODE"
  npm run predeploy
else
  echo "Skipping migrations because MEDUSA_WORKER_MODE=worker"
fi

exec "$@"
