const DialogHelper = require('../utils/dialogHelper');

// Ví dụ sử dụng DialogHelper dựa trên NTUMoveExecuteItem.cpp
class NTUMoveExecuteItemExample {
    constructor() {
        // Khởi tạo DialogHelper với server URL và token
        this.dialogHelper = new DialogHelper(
            'http://localhost:3000', // Server URL
            'your-jwt-token-here'    // JWT token từ authentication
        );
        
        // Trạng thái action
        this.actionStatus = 'NOT_YET'; // NOT_YET, MOVING, PAUSED, FAIL, DONE, IGNORE, CANCEL
        this.currentInteractionId = null;
        
        // Item data structure (tương tự như trong C++)
        this.item = {
            Item: {
                Position: {
                    UserVariable: false,
                    RespondVariable: false,
                    DialogRespond: false,
                    Variable: 0,
                    Message: ''
                },
                Retries: {
                    UserVariable: false,
                    RespondVariable: false,
                    DialogRespond: false,
                    Variable: 10,
                    Message: ''
                },
                Distance_threshold: {
                    UserVariable: false,
                    RespondVariable: false,
                    DialogRespond: false,
                    Variable: 0.1,
                    Message: ''
                }
            },
            PoseName: '',
            IDMap: 0,
            Pose: {
                position: { x: 0, y: 0, z: 0 },
                orientation: { x: 0, y: 0, z: 0, w: 1 }
            }
        };
    }

    /**
     * Reset tất cả các field
     */
    reset() {
        this.item.Item.Position.reset();
        this.item.Item.Retries.reset();
        this.item.Item.Distance_threshold.reset();
        this.actionStatus = 'NOT_YET';
    }

    /**
     * Try to do the action (tương tự như tryToDoIt trong C++)
     */
    async tryToDoIt() {
        // Bắt đầu với kiểm tra trạng thái
        if (this.actionStatus === 'CANCEL') {
            return true;
        }

        switch (this.actionStatus) {
            case 'NOT_YET': {
                // Bước 1: Kiểm tra xem có cần hỏi Position không
                if (this.item.Item.Position.UserVariable && !this.item.Item.Position.RespondVariable) {
                    if (!this.item.Item.Position.DialogRespond) {
                        console.log('Move: Requesting user input for Position.');
                        this.currentInteractionId = this.generateUUID();
                        
                        // Gửi dialog request cho Position (format: "POSITION:message")
                        const message = `POSITION:${this.item.Item.Position.Message || 'Please select target position'}`;
                        const result = await this.dialogHelper.sendDialogRequest(message);
                        
                        if (result.success) {
                            this.item.Item.Position.DialogRespond = true;
                        }
                    }
                    return false; // Chờ phản hồi
                }

                // Bước 2: Kiểm tra xem có cần hỏi Retries không
                if (this.item.Item.Retries.UserVariable && !this.item.Item.Retries.RespondVariable) {
                    if (!this.item.Item.Retries.DialogRespond) {
                        console.log('Move: Requesting user input for Retries.');
                        this.currentInteractionId = this.generateUUID();
                        
                        const message = `RETRIES:${this.item.Item.Retries.Message || 'Please enter number of retries'}`;
                        const result = await this.dialogHelper.sendDialogRequest(message);
                        
                        if (result.success) {
                            this.item.Item.Retries.DialogRespond = true;
                        }
                    }
                    return false; // Chờ phản hồi
                }

                // Bước 3: Kiểm tra xem có cần hỏi Distance_threshold không
                if (this.item.Item.Distance_threshold.UserVariable && !this.item.Item.Distance_threshold.RespondVariable) {
                    if (!this.item.Item.Distance_threshold.DialogRespond) {
                        console.log('Move: Requesting user input for Distance Threshold.');
                        this.currentInteractionId = this.generateUUID();
                        
                        const message = `DISTANCE_THRESHOLD:${this.item.Item.Distance_threshold.Message || 'Please enter distance threshold'}`;
                        const result = await this.dialogHelper.sendDialogRequest(message);
                        
                        if (result.success) {
                            this.item.Item.Distance_threshold.DialogRespond = true;
                        }
                    }
                    return false; // Chờ phản hồi
                }

                // Lấy dữ liệu pose từ server
                if (!this.getPoseDataFromServer()) {
                    this.actionStatus = 'IGNORE';
                    return true;
                }

                // Kiểm tra map transition
                const targetMapId = this.item.IDMap;
                const currentMapId = this.getCurrentMapId();

                if (targetMapId !== currentMapId) {
                    console.log(`Move: Target is on a different map (Target: ${targetMapId}, Current: ${currentMapId}). Transition required.`);
                    this.actionStatus = 'REQUIRE_TRANSITION';
                    return true;
                }

                // Kiểm tra move base client
                if (!this.isMoveBaseClientReady()) {
                    console.log('Move: Action server is not ready. Aborting.');
                    this.actionStatus = 'FAIL';
                    return true;
                }

                // Set parameters
                const maxRetries = this.item.Item.Retries.Variable;
                const distanceThreshold = this.item.Item.Distance_threshold.Variable;

                if (!this.setMoveBaseParameterInt('/move_base_node/set_parameters', 'max_planning_retries', maxRetries)) {
                    console.log('Move: Failed to set retries parameter.');
                    this.actionStatus = 'FAIL';
                    return true;
                }

                if (!this.setMoveBaseParameterDouble('/move_base_node/AMRLocalPlanner/SimpleGoalChecker/set_parameters', 'xy_goal_tolerance', distanceThreshold)) {
                    console.log('Move: Failed to set distance threshold parameter.');
                    this.actionStatus = 'FAIL';
                    return true;
                }

                // Gửi goal đến move_base
                const pose = this.item.Pose;
                const targetUuid = this.currentInteractionId;
                
                console.log(`Move: Sending goal to '${this.item.PoseName}'(${pose.position.x}, ${pose.position.y})`);

                if (!this.requestMoveToGoal(targetUuid, pose)) {
                    console.log('Move: Failed to send goal to move_base.');
                    this.actionStatus = 'FAIL';
                    return false;
                }

                this.actionStatus = 'MOVING';
                return false;
            }
            
            case 'MOVING': {
                return false; // Đang di chuyển
            }
            
            case 'PAUSED': {
                return false; // Đang tạm dừng
            }
            
            case 'FAIL': {
                console.log('Move: Failed.');
                return true;
            }
            
            case 'DONE':
            case 'IGNORE':
            case 'CANCEL': {
                return true;
            }
            
            default:
                break;
        }

        // Reset tất cả các giá trị
        this.item.Item.Position.reset();
        this.item.Item.Retries.reset();
        this.item.Item.Distance_threshold.reset();
        return true;
    }

