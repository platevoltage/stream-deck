#!/bin/bash

set -e

cleanup() {
    echo "Cleaning up..."
    if [ -n "$EVEMU_PID" ] && ps -p $EVEMU_PID > /dev/null 2>&1; then
        sudo kill $EVEMU_PID
        echo "Killed evemu-device (PID $EVEMU_PID)"
    fi
    sudo rm -f /dev/input/virtual-kbd
    echo "Removed symlink /dev/input/virtual-kbd"
    exit
}

# Catch Ctrl+C
trap cleanup INT

# Start evemu-device in background
sudo evemu-device virtual-kbd.desc &
EVEMU_PID=$!

# Wait for device to show up
sleep 1

# Get latest event device
NEW_DEV=$(ls -tr /dev/input/event* | tail -1)

# Symlink it
sudo ln -sf "$NEW_DEV" /dev/input/virtual-kbd
echo "Virtual keyboard device symlinked at /dev/input/virtual-kbd -> $NEW_DEV"
echo "Press Ctrl+C to stop and clean up"

# Wait forever until Ctrl+C
while true; do
    sleep 1
done
