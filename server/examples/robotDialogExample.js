const DialogHelper = require('../utils/dialogHelper');

// Ví dụ sử dụng DialogHelper trong ROS node
class RobotDialogExample {
    constructor() {
        // Khởi tạo DialogHelper với server URL và token
        this.dialogHelper = new DialogHelper(
            'http://localhost:3000', // Server URL
            'your-jwt-token-here'    // JWT token từ authentication
        );
    }

    /**
     * Ví dụ 1: Gửi dialog request và chờ response
     */
    async exampleAskUserForConfirmation() {
        try {
            console.log('Robot: Gửi câu hỏi xác nhận...');
            
            const result = await this.dialogHelper.sendDialogRequestAndWait(
                'Bạn có muốn robot tiếp tục thực hiện mission không? (Yes/No)',
                300000 // 5 phút timeout
            );

            if (result.success) {
                const response = result.response.toLowerCase();
                
                if (response === 'yes' || response === 'y') {
                    console.log('Robot: Người dùng xác nhận - tiếp tục mission');
                    // Tiếp tục thực hiện mission
                    return true;
                } else if (response === 'no' || response === 'n') {
                    console.log('Robot: Người dùng từ chối - dừng mission');
                    // Dừng mission
                    return false;
                } else {
                    console.log('Robot: Response không rõ ràng, mặc định tiếp tục');
                    return true;
                }
            } else {
                console.log('Robot: Không nhận được response, mặc định tiếp tục');
                return true;
            }
        } catch (error) {
            console.error('Robot: Lỗi khi gửi dialog request:', error);
            return true; // Mặc định tiếp tục nếu có lỗi
        }
    }

    /**
     * Ví dụ 2: Gửi dialog request và polling để check response
     */
    async exampleAskUserForInput() {
        try {
            console.log('Robot: Gửi câu hỏi lấy input...');
            
            // Gửi request
            const sendResult = await this.dialogHelper.sendDialogRequest(
                'Vui lòng nhập tên đích đến:'
            );

            if (!sendResult.success) {
                throw new Error(sendResult.error);
            }

            const requestId = sendResult.request_id;
            console.log(`Robot: Đã gửi request với ID: ${requestId}`);

            // Polling để chờ response
            const response = await this.dialogHelper.waitForDialogResponse(
                requestId,
                60000, // 1 phút timeout
                1000   // Check mỗi 1 giây
            );

            if (response.success) {
                console.log(`Robot: Nhận được response: "${response.response}"`);
                return response.response;
            } else {
                console.log('Robot: Không nhận được response');
                return null;
            }
        } catch (error) {
            console.error('Robot: Lỗi khi gửi dialog request:', error);
            return null;
        }
    }

    /**
     * Ví dụ 3: Gửi nhiều dialog requests cùng lúc
     */
    async exampleMultipleDialogRequests() {
        try {
            console.log('Robot: Gửi nhiều câu hỏi...');
            
            const questions = [
                'Bạn có muốn robot di chuyển đến vị trí A không?',
                'Bạn có muốn robot di chuyển đến vị trí B không?',
                'Bạn có muốn robot di chuyển đến vị trí C không?'
            ];

    /**
     * Ví dụ 4: Sử dụng các loại field types khác nhau
     */
    async exampleDifferentFieldTypes() {
        try {
            console.log('Robot: Gửi các loại dialog khác nhau...');
            
            // Position selection
            const positionResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"[{\\"text\\":\\"Which Position?\\",\\"value\\":\\"123\\",\\"is_current\\":true}]","title":"Select Target Position","type":"position"}',
                'pos-request-1'
            );
            console.log('Position request result:', positionResult);

            // Integer input
            const intResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"Enter number of retries","title":"Retry Count","type":"int"}',
                'int-request-1'
            );
            console.log('Integer request result:', intResult);

