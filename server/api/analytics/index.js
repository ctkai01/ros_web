const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { config } = require('../../config/database');
const { authenticateToken } = require('../auth/middleware');

// Get analytics data with date range and grouping
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, grouping = 'Day' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    
    const isMySql = config.engine === 'mysql';
    const table = 'RobotAnalytics';

    let query;
    switch (grouping.toLowerCase()) {
      case 'day':
        query = isMySql ? `
          SELECT 
            DATE(log_date) as date,
            SUM(distance_travelled_meters) as distanceDriven,
            SUM(uptime_seconds) as uptimeSeconds
          FROM ${table}
          WHERE log_date >= @startDate AND log_date <= @endDate
          GROUP BY DATE(log_date)
          ORDER BY date
        ` : `
          SELECT 
            CAST(log_date AS DATE) as date,
            SUM(distance_travelled_meters) as distanceDriven,
            SUM(uptime_seconds) as uptimeSeconds
          FROM ${table}
          WHERE log_date >= @startDate AND log_date <= @endDate
          GROUP BY CAST(log_date AS DATE)
          ORDER BY date
        `;
        break;
      case 'week':
        query = isMySql ? `
          SELECT 
            DATE_SUB(DATE(log_date), INTERVAL WEEKDAY(log_date) DAY) as date,
            SUM(distance_travelled_meters) as distanceDriven,
            SUM(uptime_seconds) as uptimeSeconds
          FROM ${table}
          WHERE log_date >= @startDate AND log_date <= @endDate
          GROUP BY DATE_SUB(DATE(log_date), INTERVAL WEEKDAY(log_date) DAY)
          ORDER BY date
        ` : `
          SELECT 
            DATEADD(week, DATEDIFF(week, 0, log_date), 0) as date,
            SUM(distance_travelled_meters) as distanceDriven,
            SUM(uptime_seconds) as uptimeSeconds
          FROM ${table}
          WHERE log_date >= @startDate AND log_date <= @endDate
          GROUP BY DATEADD(week, DATEDIFF(week, 0, log_date), 0)
          ORDER BY date
        `;
        break;
      case 'month':
        query = isMySql ? `
          SELECT 
            DATE_FORMAT(log_date, '%Y-%m-01') as date,
            SUM(distance_travelled_meters) as distanceDriven,
            SUM(uptime_seconds) as uptimeSeconds
          FROM ${table}
          WHERE log_date >= @startDate AND log_date <= @endDate
          GROUP BY DATE_FORMAT(log_date, '%Y-%m-01')
          ORDER BY date
        ` : `
          SELECT 
            DATEADD(month, DATEDIFF(month, 0, log_date), 0) as date,
            SUM(distance_travelled_meters) as distanceDriven,
            SUM(uptime_seconds) as uptimeSeconds
          FROM ${table}
          WHERE log_date >= @startDate AND log_date <= @endDate
          GROUP BY DATEADD(month, DATEDIFF(month, 0, log_date), 0)
          ORDER BY date
        `;
        break;
      case 'year':
        query = isMySql ? `
          SELECT 
            DATE_FORMAT(log_date, '%Y-01-01') as date,
            SUM(distance_travelled_meters) as distanceDriven,
            SUM(uptime_seconds) as uptimeSeconds
          FROM ${table}
          WHERE log_date >= @startDate AND log_date <= @endDate
          GROUP BY DATE_FORMAT(log_date, '%Y-01-01')
          ORDER BY date
        ` : `
          SELECT 
            DATEADD(year, DATEDIFF(year, 0, log_date), 0) as date,
            SUM(distance_travelled_meters) as distanceDriven,
            SUM(uptime_seconds) as uptimeSeconds
          FROM ${table}
          WHERE log_date >= @startDate AND log_date <= @endDate
          GROUP BY DATEADD(year, DATEDIFF(year, 0, log_date), 0)
          ORDER BY date
        `;
        break;
      default:
        return res.status(400).json({ error: 'Invalid grouping parameter' });
    }

    const result = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(query);

    // Format the data for the frontend
    const analyticsData = result.recordset.map(record => ({
      date: record.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      distanceDriven: Math.round(record.distanceDriven * 100) / 100, // Round to 2 decimal places
      uptimeSeconds: record.uptimeSeconds,
      uptimeHours: Math.round((record.uptimeSeconds / 3600) * 100) / 100 // Convert to hours
    }));

    res.json(analyticsData);
    
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    // Kiểm tra lỗi cụ thể
    if (error.code === 'ETIMEOUT') {
      return res.status(504).json({
        error: 'Database connection timeout',
        details: error.message
      });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Database connection refused',
        details: error.message
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get summary statistics
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    
    const isMySql = config.engine === 'mysql';
    const table = 'RobotAnalytics';
    const countDistinctDays = isMySql ? 'COUNT(DISTINCT DATE(log_date))' : 'COUNT(DISTINCT CAST(log_date AS DATE))';
    const query = `
      SELECT 
        SUM(distance_travelled_meters) as totalDistance,
        SUM(uptime_seconds) as totalUptime,
        ${countDistinctDays} as totalDays,
        AVG(distance_travelled_meters) as avgDistancePerDay,
        AVG(uptime_seconds) as avgUptimePerDay
      FROM ${table}
      WHERE log_date >= @startDate AND log_date <= @endDate
    `;

    const result = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(query);

    const summary = result.recordset[0];
    
    res.json({
      totalDistance: Math.round(summary.totalDistance * 100) / 100,
      totalUptime: summary.totalUptime,
      totalUptimeHours: Math.round((summary.totalUptime / 3600) * 100) / 100,
      totalDays: summary.totalDays,
      avgDistancePerDay: Math.round(summary.avgDistancePerDay * 100) / 100,
      avgUptimePerDay: Math.round((summary.avgUptimePerDay / 3600) * 100) / 100
    });
    
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    // Kiểm tra lỗi cụ thể
    if (error.code === 'ETIMEOUT') {
      return res.status(504).json({
        error: 'Database connection timeout',
        details: error.message
      });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Database connection refused',
        details: error.message
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