    /**
     * Xử lý response từ user input (tương tự như onUserInputReciver trong C++)
     */
    async onUserInputReceiver(interactionId, responseData) {
        // Bỏ qua nếu không phải là yêu cầu mình đang chờ
        if (interactionId !== this.currentInteractionId) {
            return;
        }

        const accepted = responseData.accepted || false;

        // Dựa vào biến nào chưa có phản hồi để biết câu trả lời này dành cho câu hỏi nào
        if (this.item.Item.Position.UserVariable && !this.item.Item.Position.RespondVariable) {
            if (accepted) {
                this.item.Item.Position.Variable = parseInt(responseData.value) || 0;
            } else {
                this.actionStatus = 'IGNORE';
            }
            this.item.Item.Position.RespondVariable = true;
        } else if (this.item.Item.Retries.UserVariable && !this.item.Item.Retries.RespondVariable) {
            if (accepted) {
                this.item.Item.Retries.Variable = parseInt(responseData.value) || 10;
            } else {
                this.actionStatus = 'IGNORE';
            }
            this.item.Item.Retries.RespondVariable = true;
        } else if (this.item.Item.Distance_threshold.UserVariable && !this.item.Item.Distance_threshold.RespondVariable) {
            if (accepted) {
                this.item.Item.Distance_threshold.Variable = parseFloat(responseData.value) || 0.1;
            } else {
                this.actionStatus = 'IGNORE';
            }
            this.item.Item.Distance_threshold.RespondVariable = true;
        }
    }

    /**
     * Ví dụ sử dụng với polling để check response
     */
    async exampleWithPolling() {
        try {
            console.log('=== NTU Move Execute Item Example ===\n');

            // Thiết lập các field cần user input
            this.item.Item.Position.UserVariable = true;
            this.item.Item.Position.Message = 'Please select target position';
            
            this.item.Item.Retries.UserVariable = true;
            this.item.Item.Retries.Message = 'Please enter number of retries';
            
            this.item.Item.Distance_threshold.UserVariable = true;
            this.item.Item.Distance_threshold.Message = 'Please enter distance threshold';

            // Chạy action
            let result = false;
            while (!result) {
                result = await this.tryToDoIt();
                
                if (!result) {
                    // Chờ một chút trước khi thử lại
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            console.log('Action completed with status:', this.actionStatus);

        } catch (error) {
            console.error('Error in example:', error);
        }
    }

    // Helper methods (simulate C++ functionality)
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getPositionOptions() {
        // Simulate getting position options from database
        return [
            { value: '1', label: 'Position A' },
            { value: '2', label: 'Position B' },
            { value: '3', label: 'Position C' }
        ];
    }

    getPoseDataFromServer() {
        // Simulate getting pose data from database
        this.item.PoseName = 'Test Position';
        this.item.IDMap = 1;
        this.item.Pose.position = { x: 1.0, y: 2.0, z: 0.0 };
        this.item.Pose.orientation = { x: 0, y: 0, z: 0, w: 1 };
        return true;
    }

    getCurrentMapId() {
        // Simulate getting current map ID
        return 1;
    }

    isMoveBaseClientReady() {
        // Simulate checking if move base client is ready
        return true;
    }

    setMoveBaseParameterInt(service, parameter, value) {
        // Simulate setting move base parameter
        console.log(`Setting parameter ${parameter} = ${value}`);
        return true;
    }

    setMoveBaseParameterDouble(service, parameter, value) {
        // Simulate setting move base parameter
        console.log(`Setting parameter ${parameter} = ${value}`);
        return true;
    }

    requestMoveToGoal(uuid, pose) {
        // Simulate requesting move to goal
        console.log(`Requesting move to goal: ${uuid}`, pose);
        return true;
    }
}

// Export để sử dụng
module.exports = NTUMoveExecuteItemExample;

// Ví dụ sử dụng
if (require.main === module) {
    const example = new NTUMoveExecuteItemExample();
    example.exampleWithPolling().catch(console.error);
}
