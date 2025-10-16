# ROS Web Interface

A web-based interface for ROS (Robot Operating System) built with React.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- ROS (Robot Operating System)

## Project Structure

```
ros_web_ws/
├── client/           # React frontend
├── server/           # Node.js backend
├── public/           # Static files
└── start.sh         # Startup script
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ros_web_ws
```

2. Install dependencies for root project:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
```

4. Install server dependencies:
```bash
cd ../server
npm install
```

## Development

1. Start the development server:
```bash
# In the root directory
npm run dev
```

2. Start the backend server:
```bash
cd server
npm start
```

## Production Build

1. Build the client:
```bash
cd client
npm run build
```

2. The built files will be in the `client/build` directory

## Configuration

- Client configuration: `client/src/config/serverConfig.js`
- Server configuration: `server/config/`
- ROS configuration: `server/config/robotCommands.js`

## Features

- Real-time robot monitoring
- Mission planning and execution
- Interactive map visualization
- Drag and drop mission builder
- Loop and conditional actions
- Move and Wait commands

## Notes

- Make sure ROS is running before starting the application
- Configure the ROS WebSocket connection in the server configuration
- Default port for development server is 3000
- Default port for backend server is 5000 