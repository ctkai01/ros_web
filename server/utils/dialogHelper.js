const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class DialogHelper {
    constructor(serverUrl, token) {
        this.serverUrl = serverUrl;
        this.token = token;
        this.baseURL = `${serverUrl}/api/dialog/variable`;
    }

    /**
     * Gửi dialog request từ robot
     * @param {string} message - Nội dung câu hỏi (có thể có format "FIELD_TYPE:message")
     * @param {string} requestId - ID tùy chọn, nếu không có sẽ tự tạo UUID
     * @returns {Promise<Object>} Kết quả response
     */
    async sendDialogRequest(message, requestId = null) {
        try {
            const id = requestId || uuidv4();
            
            const requestBody = {
                request_id: id,
                message: message
            };
            
            const response = await axios.post(`${this.baseURL}/request`, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log(`Dialog request sent successfully: ${id}`);
            return {
                success: true,
                request_id: id,
                data: response.data
            };
        } catch (error) {
            console.error('Error sending dialog request:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * Kiểm tra response cho một dialog request
     * @param {string} requestId - ID của request
     * @returns {Promise<Object>} Thông tin response
     */
    async checkDialogResponse(requestId) {
        try {
            const response = await axios.get(`${this.baseURL}/request/${requestId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error checking dialog response:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * Polling để chờ response từ web interface
     * @param {string} requestId - ID của request
     * @param {number} timeout - Timeout tính bằng milliseconds (default: 5 phút)
     * @param {number} interval - Interval giữa các lần check (default: 2 giây)
     * @returns {Promise<Object>} Response từ web interface
     */
    async waitForDialogResponse(requestId, timeout = 5 * 60 * 1000, interval = 2000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkResponse = async () => {
                try {
                    const result = await this.checkDialogResponse(requestId);
                    
                    if (result.success) {
                        const requestData = result.data;
                        
                        if (requestData.status === 'responded') {
                            resolve({
                                success: true,
                                response: requestData.response,
                                request_id: requestId
                            });
                            return;
                        }
                    }
                    
                    // Check timeout
                    if (Date.now() - startTime > timeout) {
                        reject(new Error(`Dialog response timeout after ${timeout}ms`));
                        return;
                    }
                    
                    // Continue polling
                    setTimeout(checkResponse, interval);
                } catch (error) {
                    reject(error);
                }
            };
            
            // Start polling
            checkResponse();
        });
    }

    /**
     * Gửi dialog request và chờ response
     * @param {string} message - Nội dung câu hỏi (có thể có format "FIELD_TYPE:message")
     * @param {number} timeout - Timeout tính bằng milliseconds
     * @returns {Promise<Object>} Response từ web interface
     */
    async sendDialogRequestAndWait(message, timeout = 5 * 60 * 1000) {
        try {
            // Gửi request
            const sendResult = await this.sendDialogRequest(message);
            
            if (!sendResult.success) {
                throw new Error(sendResult.error);
            }
            
            // Chờ response
            const response = await this.waitForDialogResponse(sendResult.request_id, timeout);
            
            return response;
        } catch (error) {
            console.error('Error in sendDialogRequestAndWait:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = DialogHelper;
