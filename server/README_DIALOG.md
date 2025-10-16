# Robot Dialog API

Hệ thống dialog cho phép robot gửi câu hỏi đến web interface và nhận response từ người dùng.

## Tổng quan

Hệ thống bao gồm:
- **Server API**: Xử lý dialog requests/responses
- **Web Interface**: Component React để hiển thị và trả lời dialog
- **Robot Helper**: Utility class để robot gửi requests

## API Endpoints

### 1. POST `/api/dialog/variable/request`
Robot gửi dialog request

**Request Body:**
```json
{
  "request_id": "unique-id-here",
  "message": "Câu hỏi từ robot hoặc FIELD_TYPE:message"
}
```

**Message Format:**

1. **Simple text**: 
   ```
   "Please enter a value"
   ```

2. **JSON format từ robot**:
   ```json
   {
     "message": "[{\"text\":\"Which Position?\",\"value\":\"123\",\"is_current\":true}]",
     "title": "Select Target Position", 
     "type": "position"
   }
   ```

3. **JSON với multiple options**:
   ```json
   {
     "message": "[{\"text\":\"Position A\",\"value\":\"1\"},{\"text\":\"Position B\",\"value\":\"2\",\"is_current\":true}]",
     "title": "Select Target Position",
     "type": "position" 
   }
   ```

**Field Types:**

**Position/Marker Types:**
- `position` - Combobox cho chọn position từ bản đồ
- `marker` - Combobox cho chọn marker docking

**Integer Types:**
- `int` - Integer input cho số nguyên
- `time` - Integer input cho thời gian (giây)
- `iterations` - Integer input cho số lần lặp
- `usergroupid` - Integer input cho ID nhóm người dùng
- `idmission` - Integer input cho ID mission

**Double Types:**
- `double` - Number input cho số thực

**Boolean Types:**
- `bool` - Combobox cho chọn true/false

**Logic/Control Types:**
- `compare` - Combobox cho biến so sánh
- `operator` - Combobox cho toán tử so sánh
- `value` - Text input cho giá trị so sánh
- `indicator` - Combobox cho chỉ báo điều kiện

**Text/String Types:**
- `question` - Text input cho câu hỏi
- `description` - Text input cho mô tả

**Dialog Types:**
- `promptuser` - Combobox cho xác nhận Yes/No
- `message` - Text display (read-only) cho thông báo lỗi

**Legacy/Compatibility Types:**
- `retries` - Integer input cho số lần thử lại
- `distance_threshold` - Number input cho ngưỡng khoảng cách

**Response:**
```json
{
  "success": true,
  "message": "Dialog request received and stored",
  "request_id": "unique-id-here"
}
```

### 2. GET `/api/dialog/variable/pending`
Web client lấy danh sách pending requests

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "request_id": "unique-id-here",
      "message": "Câu hỏi từ robot",
      "timestamp": 1703123456789,
      "status": "pending"
    }
  ]
}
```

### 3. POST `/api/dialog/variable/response`
Web client gửi response cho robot

**Request Body:**
```json
{
  "request_id": "unique-id-here",
  "response": "{\"value\":\"selected_id_or_input_value\",\"accepted\":true}"
}
```

**Response Format:**
- **Accepted (OK button)**: `{"value": "user_input_or_selected_id", "accepted": true}`
- **Cancelled**: `{"value": "", "accepted": false}`

**Examples:**
```json
// Position selected
{"value": "123", "accepted": true}

// Marker selected
{"value": "456", "accepted": true}

// Integer input
{"value": "42", "accepted": true}

// Double input
{"value": "3.14", "accepted": true}

// Boolean selected
{"value": "true", "accepted": true}

// Text input
{"value": "user entered text", "accepted": true}

// Combobox selection
{"value": "selected_option", "accepted": true}

