const ROSLIB = require('roslib');
// Giả sử bạn có một file config tại: /config/serverConfig.js
const serverConfig = require('../config/serverConfig');
class ROSConnection {
    constructor() {
        this.ros = null;
        this.connected = false;
        this.reconnectTimer = null; // Chỉ sử dụng một timer duy nhất để quản lý
        this.RETRY_INTERVAL = 5000; // Thử lại sau mỗi 5 giây
        this.onConnectCallbacks = [];
        this.onCloseCallbacks = []; // <-- THÊM MỚI: Mảng chứa các hàm callback khi ngắt kết nối

    }

    /**
    * Đăng ký một hàm callback để được gọi mỗi khi kết nối ROS thành công.
    * @param {function} callback - Hàm sẽ được gọi với đối tượng 'ros' làm tham số.
    */
    onConnect(callback) {
        // Đảm bảo không thêm cùng một callback nhiều lần
        if (!this.onConnectCallbacks.includes(callback)) {
            this.onConnectCallbacks.push(callback);
        }
    }


    /**
     * THÊM MỚI: Đăng ký một hàm callback để được gọi khi kết nối ROS bị đóng.
     * @param {function} callback - Hàm sẽ được gọi khi ngắt kết nối.
     */
    onClose(callback) {
        if (typeof callback === 'function' && !this.onCloseCallbacks.includes(callback)) {
            this.onCloseCallbacks.push(callback);
        }
    }


    /**
     * Khởi tạo và quản lý kết nối tới ROS Bridge.
     */
    initConnection() {
        // Ngăn chặn các lần gọi initConnection chồng chéo nếu một tiến trình kết nối lại đang được hẹn giờ
        if (this.reconnectTimer) {
            return;
        }

        console.log(`Attempting to connect to ROS at ${serverConfig.ROSBRIDGE_URL}...`);

        this.ros = new ROSLIB.Ros({
            url: serverConfig.ROSBRIDGE_URL,
            encoding: 'ascii'
        });

        // --- Event Handlers ---

        this.ros.on('connection', () => {
            console.log('✅ Successfully connected to ROS bridge.');
            this.connected = true;

            // Nếu chúng ta đang trong một vòng lặp kết nối lại, hãy dừng nó lại.
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }

            // Gọi tất cả các callback đã đăng ký
            this.onConnectCallbacks.forEach(callback => {
                try {
                    callback(this.ros);
                } catch (error) {
                    console.error('Error in onConnect callback:', error);
                }
            });
        });

        this.ros.on('error', (error) => {
            // Chỉ cần log lỗi. Sự kiện 'close' sẽ xử lý việc kết nối lại.
            console.error('ROS connection error:', error.message || 'Unknown error');
        });

        this.ros.on('close', () => {
            // Sự kiện này là nguồn chân lý duy nhất để kích hoạt việc kết nối lại.
            if (this.connected) {
                console.log('Connection to ROS closed.');
            }
            this.connected = false;
            // THÊM MỚI: Gọi tất cả các hàm callback khi ngắt kết nối
            console.log('Executing disconnection callbacks...');
            this.onCloseCallbacks.forEach(callback => callback());

            if (this.ros) {
                this.ros.removeAllListeners();
            }
            this.ros = null;

            // Nếu chưa có tiến trình kết nối lại nào được lên lịch, hãy tạo một cái mới.
            if (!this.reconnectTimer) {
                console.log(`Will attempt to reconnect in ${this.RETRY_INTERVAL / 1000} seconds...`);
                this.reconnectTimer = setTimeout(() => {
                    this.reconnectTimer = null; // Xóa ID của timer trước khi thử lại
                    this.initConnection();
                }, this.RETRY_INTERVAL);
            }
        });
    }
    callService(serviceName, serviceType, request) {
        return new Promise((resolve, reject) => {
            if (!this.ros) {
                reject(new Error('ROS connection not available'));
                return;
            }

            const service = new ROSLIB.Service({
                ros: this.ros,
                name: serviceName,
                serviceType: serviceType
            });

            service.callService(request, (result) => {
                resolve(result);
            }, (error) => {
                reject(error);
            });
        });
    }

    sendRobotCommand(commandId, message) {
        return new Promise((resolve, reject) => {
            if (!this.ros) {
                reject(new Error('ROS connection not available'));
                return;
            }

            try {
                // Create a service request for robot command
                const service = new ROSLIB.Service({
                    ros: this.ros,
                    name: '/robot/command', // Correct service name
                    serviceType: 'ntuamr/robot_command' // Use correct service type
                });

                const request = new ROSLIB.ServiceRequest({
                    cmd: commandId,
                    msg: message
                });

                service.callService(request, (result) => {
                    console.log('Robot command sent successfully:', result);
                    resolve(result);
                }, (error) => {
                    console.error('Error sending robot command:', error);
                    reject(error);
                });

            } catch (error) {
                console.error('Error in sendRobotCommand:', error);
                reject(error);
            }
        });
    }

    getConnection() {
        return this.ros;
    }

    getRos() {
        return this.ros;
    }

    isConnected() {
        return this.connected;
    }
}

// Create singleton instance
const rosConnection = new ROSConnection();

// Export the instance directly to preserve all methods
module.exports = rosConnection; 