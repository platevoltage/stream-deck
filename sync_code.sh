#!/bin/bash

# ---- CONFIG ----
REMOTE_USER="root"
REMOTE_HOST="sega.local"   # or IP (e.g. 192.168.1.50)
REMOTE_PATH="/userdata/system/controls/stream-deck"
LOCAL_PATH="$(pwd)/"

# Optional: exclude junk
EXCLUDES=(
  "--exclude=.git"
  "--exclude=node_modules"
  "--exclude=*.log"
  "--exclude=cache"
)

# ---- SYNC ----
rsync -avz --delete \
  "${EXCLUDES[@]}" \
  -e ssh \
  "$LOCAL_PATH" \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

echo "Sync complete."

ssh ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
export NVM_DIR="/userdata/system/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

export PATH="/userdata/system/.nvm/versions/node/v24.10.0/bin:$PATH"
export PM2_HOME="/userdata/system/.pm2"

pm2 restart 0
EOF

echo "Sync + restart complete."