// Cancelled
{"value": "", "accepted": false}
```

**Response:**
```json
{
  "success": true,
  "message": "Dialog response received and stored",
  "request_id": "unique-id-here",
  "response": "Câu trả lời từ người dùng"
}
```

### 4. GET `/api/dialog/variable/request/:requestId`
Lấy thông tin chi tiết của một request

**Response:**
```json
{
  "success": true,
  "data": {
    "request_id": "unique-id-here",
    "message": "Câu hỏi từ robot",
    "timestamp": 1703123456789,
    "status": "responded",
    "response": "Câu trả lời từ người dùng",
    "responseTimestamp": 1703123500000
  }
}
```

### 5. DELETE `/api/dialog/variable/request/:requestId`
Xóa một pending request

**Response:**
```json
{
  "success": true,
  "message": "Dialog request deleted successfully",
  "request_id": "unique-id-here"
}
```

## Cài đặt

### 1. Cài đặt dependencies
```bash
cd server
npm install axios uuid
```

### 2. Thêm route vào server
Đã được thêm vào `server.js`:
```javascript
const dialogRoutes = require('./api/dialog');
app.use('/api/dialog', dialogRoutes);
```

## Sử dụng

### 1. Trong Robot (ROS Node)

```javascript
const DialogHelper = require('./utils/dialogHelper');

// Khởi tạo
const dialogHelper = new DialogHelper(
    'http://localhost:3000', // Server URL
    'your-jwt-token-here'    // JWT token
);

// Gửi câu hỏi và chờ response
async function askUserForConfirmation() {
    const result = await dialogHelper.sendDialogRequestAndWait(
        'Bạn có muốn robot tiếp tục không? (Yes/No)',
        300000 // 5 phút timeout
    );

    if (result.success) {
        const response = result.response.toLowerCase();
        if (response === 'yes' || response === 'y') {
            console.log('Tiếp tục mission');
            return true;
        } else {
            console.log('Dừng mission');
            return false;
        }
    }
    
    return true; // Mặc định tiếp tục nếu không có response
}
```

### 2. Trong Web Interface

```javascript
import DialogManager from './components/Dialog/DialogManager';

// Sử dụng trong component
function App() {
    return (
        <div>
            <DialogManager />
        </div>
    );
}
```

## Luồng hoạt động

1. **Robot gửi request**: Robot publish message đến ROS topic `/robot/dialog/variable/request`
2. **Server nhận request**: Server subscribe ROS topic và lưu request vào memory với status "pending"
3. **Web interface polling**: Web interface poll API `GET /api/dialog/variable/pending` mỗi 2 giây
4. **Người dùng trả lời**: Người dùng nhập response và gửi qua API `POST /api/dialog/variable/response`
5. **Robot nhận response**: Server publish structured response đến ROS topic `/robot/dialog/variable/response`
6. **Robot cancel request**: Robot có thể publish message đến ROS topic `/robot/dialog/variable/cancel` để hủy request

## Response Format

Robot sẽ nhận response với format:
```json
{
  "request_id": "unique-id-here",
  "response": "{\"value\":\"selected_id_or_input\",\"accepted\":true}"
}
```

**Response Structure:**
- `value`: ID được chọn (cho combobox) hoặc giá trị nhập (cho text/number)
- `accepted`: `true` nếu user click OK, `false` nếu user click Cancel

## Tính năng

- ✅ **Real-time**: Web interface tự động cập nhật khi có request mới
- ✅ **Timeout handling**: Tự động xóa requests cũ (5 phút)
- ✅ **Error handling**: Xử lý lỗi network và validation
- ✅ **Multiple requests**: Hỗ trợ nhiều requests cùng lúc
- ✅ **Authentication**: Sử dụng JWT token
- ✅ **Responsive**: Web interface responsive trên mobile

## Ví dụ sử dụng

Xem file `examples/robotDialogExample.js` để có ví dụ chi tiết về:
- Gửi câu hỏi xác nhận
- Lấy input từ người dùng
- Gửi nhiều requests cùng lúc
- Sử dụng với ROS callback

## Examples cho tất cả Field Types

### Position/Marker Types
```javascript
// Position selection
await dialogHelper.sendDialogRequest(
    '{"message":"[{\\"text\\":\\"Which Position?\\",\\"value\\":\\"123\\",\\"is_current\\":true}]","title":"Select Target Position","type":"position"}',
    'pos-request-1'
);

// Marker selection
await dialogHelper.sendDialogRequest(
    '{"message":"[{\\"text\\":\\"Which Marker?\\",\\"value\\":\\"456\\",\\"is_current\\":true}]","title":"Select Docking Marker","type":"marker"}',
    'marker-request-1'
);
```

### Integer Types
```javascript
// Integer input
await dialogHelper.sendDialogRequest(
    '{"message":"Enter number of retries","title":"Retry Count","type":"int"}',
    'int-request-1'
);

// Time input
await dialogHelper.sendDialogRequest(
    '{"message":"Enter wait time (seconds)","title":"Wait Time","type":"time"}',
    'time-request-1'
);

