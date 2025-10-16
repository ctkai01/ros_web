import { SERVER_URL, apiCallWithRetry } from '../config/serverConfig';

/**
 * Gửi lệnh CHANGE_SITE đến robot khi có thay đổi site default
 * @param {number} siteId - ID của site mới được đặt làm default
 * @param {string} siteName - Tên của site
 * @returns {Promise<boolean>} - True nếu thành công, false nếu thất bại
 */
export const sendChangeSiteCommand = async (siteId, siteName) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return false;
        }

        console.log(`Sending CHANGE_SITE command for site: ${siteName} (ID: ${siteId})`);

        const response = await apiCallWithRetry(`${SERVER_URL}/api/robot/command`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                cmd: 'CHANGE_SITE',
                msg: JSON.stringify({
                    SiteID: parseInt(siteId),
                    siteName: siteName
                })
            }
        });

        if (response.success) {
            console.log(`CHANGE_SITE command sent successfully for site: ${siteName}`);
            return true;
        } else {
            console.error(`Failed to send CHANGE_SITE command: ${response.message}`);
            return false;
        }
    } catch (error) {
        console.error('Error sending CHANGE_SITE command:', error);
        return false;
    }
};
