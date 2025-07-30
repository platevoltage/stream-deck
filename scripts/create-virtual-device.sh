#!/bin/bash

DESC_PATH="$(dirname "$0")/virtual-kbd.desc"
SYMLINK="/dev/input/virtual-kbd"
LOGFILE="/tmp/virtual-kbd.log"

# Start the virtual device in the background
sudo evemu-device "$DESC_PATH" > "$LOGFILE" 2>&1 &
EVEMU_PID=$!

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    sudo kill "$EVEMU_PID" 2>/dev/null
    sudo rm -f "$SYMLINK"
    exit
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for the device to appear
sleep 1

# Find the newest event device
NEW_DEV=$(ls -tr /dev/input/event* | tail -1)

# Create or update symlink
sudo ln -sf "$NEW_DEV" "$SYMLINK"
echo "Virtual keyboard device symlinked at $SYMLINK -> $NEW_DEV"

# Keep script alive until killed
wait "$EVEMU_PID"