// Iterations input
await dialogHelper.sendDialogRequest(
    '{"message":"Enter number of iterations","title":"Loop Count","type":"iterations"}',
    'iter-request-1'
);

// User Group ID
await dialogHelper.sendDialogRequest(
    '{"message":"Enter user group ID","title":"User Group","type":"usergroupid"}',
    'group-request-1'
);

// Mission ID
await dialogHelper.sendDialogRequest(
    '{"message":"Enter mission ID","title":"Mission","type":"idmission"}',
    'mission-request-1'
);
```

### Double Types
```javascript
// Double input
await dialogHelper.sendDialogRequest(
    '{"message":"Enter distance threshold","title":"Distance","type":"double"}',
    'double-request-1'
);
```

### Boolean Types
```javascript
// Boolean selection
await dialogHelper.sendDialogRequest(
    '{"message":"Enable collision detection?","title":"Collision Detection","type":"bool"}',
    'bool-request-1'
);
```

### Logic/Control Types
```javascript
// Compare variable
await dialogHelper.sendDialogRequest(
    '{"message":"Select variable to compare","title":"Compare","type":"compare"}',
    'compare-request-1'
);

// Operator selection
await dialogHelper.sendDialogRequest(
    '{"message":"Select comparison operator","title":"Operator","type":"operator"}',
    'op-request-1'
);

// Value input
await dialogHelper.sendDialogRequest(
    '{"message":"Enter comparison value","title":"Value","type":"value"}',
    'val-request-1'
);

// Indicator selection
await dialogHelper.sendDialogRequest(
    '{"message":"Select condition indicator","title":"Indicator","type":"indicator"}',
    'ind-request-1'
);
```

### Text/String Types
```javascript
// Question input
await dialogHelper.sendDialogRequest(
    '{"message":"Enter your question","title":"Question","type":"question"}',
    'q-request-1'
);

// Description input
await dialogHelper.sendDialogRequest(
    '{"message":"Enter description","title":"Description","type":"description"}',
    'desc-request-1'
);
```

### Dialog Types
```javascript
// Prompt user (Yes/No)
await dialogHelper.sendDialogRequest(
    '{"message":"Do you want to continue?","title":"Confirmation","type":"promptuser"}',
    'prompt-request-1'
);

// Message display (read-only)
await dialogHelper.sendDialogRequest(
    '{"message":"Error: Mission failed","title":"Error","type":"message"}',
    'msg-request-1'
);
```

### Legacy Types
```javascript
// Retries (legacy)
await dialogHelper.sendDialogRequest(
    '{"message":"Enter retry count","title":"Retries","type":"retries"}',
    'retry-request-1'
);

// Distance threshold (legacy)
await dialogHelper.sendDialogRequest(
    '{"message":"Enter distance threshold","title":"Distance","type":"distance_threshold"}',
    'dist-request-1'
);
```

## Lưu ý

1. **Memory storage**: Requests được lưu trong memory, sẽ mất khi restart server
2. **Timeout**: Requests tự động xóa sau 5 phút
3. **Authentication**: Cần JWT token hợp lệ để sử dụng API
4. **Polling**: Web interface poll mỗi 2 giây, có thể điều chỉnh

## Troubleshooting

### Lỗi thường gặp:

1. **"Dialog request not found"**: Request đã bị xóa hoặc timeout
2. **"Missing required fields"**: Thiếu `request_id` hoặc `message`
3. **"Unauthorized"**: JWT token không hợp lệ hoặc hết hạn

### Debug:

- Kiểm tra console logs của server
- Kiểm tra Network tab trong browser
- Kiểm tra JWT token có hợp lệ không

## ROS Topics

### Request Topic: `/robot/dialog/variable/request`
**Message Type:** `ntuamr/UIDialogRequest`

```
string request_id
string message
```

### Response Topic: `/robot/dialog/variable/response`
**Message Type:** `ntuamr/UIDialogResponse`

```
string request_id
string response
```

### Cancel Topic: `/robot/dialog/variable/cancel`
**Message Type:** `ntuamr/UIDialogCancel`

```
string request_id
```

**Sử dụng Cancel Topic:**
Robot có thể cancel dialog request bằng cách publish message với `request_id` tương ứng. Server sẽ tự động xóa request khỏi pending list và web interface sẽ ẩn dialog.
