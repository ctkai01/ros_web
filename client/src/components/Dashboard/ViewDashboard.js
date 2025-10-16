import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import serverConfig from '../../config/serverConfig';
import MissionButtonWidget from './DesignDashboard/MissionButtonWidget/MissionButtonWidget';
import MissionButtonGroupWidget from './DesignDashboard/MissionButtonGroupWidget/MissionButtonGroupWidget';
import MissionActionLogWidget from './DesignDashboard/MissionActionLogWidget/MissionActionLogWidget';
import PauseContinueWidget from './DesignDashboard/PauseContinueWidget/PauseContinueWidget';
import MissionQueueWidget from './DesignDashboard/MissionQueueWidget/MissionQueueWidget';
import IOStatusWidget from './DesignDashboard/IOStatusWidget/IOStatusWidget';
import JoystickWidget from './DesignDashboard/JoystickWidget/JoystickWidget';
import MapWidget from './DesignDashboard/MapWidget/MapWidget';
import MapLockedWidget from './DesignDashboard/MapWidget/MapLockedWidget';
import Widget from '../../models/Widget';
import './ViewDashboard.css';
const WidgetRenderer = React.memo(({ widget }) => {
  console.log(`Rendering widget: ${widget.title}`); // Bạn có thể thêm log này để xem hiệu quả
  if (widget.render) {
    return widget.render();
  } else {
    // Fallback render for generic widgets
    return (
      <div className="widget-header">
        <div className="widget-info">
          <h3 className="dashboard-widget-title">{widget.title}</h3>
          <p className="widget-settings">{widget.settings}</p>
        </div>
      </div>
    );
  }
});
const ViewDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("ViewDashboard rendering with widgets:");
    fetchDashboard();
  }, [id]);
  
  // Apply saved sizes sau khi widgets được load từ database
  useEffect(() => {
    if (!loading && widgets.length > 0) {
      // Delay để đảm bảo DOM đã render hoàn toàn
      const applyTimer = setTimeout(() => {
        console.log('=== ViewDashboard APPLYING SIZES ===');
        
        widgets.forEach(widget => {
          const hasCustomSize = widget.hasCustomSize ? widget.hasCustomSize() : 
                               (widget.properties && widget.properties.resized);
          
          if (hasCustomSize) {
            const widgetElement = document.querySelector(`[data-widget-id="${widget.id}"]`);
            if (widgetElement) {
              const customSize = widget.getSize ? widget.getSize() : 
                               (widget.properties && widget.properties.resized ? 
                                { width: widget.properties.width, height: widget.properties.height } : null);
              
              if (customSize) {
                widgetElement.style.width = `${customSize.width}px`;
                widgetElement.style.height = `${customSize.height}px`;
                widgetElement.style.minWidth = `${customSize.width}px`;
                widgetElement.style.minHeight = `${customSize.height}px`;
                
                console.log(`✅ Applied DOM size to widget ${widget.id}:`, {
                  width: customSize.width,
                  height: customSize.height,
                  type: widget.type,
                  title: widget.title
                });
              }
            } else {
              console.warn('⚠️ Widget element not found for size application:', {
                widgetId: widget.id,
                title: widget.title,
                selector: `[data-widget-id="${widget.id}"]`
              });
            }
          }
        });
      }, 300); // Delay 300ms sau khi loading hoàn tất
      
      return () => clearTimeout(applyTimer);
    }
  }, [loading, widgets.length]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/dashboards/${id}`
      );
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);

        // Load widgets from database if available
        if (data.properties && data.properties.widgets) {
          const loadedWidgets = data.properties.widgets.map((widgetData) => {
            let widget;
            switch (widgetData.type) {
              case "mission-button":
                widget = MissionButtonWidget.fromJSON(widgetData);
                break;
              case "mission-button-group":
                widget = MissionButtonGroupWidget.fromJSON(widgetData);
                break;
              case "mission-action-log":
                widget = MissionActionLogWidget.fromJSON(widgetData);
                break;
              case "pause-continue":
                widget = PauseContinueWidget.fromJSON(widgetData);
                break;
              case "mission-queue":
                widget = MissionQueueWidget.fromJSON(widgetData);
                break;
              case "io-status":
              case "io-status-2":
                widget = IOStatusWidget.fromJSON(widgetData);
                break;
              case "joystick":
                widget = JoystickWidget.fromJSON(widgetData);
                break;
              case "map":
                widget = MapWidget.fromJSON(widgetData);
                console.log("mapwidget", widgetData);
                break;
              case "map-locked":
                widget = MapLockedWidget.fromJSON(widgetData);
                break;
              default:
                widget = Widget.fromJSON(widgetData);
            }

            // Set widget to display mode
            if (widget && widget.setDisplayMode) {
              widget.setDisplayMode();
            }

            return widget;
          });

          setWidgets(loadedWidgets);

          // Debug: Log loaded widgets with size info
          console.log("=== ViewDashboard LOADED WIDGETS ===");
          console.log("Dashboard layout:", data.properties?.layout);
          loadedWidgets.forEach((widget) => {
            console.log(`Widget ${widget.id} (${widget.type}):`, {
              title: widget.title,
              position: widget.position,
              colspan: widget.colspan,
              rowspan: widget.rowspan,
              hasProperties: !!widget.properties,
              hasResized: widget.properties?.resized,
              savedSize: widget.properties?.resized
                ? {
                    width: widget.properties.width,
                    height: widget.properties.height,
                  }
                : null,
              hasCustomSizeMethod: typeof widget.hasCustomSize === "function",
              hasGetSizeMethod: typeof widget.getSize === "function",
            });
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard/list');
  };

  const handleEdit = () => {
    navigate(`/dashboard/design/${id}`, { 
      state: { from: 'view', dashboardId: id } 
    });
  };
  // const WidgetRenderer = React.memo(({ widget }) => {
  //   if (widget.render) {
  //     return widget.render();
  //   } else {
  //     // Fallback render for generic widgets
  //     return (
  //       <div className="widget-header">
  //         <div className="widget-info">
  //           <h3 className="dashboard-widget-title">{widget.title}</h3>
  //           <p className="widget-settings">{widget.settings}</p>
  //         </div>
  //       </div>
  //     );
  //   }
  // });

  if (loading) {
    return <div className="view-dashboard-loading">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="view-dashboard-error">Dashboard not found</div>;
  }

  return (
    <div className="view-dashboard-container">
      <div className="view-dashboard-header">
        <div className="header-left">
          <h1>Dashboard: {dashboard.name}</h1>
          <span className="dashboard-subtitle">| Contains {widgets.length} widget(s)</span>
        </div>
        <div className="header-actions">
          <a href="#" className="dashboard-link" onClick={(e) => { e.preventDefault(); handleEdit(); }}>
            Open in DashboardDesigner 
          </a>
        </div>
      </div>

      <div className="view-dashboard-content">
        <div 
          className="widgets-grid"
        >
          {widgets.map((widget) => {
            const widgetStyle = {
              gridRow: `${widget.position.row + 1} / span ${widget.rowspan || 1}`,
              gridColumn: `${widget.position.col + 1} / span ${widget.colspan || 1}`
            };

            // Debug log for grid positioning
            console.log(`Widget ${widget.id} grid positioning:`, {
              type: widget.type,
              title: widget.title,
              position: widget.position,
              colspan: widget.colspan,
              rowspan: widget.rowspan,
              gridRow: widgetStyle.gridRow,
              gridColumn: widgetStyle.gridColumn
            });
            
            // Apply custom size if widget has been resized (match DesignDashboard logic)
            const hasCustomSize = widget.properties && widget.properties.resized;
            
            if (hasCustomSize) {
              const customSize = widget.properties && widget.properties.resized ? {
                width: widget.properties.width,
                height: widget.properties.height
              } : null;
              
              if (customSize) {
                widgetStyle.width = `${customSize.width}px`;
                widgetStyle.height = `${customSize.height}px`;
                widgetStyle.minWidth = `${customSize.width}px`;
                widgetStyle.minHeight = `${customSize.height}px`;
                
                // Debug log for applied sizes
                console.log(`Applied custom size to widget ${widget.id}:`, {
                  width: customSize.width,
                  height: customSize.height,
                  type: widget.type,
                  title: widget.title
                });
              }
            }
            
            return (
              <div
                key={widget.id}
                className={`widget-item ${widget.rowspan ? `rowspan-${widget.rowspan}` : ''}`}
                style={widgetStyle}
                data-widget-id={widget.id}
              >
                <WidgetRenderer widget={widget} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// export default ViewDashboard; 
export default React.memo(ViewDashboard);