            // Double input
            const doubleResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"Enter distance threshold","title":"Distance","type":"double"}',
                'double-request-1'
            );
            console.log('Double request result:', doubleResult);

            // Boolean selection
            const boolResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"Enable collision detection?","title":"Collision Detection","type":"bool"}',
                'bool-request-1'
            );
            console.log('Boolean request result:', boolResult);

            // Marker selection
            const markerResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"[{\\"text\\":\\"Which Marker?\\",\\"value\\":\\"456\\",\\"is_current\\":true}]","title":"Select Docking Marker","type":"marker"}',
                'marker-request-1'
            );
            console.log('Marker request result:', markerResult);

            // Time input
            const timeResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"Enter wait time (seconds)","title":"Wait Time","type":"time"}',
                'time-request-1'
            );
            console.log('Time request result:', timeResult);

            // Question input
            const questionResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"Enter your question","title":"Question","type":"question"}',
                'q-request-1'
            );
            console.log('Question request result:', questionResult);

            // Description input
            const descResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"Enter description","title":"Description","type":"description"}',
                'desc-request-1'
            );
            console.log('Description request result:', descResult);

            // Prompt user (Yes/No)
            const promptResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"Do you want to continue?","title":"Confirmation","type":"promptuser"}',
                'prompt-request-1'
            );
            console.log('Prompt request result:', promptResult);

            // Message display (read-only)
            const messageResult = await this.dialogHelper.sendDialogRequest(
                '{"message":"Error: Mission failed","title":"Error","type":"message"}',
                'msg-request-1'
            );
            console.log('Message request result:', messageResult);

        } catch (error) {
            console.error('Robot: Lỗi khi gửi dialog requests:', error);
        }
    }

            const requests = questions.map(async (question, index) => {
                const result = await this.dialogHelper.sendDialogRequest(
                    question,
                    `request-${index + 1}` // Custom request ID
                );
                return result;
            });

            const results = await Promise.all(requests);
            
            console.log('Robot: Đã gửi tất cả requests:', results);
            
            // Chờ response cho từng request
            for (let i = 0; i < results.length; i++) {
                if (results[i].success) {
                    const response = await this.dialogHelper.waitForDialogResponse(
                        results[i].request_id,
                        30000 // 30 giây timeout cho mỗi request
                    );
                    
                    if (response.success) {
                        console.log(`Robot: Response cho câu hỏi ${i + 1}: "${response.response}"`);
                    }
                }
            }
        } catch (error) {
            console.error('Robot: Lỗi khi gửi multiple dialog requests:', error);
        }
    }

    /**
     * Ví dụ 4: Sử dụng trong ROS node với callback
     */
    async exampleWithROSCallback() {
        try {
            console.log('Robot: Gửi dialog request với ROS callback...');
            
            // Gửi request
            const sendResult = await this.dialogHelper.sendDialogRequest(
                'Robot đã hoàn thành task. Bạn có muốn tiếp tục không?'
            );

            if (!sendResult.success) {
                throw new Error(sendResult.error);
            }

            // Trong ROS node, bạn có thể set up một timer để check response
            const checkInterval = setInterval(async () => {
                try {
                    const result = await this.dialogHelper.checkDialogResponse(sendResult.request_id);
                    
                    if (result.success && result.data.status === 'responded') {
                        clearInterval(checkInterval);
                        
                        const response = result.data.response;
                        console.log(`Robot: Nhận được response: "${response}"`);
                        
                        // Xử lý response trong ROS node
                        this.handleDialogResponse(response);
                    }
                } catch (error) {
                    console.error('Robot: Lỗi khi check response:', error);
                }
            }, 2000); // Check mỗi 2 giây

            // Set timeout để clear interval
            setTimeout(() => {
                clearInterval(checkInterval);
                console.log('Robot: Timeout waiting for response');
            }, 300000); // 5 phút timeout

        } catch (error) {
            console.error('Robot: Lỗi trong ROS callback example:', error);
        }
    }

    /**
     * Xử lý response từ dialog
     */
    handleDialogResponse(response) {
        const lowerResponse = response.toLowerCase();
        
        switch (lowerResponse) {
            case 'yes':
            case 'y':
                console.log('Robot: Tiếp tục thực hiện task');
                // Gọi ROS service hoặc action để tiếp tục
                break;
                
            case 'no':
            case 'n':
                console.log('Robot: Dừng thực hiện task');
                // Gọi ROS service hoặc action để dừng
                break;
                
            case 'pause':
                console.log('Robot: Tạm dừng task');
                // Gọi ROS service để pause
                break;
                
            default:
                console.log(`Robot: Response không xác định: "${response}"`);
                break;
        }
    }
}

// Export để sử dụng trong ROS node
module.exports = RobotDialogExample;

// Ví dụ sử dụng
if (require.main === module) {
    const example = new RobotDialogExample();
    
    // Chạy các ví dụ
    async function runExamples() {
        console.log('=== Robot Dialog Examples ===\n');
        
        console.log('1. Example: Ask for confirmation');
        await example.exampleAskUserForConfirmation();
        console.log('\n');
        
        console.log('2. Example: Ask for input');
        await example.exampleAskUserForInput();
        console.log('\n');
        
        console.log('3. Example: Multiple requests');
        await example.exampleMultipleDialogRequests();
        console.log('\n');
        
        console.log('4. Example: Different field types');
        await example.exampleDifferentFieldTypes();
        console.log('\n');
        
        console.log('5. Example: ROS callback');
        await example.exampleWithROSCallback();
    }
    
    runExamples().catch(console.error);
}
