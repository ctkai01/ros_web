#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR=$(pwd)

echo -e "$BLUE"
echo "╔═══════════════════════════════════════╗"
echo "║   Robot Control System - Production   ║"
echo "╚═══════════════════════════════════════╝"
echo -e "$NC"

echo -e "${GREEN}Building client...${NC}"
cd "$ROOT_DIR/client" || exit 1
if [ ! -d "node_modules" ]; then
  echo "Installing client dependencies..."
  npm install || exit 1
fi

echo -e "${GREEN}Preparing server...${NC}"
cd "$ROOT_DIR/server" || exit 1
if [ ! -d "node_modules" ]; then
  echo "Installing server dependencies..."
  npm install || exit 1
fi

# Start static web server for built client (port 8080)
echo -e "${GREEN}Starting static web server (client/dist) on :8080...${NC}"
cd "$ROOT_DIR/client" || exit 1

STATIC_PID=""
if  command -v serve &> /dev/null; then
#use Python simple HTTP server
  (cd dist && python -m http.server 8080) &
  STATIC_PID=$!
else
  npx serve -s dist -l 8080 &
  STATIC_PID=$!
fi

# Start API server (port 3000)
echo -e "${GREEN}Starting API server on :3000...${NC}"
cd "$ROOT_DIR/server" || exit 1
NODE_ENV=production npm run start &
SERVER_PID=$!

cleanup() {
  echo -e "\n${GREEN}Shutting down (prod)...${NC}"
  if [ -n "$SERVER_PID" ]; then kill $SERVER_PID 2>/dev/null; fi
  if [ -n "$STATIC_PID" ]; then kill $STATIC_PID 2>/dev/null; fi
  exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${GREEN}"
echo "Client (static) on: http://localhost:8080"
echo "API server on:      http://localhost:3000"
echo -e "${NC}Press Ctrl+C to stop"

wait


