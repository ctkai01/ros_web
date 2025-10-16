import React, { useState, useEffect, useRef } from 'react';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import './Analytics.css';

const Analytics = () => {
  // Get current date for default values
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentMonthStart = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  };

  const getCurrentMonthEnd = () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getCurrentMonthStart());
  const [endDate, setEndDate] = useState(getCurrentMonthEnd());
  const [grouping, setGrouping] = useState('Day');
  const [activeFilter, setActiveFilter] = useState('Current month');
  
  // Format date to dd/mm/yyyy for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Convert dd/mm/yyyy to yyyy-mm-dd for date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };
  const [chartData, setChartData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chartRef = useRef(null);

  // Fetch analytics data from API
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        grouping
      });

      const [analyticsResponse, summaryResponse] = await Promise.all([
        apiCallWithRetry(`${SERVER_URL}/api/analytics?${params}`),
        apiCallWithRetry(`${SERVER_URL}/api/analytics/summary?${params}`)
      ]);

      setChartData(analyticsResponse || []);
      setSummaryData(summaryResponse);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
      setChartData([]);
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when date range or grouping changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate, grouping]);

  // Draw chart using Canvas API
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate max distance for scaling
    const maxDistance = Math.max(...chartData.map(d => d.distanceDriven || 0));
    if (maxDistance === 0) return;

    // Chart configuration
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / chartData.length * 0.6;
    const barSpacing = chartWidth / chartData.length * 0.4;

    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    const gridLines = 8;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      const value = (maxDistance / gridLines) * (gridLines - i);
      
      // Format value based on size
      let displayValue;
      if (value < 1) {
        displayValue = value.toFixed(2); // Show 2 decimal places for small values
      } else if (value < 10) {
        displayValue = value.toFixed(1); // Show 1 decimal place for medium values
      } else {
        displayValue = Math.round(value).toString(); // Show integer for large values
      }
      
      ctx.fillText(`${displayValue}m`, padding.left - 10, y + 4);
    }

    // Draw bars
    chartData.forEach((data, index) => {
      const x = padding.left + (chartWidth / chartData.length) * index + barSpacing / 2;
      const barHeight = ((data.distanceDriven || 0) / maxDistance) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // Draw bar
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw bar border
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
    });

    // Draw X-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    chartData.forEach((data, index) => {
      const x = padding.left + (chartWidth / chartData.length) * index + (chartWidth / chartData.length) / 2;
      const y = height - padding.bottom + 20;
      
      // Format date for display
      const displayDate = new Date(data.date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
      
      // Draw horizontal text
      ctx.fillText(displayDate, x, y);
    });

  }, [chartData]);

  const filterButtons = [
    'Current week',
    'Last week', 
    'Current month',
    'Last month',
    'Current year',
    'Last year',
    'Latest 7 days',
    'Latest 30 days',
    'Latest 365 days'
  ];

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    
    const today = new Date();
    let start, end;
    
    switch (filter) {
      case 'Current week':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        setGrouping('Day'); // Hiển thị theo ngày
        break;
      case 'Last week':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay() - 7);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        setGrouping('Day'); // Hiển thị theo ngày
        break;
      case 'Current month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setGrouping('Day'); // Hiển thị theo ngày
        break;
      case 'Last month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        setGrouping('Day'); // Hiển thị theo ngày
        break;
      case 'Current year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        setGrouping('Month'); // Hiển thị theo tháng
        break;
      case 'Last year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        setGrouping('Month'); // Hiển thị theo tháng
        break;
      case 'Latest 7 days':
        start = new Date(today);
        start.setDate(today.getDate() - 6);
        end = new Date(today);
        setGrouping('Day'); // Hiển thị theo ngày
        break;
      case 'Latest 30 days':
        start = new Date(today);
        start.setDate(today.getDate() - 29);
        end = new Date(today);
        setGrouping('Day'); // Hiển thị theo ngày
        break;
      case 'Latest 365 days':
        start = new Date(today);
        start.setDate(today.getDate() - 364);
        end = new Date(today);
        setGrouping('Month'); // Hiển thị theo tháng
        break;
      default:
        return;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="analytics">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-title">
          <h2>Analytics</h2>
          <span className="subtitle">Watch charts and statistics for the robot</span>
        </div>
      </div>

      {/* Filter Controls Section */}
      <div className="filter-controls">
        <div className="date-inputs">
                     <div className="form-group-container">
             <span className="form-group-label">
               Start date:
             </span>
             <div className="date-input-wrapper">
               <input className="form-group-input"
                 type="text"
                 id="startDate"
                 placeholder="dd/mm/yyyy"
                 pattern="\d{2}/\d{2}/\d{4}"
                 value={formatDateForDisplay(startDate)}
                 onChange={(e) => {
                   const inputValue = e.target.value;
                   if (inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                     setStartDate(formatDateForInput(inputValue));
                   } else if (inputValue === '') {
                     setStartDate('');
                   }
                 }}
                 onBlur={(e) => {
                   const inputValue = e.target.value;
                   if (inputValue && !inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                     // Reset to current value if invalid format
                     e.target.value = formatDateForDisplay(startDate);
                   }
                 }}
               />
               <span className="calendar-icon"></span>
             </div>
           </div>

           
           <div className="form-group-container">
             <span className="form-group-label">
               End date:
             </span>
             <div className="date-input-wrapper">
               <input className="form-group-input"
                 type="text"
                 id="endDate"
                 placeholder="dd/mm/yyyy"
                 pattern="\d{2}/\d{2}/\d{4}"
                 value={formatDateForDisplay(endDate)}
                 onChange={(e) => {
                   const inputValue = e.target.value;
                   if (inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                     setEndDate(formatDateForInput(inputValue));
                   } else if (inputValue === '') {
                     setEndDate('');
                   }
                 }}
                 onBlur={(e) => {
                   const inputValue = e.target.value;
                   if (inputValue && !inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                     // Reset to current value if invalid format
                     e.target.value = formatDateForDisplay(endDate);
                   }
                 }}
               />
               <span className="calendar-icon"></span>
             </div>
           </div>
          
          <div className="form-group-container">
            <span className="form-group-label">
              Grouping:
            </span>
            <select className="form-group-input"
              value={grouping}
              onChange={(e) => setGrouping(e.target.value)}
            >
                <option value="Day">Day</option>
                <option value="Week">Week</option>
                <option value="Month">Month</option>
                <option value="Year">Year</option>
              </select>
          </div>
        </div>

        <div className="filter-buttons">
          {filterButtons.map((filter) => (
            <button
              key={filter}
              className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => handleFilterClick(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

                    {/* Summary Section */}
       {summaryData && (
         <div className="summary-section">
           <div className="summary-grid">
             <div className="summary-item">
               <div className="summary-value">{summaryData.totalDistance}m</div>
               <div className="summary-label">Total Distance</div>
             </div>
             <div className="summary-item">
               <div className="summary-value">{summaryData.totalUptimeHours}h</div>
               <div className="summary-label">Total Uptime</div>
             </div>
             <div className="summary-item">
               <div className="summary-value">{summaryData.totalDays}</div>
               <div className="summary-label">Total Days</div>
             </div>
             <div className="summary-item">
               <div className="summary-value">{summaryData.avgDistancePerDay}m</div>
               <div className="summary-label">Avg Distance/Day</div>
             </div>
           </div>
         </div>
       )}

       {/* Chart Section */}
       <div className="chart-section">
         <div className="chart-container">
           <div className="chart-legend">
             <div className="legend-item">
               <div className="legend-color distance-driven"></div>
               <span>Distance driven (meters)</span>
             </div>
           </div>
           
           {loading && (
             <div className="loading-container">
               <div className="loading-spinner"></div>
               <p>Loading analytics data...</p>
             </div>
           )}
           
           {error && (
             <div className="error-container">
               <p className="error-message">{error}</p>
             </div>
           )}
           
           {!loading && !error && chartData.length > 0 && (
             <div className="chart-wrapper">
               <canvas 
                 ref={chartRef}
                 className="chart-canvas"
                 width={800}
                 height={300}
               />
             </div>
           )}
           
           {!loading && !error && chartData.length === 0 && (
             <div className="no-data-container">
               <p>No data available for the selected date range</p>
             </div>
           )}
         </div>
       </div>
    </div>
  );
};

export default Analytics;
