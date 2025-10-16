const RobotCommands = {
    // Map related commands
    SET_UPDATE_MAP: 1,
    SET_MAP_STOP: 2,
    SET_MAP_CURRENT_CHANGE: 3,
    SET_SAVE_ONLY_MAP_FROM_SQL_TO_FILE: 4,
    SET_SAVE_ALL_CONFIG_MAP_FROM_SQL_TO_FILE: 5,
    SET_SAVE_COSTMAP_FROM_SQL_TO_FILE: 6,

    // SLAM commands
    SET_START_SLAM: 7,
    SET_PAUSE_SLAM: 8,
    SET_SAVE_SLAM_MAP: 9,
    SET_STOP_SLAM: 10,

    // Navigation commands
    SET_START_NAVIGATION: 11,
    SET_STOP_NAVIGATION: 12,
    SET_UPDATE_COST_MAP_TO_NAVIGATION: 13,
    GET_NAVIGATION_STATED: 14,

    // Mission commands
    GET_LIST_MISSIONS: 15,
    SET_EXECUSE_MISSIONS: 16,
    START_MISSION: 17,
    PAUSE_MISSION: 18,
    RESUME_MISSION: 19,
    STOP_MISSION: 20,
    GET_MISSION_STATUS: 21,
    ADD_TO_MISSION_QUEUE: 22,
    GET_SYSTEM_STATUS: 23,
    SET_CANCEL_MISSION_BY_UUID: 24,
    SET_MISSION_QUEUE_ORDER: 25,

    // Pattern detection commands
    GET_PATTERN_POSE: 26,
    CHANGE_SITE: 27
};

// Thêm mô tả cho mỗi command (có thể dùng cho documentation hoặc UI)
const CommandDescriptions = {
    [RobotCommands.SET_UPDATE_MAP]: 'Update map',
    [RobotCommands.SET_MAP_STOP]: 'Stop current map',
    [RobotCommands.SET_MAP_CURRENT_CHANGE]: 'Change current map',
    [RobotCommands.SET_SAVE_ONLY_MAP_FROM_SQL_TO_FILE]: 'Save map from SQL to file',
    [RobotCommands.SET_SAVE_ALL_CONFIG_MAP_FROM_SQL_TO_FILE]: 'Save all map configurations',
    [RobotCommands.SET_SAVE_COSTMAP_FROM_SQL_TO_FILE]: 'Save costmap to file',
    [RobotCommands.SET_START_SLAM]: 'Start SLAM mapping',
    [RobotCommands.SET_PAUSE_SLAM]: 'Pause SLAM mapping',
    [RobotCommands.SET_SAVE_SLAM_MAP]: 'Save SLAM map',
    [RobotCommands.SET_STOP_SLAM]: 'Stop SLAM mapping',
    [RobotCommands.SET_START_NAVIGATION]: 'Start navigation',
    [RobotCommands.SET_STOP_NAVIGATION]: 'Stop navigation',
    [RobotCommands.SET_UPDATE_COST_MAP_TO_NAVIGATION]: 'Update costmap for navigation',
    [RobotCommands.GET_NAVIGATION_STATED]: 'Get navigation state',
    [RobotCommands.GET_LIST_MISSIONS]: 'Get list of missions',
    [RobotCommands.SET_EXECUSE_MISSIONS]: 'Set mission execution',
    [RobotCommands.START_MISSION]: 'Start mission',
    [RobotCommands.PAUSE_MISSION]: 'Pause mission',
    [RobotCommands.RESUME_MISSION]: 'Resume mission',
    [RobotCommands.STOP_MISSION]: 'Stop mission',
    [RobotCommands.GET_MISSION_STATUS]: 'Get mission status',
    [RobotCommands.ADD_TO_MISSION_QUEUE]: 'Add mission to queue',
    [RobotCommands.GET_SYSTEM_STATUS]: 'Get system status',
    [RobotCommands.SET_CANCEL_MISSION_BY_UUID]: 'Cancel mission by UUID',
    [RobotCommands.SET_MISSION_QUEUE_ORDER]: 'Set mission queue order',
    [RobotCommands.GET_PATTERN_POSE]: 'Get pattern pose for marker detection',
    [RobotCommands.CHANGE_SITE]: 'Change site'
};

module.exports = {
    robotCommands: RobotCommands,
    commandDescriptions: CommandDescriptions
}; 