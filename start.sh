#!/bin/bash

# Màu sắc cho output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Lưu thư mục gốc
ROOT_DIR=$(pwd)

# Hiển thị banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║     Robot Control System Launcher     ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Kiểm tra và cài đặt dependencies nếu cần
echo -e "${GREEN}Checking dependencies...${NC}"



# Kiểm tra client dependencies
echo "Checking client dependencies..."
cd "$ROOT_DIR/client"
if [ ! -d "node_modules" ]; then
    echo "Installing client dependencies..."
    npm install
fi
# Kiểm tra server dependencies
echo "Checking server dependencies..."
cd "$ROOT_DIR/server"
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi
# Khởi động server và client
echo -e "${GREEN}Starting Server and Client...${NC}"

# Khởi động client trong background
cd "$ROOT_DIR/client"
npm run dev &
CLIENT_PID=$!

# Khởi động server trong background
cd "$ROOT_DIR/server"
npm run dev &
SERVER_PID=$!



# Hàm cleanup khi script bị dừng
cleanup() {
    echo -e "\n${GREEN}Shutting down servers...${NC}"
    kill $SERVER_PID
    kill $CLIENT_PID
    exit 0
}

# Bắt signal để cleanup
trap cleanup SIGINT SIGTERM

# Hiển thị thông tin
echo -e "${GREEN}"
echo "Server running on: http://localhost:3000"
echo "Client running on: http://localhost:8080"
echo -e "${NC}"
echo "Press Ctrl+C to stop all servers"

# Giữ script chạy
wait 