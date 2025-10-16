import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import serverConfig from '../../../config/serverConfig';
import Widget from '../../../models/Widget';
import MissionButtonWidget from './MissionButtonWidget/MissionButtonWidget';
import MissionButtonGroupWidget from './MissionButtonGroupWidget/MissionButtonGroupWidget';
import MissionActionLogWidget from './MissionActionLogWidget/MissionActionLogWidget';
import PauseContinueWidget from './PauseContinueWidget/PauseContinueWidget';
import MissionQueueWidget from './MissionQueueWidget/MissionQueueWidget';
import IOStatusWidget from './IOStatusWidget/IOStatusWidget';
import JoystickWidget from './JoystickWidget/JoystickWidget';
import MapWidget from './MapWidget/MapWidget';
import MapLockedWidget from './MapWidget/MapLockedWidget';
import SuccessDialog from '../../common/SuccessDialog';
import ConfirmDialog from '../../common/ConfirmDialog';
import widgetRegistry from './initWidgetRegistry';
import './DesignDashboard.css';

// Create responsive grid layout component
const ResponsiveGridLayout = WidthProvider(Responsive);

const DesignDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { from, dashboardId } = location.state || {};
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingWidget, setEditingWidget] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const [dialogProps, setDialogProps] = useState({});
  const [widgets, setWidgets] = useState([]);
  const widgetsRef = useRef(widgets);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingWidget, setResizingWidget] = useState(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [originalSize, setOriginalSize] = useState({ colspan: 1, rowspan: 1 });
  const [resizePreview, setResizePreview] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const availableWidgets = [
    {
      id: 'map-widget-toolbar',
      title: 'Maps',
      type: 'map',
      icon: 'map-toolbar-icon',
      description: 'Interactive map view',
      dropdownOptions: [
        { id: 'map-single', label: 'Add Map Widget', action: 'map', type: 'map' },
        { id: 'map-locked', label: 'Add Map Locked Widget', action: 'map-locked' }
      ]
    },
    {
      id: 'mission-widget-toolbar',
      title: 'Mission',
      type: 'mission-action-log',
      icon: 'mission-toolbar-icon',
      description: 'Mission-related widgets',
      dropdownOptions: [
        { id: 'mission-action-log', label: 'Add Mission Action Log', action: 'mission-action-log' },
        { id: 'mission-button', label: 'Add Mission Button', action: 'mission-button' },
        { id: 'mission-button-group', label: 'Add Mission Button Group', action: 'mission-button-group' },
        { id: 'mission-queue', label: 'Add Mission Queue', action: 'mission-queue' },
        { id: 'pause-continue', label: 'Add Pause/Continue Button', action: 'pause-continue' }
      ]
    },
    {
      id: 'io-status',
      title: 'I/O status',
      type: 'io-status',
      icon: 'io-status-toolbar-icon',
      description: 'Input/Output status display',
      dropdownOptions: [
        { id: 'io-basic', label: 'Add I/O Status', action: 'io-status' },
        { id: 'io-advanced', label: 'Add Advanced I/O', action: 'io-status-advanced' }
      ]
    },
    {
      id: 'miscellaneous',
      title: 'Miscellaneous',
      type: 'miscellaneous',
      icon: 'miscellaneous-toolbar-icon',
      description: 'Other widgets',
      dropdownOptions: [
        { id: 'joystick', label: 'Add Joystick', action: 'joystick' }
      ]
    }
  ];

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  useEffect(() => {
    if (!loading && widgets.length > 0) {
      const applyTimer = setTimeout(() => {
        widgets.forEach(widget => {
          if (widget.properties && widget.properties.resized) {
            const widgetElement = document.querySelector(`[data-widget-id="${widget.id}"]`);
            if (widgetElement) {
              widgetElement.style.width = `${widget.properties.width}px`;
              widgetElement.style.height = `${widget.properties.height}px`;
              widgetElement.style.minWidth = `${widget.properties.width}px`;
              widgetElement.style.minHeight = `${widget.properties.height}px`;
            } else {
              console.warn('⚠️ Widget element not found after load:', {
                widgetId: widget.id,
                title: widget.title,
                selector: `[data-widget-id="${widget.id}"]`
              });
            }
          }
        });
      }, 200);
      return () => clearTimeout(applyTimer);
    }
  }, [loading, widgets.length]);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  useEffect(() => {}, [isResizing]);

  useEffect(() => {}, [widgets]);

  useEffect(() => {
    const updateGridColumns = () => {
      const gridElement = document.querySelector('.widgets-grid');
    };
    setTimeout(updateGridColumns, 100);
    window.addEventListener('resize', updateGridColumns);
    return () => {
      window.removeEventListener('resize', updateGridColumns);
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
        if (data.properties && data.properties.widgets) {
          const loadedWidgets = data.properties.widgets.map(widgetData => {
            let widget;
            switch (widgetData.type) {
              case 'mission-button':
                widget = MissionButtonWidget.fromJSON(widgetData);
                break;
              case 'mission-action-log':
                widget = MissionActionLogWidget.fromJSON(widgetData);
                break;
              case 'pause-continue':
                widget = PauseContinueWidget.fromJSON(widgetData);
                break;
              case 'mission-queue':
                widget = MissionQueueWidget.fromJSON(widgetData);
                break;
              case 'mission-button-group':
                widget = MissionButtonGroupWidget.fromJSON(widgetData);
                break;
              case 'io-status':
              case 'io-status-2':
                widget = IOStatusWidget.fromJSON(widgetData);
                break;
              case 'joystick':
                widget = JoystickWidget.fromJSON(widgetData);
                break;
              case 'map':
                widget = MapWidget.fromJSON(widgetData);
                break;
              case 'map-locked':
                widget = MapLockedWidget.fromJSON(widgetData);
                break;
              default:
                widget = Widget.fromJSON(widgetData);
            }
            widget.displayMode = 'design';
            return widget;
          });
          setWidgets(loadedWidgets);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (from === 'view') {
      navigate(`/dashboard/view/${dashboardId || id}`);
    } else {
      navigate('/dashboard/list');
    }
  };

  const handleSave = async () => {
    try {
      const widgetsToSave = widgets.map(widget => {
        const { id, type, title, position, rowspan, colspan, settings } = widget;
        return {
          id,
          type,
          title,
          position,
          colspan,
          rowspan,
          settings
        };
      });

      const calculateGridDimensions = (widgets) => {
        if (widgets.length === 0) {
          return { rows: 1, columns: 1 };
        }
        let maxRow = 0;
        let maxCol = 0;
        widgets.forEach(widget => {
          const row = widget.position?.row || 0;
          const col = widget.position?.col || 0;
          const colspan = widget.colspan || 1;
          const rowspan = widget.rowspan || 1;
          maxRow = Math.max(maxRow, row + rowspan);
          maxCol = Math.max(maxCol, col + colspan);
        });
        return {
          rows: maxRow,
          columns: maxCol
        };
      };

      const gridDimensions = calculateGridDimensions(widgetsToSave);
      const updatedProperties = {
        layout: {
          type: 'grid',
          rows: gridDimensions.rows,
          columns: gridDimensions.columns,
          gap: 15
        },
        theme: 'default',
        widgets: widgetsToSave
      };

      const requestData = {
        ...dashboard,
        properties: updatedProperties
      };

      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.text();
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch (e) {
        parsedData = responseData;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to save dashboard';
        if (typeof parsedData === 'object' && parsedData.message) {
          errorMessage = parsedData.message;
        } else if (typeof parsedData === 'string' && parsedData.length > 0) {
          errorMessage = parsedData;
        }
        throw new Error(errorMessage);
      }

      setShowSuccessDialog(true);
      setTimeout(() => {
        setShowSuccessDialog(false);
        if (from === 'view') {
          navigate(`/dashboard/view/${dashboardId || id}`);
        } else {
          navigate('/dashboard/list');
        }
      }, 2000);
    } catch (error) {
      console.error('Error saving dashboard:', error);
      alert(`Failed to save dashboard: ${error.message}`);
    }
  };

  const handleCancel = () => {
    if (from === 'view') {
      navigate(`/dashboard/view/${dashboardId || id}`);
    } else {
      navigate('/dashboard/list');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        window.dispatchEvent(new CustomEvent('dashboardDeleted', {
          detail: { dashboardId: id }
        }));
        if (from === 'view') {
          navigate(`/dashboard/view/${dashboardId || id}`);
        } else {
          navigate('/dashboard/list');
        }
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      alert('Failed to delete dashboard');
    }
  };

  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
  };

  const handleWidgetEdit = (widgetId) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      setEditingWidget(widget);
      const editResult = widgetRegistry.handleWidgetEdit(widget.id, widget);
      if (editResult.hasDialog) {
        const finalDialogProps = {
          ...editResult.dialogProps,
          isOpen: true,
          onClose: handleDialogClose,
          onSave: (data) => handleDialogSave(widget.id, data),
          onDelete: () => handleDialogDelete(widget.id)
        };
        setActiveDialog(() => editResult.dialogComponent);
        setDialogProps(finalDialogProps);
      } else {
        console.log('Widget edit requested but no dialog registered:', widget.type);
      }
    }
  };

  const handleDialogClose = () => {
    setActiveDialog(null);
    setDialogProps({});
    setEditingWidget(null);
  };

  const handleDialogSave = (widgetId, data) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget => {
        if (widget.id === widgetId) {
          const updatedWidget = widget.clone();
          if (typeof updatedWidget.updateSettings === 'function') {
            updatedWidget.updateSettings(data);
          } else {
            Object.assign(updatedWidget, data);
          }
          return updatedWidget;
        }
        return widget;
      })
    );
    handleDialogClose();
  };

  const handleDialogDelete = (widgetId) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    widgetRegistry.handleWidgetDelete(widgetId);
    handleDialogClose();
  };

  const handleWidgetExpand = (widgetId) => {
    // Handle widget expand functionality
  };

  const handleWidgetClick = (widgetId) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      console.log('Widget clicked:', widget.title);
    }
  };

  // Convert widgets to react-grid-layout format
  const getLayout = () => {
    return widgets.map(widget => ({
      i: widget.id,
      x: widget.position.col,
      y: widget.position.row,
      w: widget.colspan || 1,
      h: widget.rowspan || 1,
      minW: 1,
      minH: 1,
      maxW: 4,
      maxH: 10
    }));
  };

  // Handle layout change from react-grid-layout
  const onLayoutChange = (layout) => {
    console.log('🔧 Layout changed:', layout);
    
    // Sort layout by position to maintain order
    const sortedLayout = [...layout].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => {
        const layoutItem = sortedLayout.find(item => item.i === widget.id);
        if (layoutItem) {
          const updatedWidget = widget.clone();
          
          // Ensure position is within bounds
          const newRow = Math.max(0, Math.min(layoutItem.y, 9)); // Max 10 rows (0-9)
          const newCol = Math.max(0, Math.min(layoutItem.x, 3)); // Max 4 cols (0-3)
          
          // Ensure size doesn't exceed bounds
          const maxW = 4 - newCol; // Remaining columns from position
          const maxH = 10 - newRow; // Remaining rows from position
          const newW = Math.max(1, Math.min(layoutItem.w, maxW));
          const newH = Math.max(1, Math.min(layoutItem.h, maxH));
          
          updatedWidget.position = { 
            row: newRow, 
            col: newCol 
          };
          updatedWidget.colspan = newW;
          updatedWidget.rowspan = newH;
          
          console.log('🔧 Widget updated:', {
            id: widget.id,
            oldPos: { row: widget.position.row, col: widget.position.col },
            newPos: { row: newRow, col: newCol },
            oldSize: { w: widget.colspan, h: widget.rowspan },
            newSize: { w: newW, h: newH }
          });
          
          return updatedWidget;
        }
        return widget;
      })
    );
  };

  // Add event delegation for touch events
  useEffect(() => {
    const handleTouchEvent = (e) => {
      const editBtn = e.target.closest('.widget-edit-btn');
      if (editBtn) {
        const widgetId = editBtn.getAttribute('data-widget-id') || 
                        editBtn.closest('.widget-item')?.getAttribute('data-widget-id');
        if (widgetId) {
          console.log('🔧 Touch event delegation triggered for widget:', widgetId);
          e.preventDefault();
          e.stopPropagation();
          handleWidgetEdit(widgetId);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchEvent, { passive: false, capture: true });
    document.addEventListener('touchend', handleTouchEvent, { passive: false, capture: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchEvent, { capture: true });
      document.removeEventListener('touchend', handleTouchEvent, { capture: true });
    };
  }, []);



  // Handle resize mouse down (keep this for resize functionality)
  const handleResizeMouseDown = (e, widgetId) => {
    e.preventDefault();
    e.stopPropagation();

    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const widgetElement = e.currentTarget.closest('.widget-item');
    if (!widgetElement) return;

    setResizingWidget(widget);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setOriginalSize({
      colspan: widget.colspan || 1,
      rowspan: widget.rowspan || 1
    });
    setIsResizing(true);

    widgetElement.classList.add('resizing');
    console.log('✅ Resize mode activated');
  };

  // Remove old drag & drop logic - now handled by react-beautiful-dnd

  useEffect(() => {
    const handleGlobalResizeMouseMove = (e) => {
      if (!isResizing || !resizingWidget) return;
      let clientX, clientY;
      if (e.type === 'touchmove' && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (err) {}
      const gridElement = document.querySelector('.widgets-grid');
      if (!gridElement) return;
      const gridRect = gridElement.getBoundingClientRect();
      const widgetElements = document.querySelectorAll('.widget-item');
      if (!widgetElements.length) return;
      const singleCellWidget = Array.from(widgetElements).find(el => {
        const colspan = el.getAttribute('data-colspan');
        const rowspan = el.getAttribute('data-rowspan');
        return colspan === '1' && rowspan === '1';
      });
      const referenceWidget = singleCellWidget || widgetElements[0];
      const referenceRect = referenceWidget.getBoundingClientRect();
      const referenceColspan = parseInt(referenceWidget.getAttribute('data-colspan')) || 1;
      const referenceRowspan = parseInt(referenceWidget.getAttribute('data-rowspan')) || 1;
      const gridStyles = window.getComputedStyle(gridElement);
      const gap = parseInt(gridStyles.gap) || 15;
      const cellWidth = (referenceRect.width + gap) / referenceColspan;
      const cellHeight = (referenceRect.height + gap) / referenceRowspan;
      const mouseX = clientX - gridRect.left;
      const mouseY = clientY - gridRect.top;
      const mouseCol = Math.floor(mouseX / cellWidth);
      const mouseRow = Math.floor(mouseY / cellHeight);
      const widgetCol = resizingWidget.position.col;
      const widgetRow = resizingWidget.position.row;
      const currentColspan = resizingWidget.colspan || 1;
      let newColspan;
      if (mouseCol >= widgetCol) {
        newColspan = mouseCol - widgetCol + 1;
      } else {
        newColspan = currentColspan;
      }
      let newRowspan = Math.max(1, mouseRow - widgetRow + 1);
      newColspan = Math.min(4 - widgetCol, Math.max(1, newColspan));
      newRowspan = Math.min(10 - widgetRow, Math.max(1, newRowspan));
      const currentRowspan = resizingWidget.rowspan || 1;
      const hasChanges = (newColspan !== currentColspan) || (newRowspan !== currentRowspan);
      const canResizeHorizontal = canWidgetResizeHorizontal(resizingWidget, newColspan);
      const canResizeVertical = canWidgetResizeVertical(resizingWidget, newRowspan);
      const widgetElement = document.querySelector(`[data-widget-id="${resizingWidget.id}"]`);
      if (widgetElement) {
        if (hasChanges) {
          const isValidResize = canResizeHorizontal && canResizeVertical;
          if (isValidResize) {
            setWidgets(prevWidgets =>
              prevWidgets.map(w => {
                if (w.id === resizingWidget.id) {
                  const cloned = w.clone();
                  cloned.colspan = newColspan;
                  cloned.rowspan = newRowspan;
                  return cloned;
                }
                return w;
              })
            );
            setResizingWidget(prev => ({
              ...prev,
              colspan: newColspan,
              rowspan: newRowspan,
              position: {
                ...prev.position
              },
              render: prev.render
            }));
          }
        }
      }
    };

    const handleGlobalResizeMouseUp = (e) => {
      if (!isResizing || !resizingWidget) return;
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.resizing').forEach(el => {
        el.classList.remove('resizing');
      });
      setIsResizing(false);
      setResizingWidget(null);
      setResizeStartPos({ x: 0, y: 0 });
      setOriginalSize({ colspan: 1, rowspan: 1 });
      setResizePreview(null);
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };

    // Create resize touch handlers outside the condition
    const resizeTouchMoveHandler = (e) => {
      console.log('🔧 Resize touch move handler called');
      e.preventDefault();
      handleGlobalResizeMouseMove(e);
    };

    const resizeTouchEndHandler = (e) => {
      console.log('🔧 Resize touch end handler called');
      e.preventDefault();
      handleGlobalResizeMouseUp(e);
    };

    if (isResizing) {
      console.log('🔧 Adding event listeners for resizing');
      document.addEventListener('mousemove', handleGlobalResizeMouseMove);
      document.addEventListener('mouseup', handleGlobalResizeMouseUp);
      document.addEventListener('touchmove', resizeTouchMoveHandler, { passive: false, capture: true });
      document.addEventListener('touchend', resizeTouchEndHandler, { passive: false, capture: true });
      
      return () => {
        console.log('🔧 Removing resize event listeners');
        document.removeEventListener('mousemove', handleGlobalResizeMouseMove);
        document.removeEventListener('mouseup', handleGlobalResizeMouseUp);
        document.removeEventListener('touchmove', resizeTouchMoveHandler, { passive: false, capture: true });
        document.removeEventListener('touchend', resizeTouchEndHandler, { passive: false, capture: true });
      };
    }
  }, [isResizing, resizingWidget, resizeStartPos, originalSize, resizePreview, widgets]);

  const calculateGridDimensionsFromWidgets = (widgets) => {
    if (widgets.length === 0) {
      return { rows: 1, columns: 1 };
    }
    let maxRow = 0;
    let maxCol = 0;
    widgets.forEach(widget => {
      const endRow = widget.position.row + (widget.rowspan || 1);
      const endCol = widget.position.col + (widget.colspan || 1);
      if (endRow > maxRow) {
        maxRow = endRow;
      }
      if (endCol > maxCol) {
        maxCol = endCol;
      }
    });
    return {
      rows: maxRow,
      columns: Math.max(maxCol, 4)
    };
  };

  const handleAddWidgetFromSidebar = (widgetType) => {
    const currentDimensions = calculateGridDimensionsFromWidgets(widgets);
    const findEmptyPosition = () => {
      const gridRows = currentDimensions.rows;
      const gridColumns = currentDimensions.columns;
      const occupancyGrid = Array(gridRows)
        .fill(null)
        .map(() => Array(gridColumns).fill(false));
      widgets.forEach(widget => {
        const { row, col } = widget.position;
        const rowspan = widget.rowspan || 1;
        const colspan = widget.colspan || 1;
        for (let r = row; r < row + rowspan && r < gridRows; r++) {
          for (let c = col; c < col + colspan && c < gridColumns; c++) {
            if (r >= 0 && c >= 0) {
              occupancyGrid[r][c] = true;
            }
          }
        }
      });
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridColumns; col++) {
          if (!occupancyGrid[row][col]) {
            return { row, col };
          }
        }
      }
      return { row: gridRows, col: 0 };
    };
    const position = findEmptyPosition();
    const config = { id: uuidv4(), position: { row: position.row, col: position.col }, displayMode: 'design' };
    let newWidgetInstance;
    switch (widgetType) {
      case 'mission-action-log':
        newWidgetInstance = new MissionActionLogWidget(config);
        break;
      case 'mission-button':
        newWidgetInstance = new MissionButtonWidget(config);
        break;
      case 'mission-button-group':
        newWidgetInstance = new MissionButtonGroupWidget(config);
        break;
      case 'mission-queue':
        newWidgetInstance = new MissionQueueWidget(config);
        break;
      case 'pause-continue':
        newWidgetInstance = new PauseContinueWidget(config);
        break;
      case 'io-status':
        newWidgetInstance = new IOStatusWidget(config);
        break;
      case 'map':
        newWidgetInstance = new MapWidget(config);
        break;
      case 'map-locked':
        newWidgetInstance = new MapLockedWidget(config);
        break;
      case 'joystick':
        newWidgetInstance = new JoystickWidget(config);
        break;
      default:
        newWidgetInstance = new Widget({ ...config, type: widgetType });
    }
    setWidgets(prevWidgets => {
      const newWidgets = [...prevWidgets, newWidgetInstance];
      return newWidgets;
    });
  };

  const handleResizeTouchStart = (e, widgetId) => {
    console.log('🔧 Resize touch start detected for widget:', widgetId);

    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) {
      console.log('❌ Widget not found for resize');
      return;
    }

    const widgetElement = e.currentTarget.closest('.widget-item');
    if (!widgetElement) {
      console.log('❌ Widget element not found');
      return;
    }

    const touch = e.touches[0];
    setResizingWidget(widget);
    setResizeStartPos({ x: touch.clientX, y: touch.clientY });
    setOriginalSize({
      colspan: widget.colspan || 1,
      rowspan: widget.rowspan || 1
    });
    setIsResizing(true);

    widgetElement.classList.add('resizing');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    console.log('✅ Resize mode activated (touch)');
  };

  // Check if widget can resize horizontally
  const canWidgetResizeHorizontal = (widget, newColspan) => {
    const { row, col } = widget.position;
    const currentColspan = widget.colspan || 1;
    const rowspan = widget.rowspan || 1;

    if (newColspan <= currentColspan) {
      return true;
    }

    if (col + newColspan > 4) {
      return false;
    }

    const overlappingWidgets = widgets.filter(w =>
      w.id !== widget.id &&
      w.position.row < row + rowspan &&
      w.position.row + (w.rowspan || 1) > row &&
      w.position.col < col + newColspan &&
      w.position.col + (w.colspan || 1) > col
    );

    return overlappingWidgets.length === 0;
  };

  // Check if widget can resize vertically
  const canWidgetResizeVertical = (widget, newRowspan) => {
    const { row, col } = widget.position;
    const currentRowspan = widget.rowspan || 1;
    const colspan = widget.colspan || 1;

    if (newRowspan <= currentRowspan) {
      return true;
    }

    if (row + newRowspan > 10) {
      return false;
    }

    const overlappingWidgets = widgets.filter(w =>
      w.id !== widget.id &&
      w.position.col < col + colspan &&
      w.position.col + (w.colspan || 1) > col &&
      w.position.row < row + newRowspan &&
      w.position.row + (w.rowspan || 1) > row
    );

    return overlappingWidgets.length === 0;
  };

  const updateWidgetColspan = (widgetId, newColspan) => {
    setWidgets(prevWidgets => {
      return prevWidgets.map(widget => {
        if (widget.id === widgetId) {
          return {
            ...widget,
            position: {
              ...widget.position,
              colspan: newColspan
            }
          };
        }
        return widget;
      });
    });
  };

  const WidgetRenderer = ({ widget }) => {
    if (widget.render) {
      return widget.render(handleWidgetEdit);
    } else {
      return (
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{widget.title}</h3>
            <p className="widget-settings">{"No setting"}</p>
          </div>
          <button
            className="widget-edit-btn no-drag"
            onClick={(e) => {
              e.stopPropagation();
              handleWidgetEdit(widget.id);
            }}
          >
            <span className="edit-icon"></span>
          </button>
        </div>
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.widget-item-toolbar')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleDropdownToggle = (widgetId) => {
    setOpenDropdown(openDropdown === widgetId ? null : widgetId);
  };

  const handleDropdownOptionSelect = (action) => {
    setOpenDropdown(null);
    switch (action) {
      case 'map':
        handleAddWidgetFromSidebar('map');
        break;
      case 'map-locked':
        handleAddWidgetFromSidebar('map-locked');
        break;
      case 'mission-action-log':
        handleAddWidgetFromSidebar('mission-action-log');
        break;
      case 'mission-button':
        handleAddWidgetFromSidebar('mission-button');
        break;
      case 'mission-button-group':
        handleAddWidgetFromSidebar('mission-button-group');
        break;
      case 'mission-queue':
        handleAddWidgetFromSidebar('mission-queue');
        break;
      case 'pause-continue':
        handleAddWidgetFromSidebar('pause-continue');
        break;
      case 'io-status':
        handleAddWidgetFromSidebar('io-status');
        break;
      case 'joystick':
        handleAddWidgetFromSidebar('joystick');
        break;
      default:
        const widgetType = action.replace('-advanced', '').replace('-priority', '').replace('-group', '').replace('-fullwidth', '');
        handleAddWidgetFromSidebar(widgetType);
    }
  };

  if (loading) {
    return <div className="design-dashboard-loading">Loading...</div>;
  }
  const renderActiveDialog = () => {
    if (!activeDialog || !dialogProps.isOpen) {
      return null;
    }
    const DialogComponent = activeDialog;
    return <DialogComponent {...dialogProps} />;
  };

  return (
    <div className="design-dashboard-container">
      <div className="widget-toolbar">
        <div className="widget-toolbar-content">
          <div className="widget-list">
            {availableWidgets.map((widget) => (
              <div
                key={widget.id}
                className={`widget-item-toolbar ${openDropdown === widget.id ? 'dropdown-open' : ''}`}
                onClick={() => handleDropdownToggle(widget.id)}
                title={widget.description}
              >
                <div className={`widget-icon ${typeof widget.icon === 'string' && !widget.icon.includes('️') ? widget.icon : ''}`}>
                  {typeof widget.icon === 'string' && !widget.icon.includes('️') ? '' : widget.icon}
                </div>
                <span className="widget-title">{widget.title}</span>
                {openDropdown === widget.id && (
                  <div className="widget-dropdown-menu">
                    {widget.dropdownOptions.map((option) => (
                      <div
                        key={option.id}
                        className="widget-dropdown-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropdownOptionSelect(option.action);
                        }}
                      >
                        <div className="dropdown-option-icon"></div>
                        <span className="dropdown-option-label">{option.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="page-header">
        <div className="header-title">
          <h2>{dashboard?.name || 'Dashboard Design'}</h2>
          <span className="subtitle">Design the dashboard.</span>
        </div>
        <div className="header-actions">
          <button className="btn-save" onClick={handleSave}>
            <span className="save-icon"></span>
            Save
          </button>
          <button className="btn-cancel" onClick={handleCancel}>
            <span className="cancel-icon"></span>
            Cancel
          </button>
          <button className="btn-delete" onClick={openDeleteConfirm}>
            <span className="delete-icon-white"></span>
            Delete
          </button>
        </div>
      </div>
        <div className="design-dashboard-content">
          <ResponsiveGridLayout
            className="widgets-grid"
            layouts={{ 
              lg: getLayout(), 
              md: getLayout(), 
              sm: getLayout(), 
              xs: getLayout(), 
              xxs: getLayout() 
            }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 4, md: 4, sm: 4, xs: 4, xxs: 4 }}
            rowHeight={120}
            onLayoutChange={onLayoutChange}
            isDraggable={true}
            isResizable={true}
            margin={[15, 15]}
            containerPadding={[15, 15]}
            useCSSTransforms={true}
            preventCollision={false}
            compactType="vertical"
            allowOverlap={false}
            isBounded={false}
            verticalCompact={true}
            compactVertical={true}
          >
              {widgets.map((widget) => (
                <div key={widget.id} className="widget-item" data-widget-id={widget.id}>
                  <WidgetRenderer widget={widget} />
                  {!(widget.canHandleOwnEdit && widget.canHandleOwnEdit()) && (
                    <div
                      className="widget-edit-btn"
                      data-widget-id={widget.id}
                      onClick={(e) => {
                        console.log('🔧 Edit button clicked!', widget.id);
                        e.stopPropagation();
                        e.preventDefault();
                        handleWidgetEdit(widget.id);
                      }}
                      onMouseDown={(e) => {
                        console.log('🔧 Edit button mouse down!', widget.id);
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onTouchStart={(e) => {
                        console.log('🔧 Edit button touch start!', widget.id);
                        e.stopPropagation();
                        e.preventDefault();
                        // Handle touch immediately
                        handleWidgetEdit(widget.id);
                      }}
                      onTouchEnd={(e) => {
                        console.log('🔧 Edit button touch end!', widget.id);
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onTouchMove={(e) => {
                        console.log('🔧 Edit button touch move!', widget.id);
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onPointerDown={(e) => {
                        console.log('🔧 Edit button pointer down!', widget.id);
                        e.stopPropagation();
                        e.preventDefault();
                        // Handle pointer events (includes touch)
                        if (e.pointerType === 'touch') {
                          handleWidgetEdit(widget.id);
                        }
                      }}
                      onPointerUp={(e) => {
                        console.log('🔧 Edit button pointer up!', widget.id);
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      title="Edit widget"
                    >
                      <span className="edit-icon"></span>
                    </div>
                  )}
                </div>
              ))}
          </ResponsiveGridLayout>
        </div>
      {renderActiveDialog()}
      <SuccessDialog
        visible={showSuccessDialog}
        title="Success"
        message="Dashboard saved successfully!"
        details="All widgets and their configurations have been saved to the database."
        onClose={() => setShowSuccessDialog(false)}
        buttonText="OK"
      />
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Confirm Delete"
        message={`Are you sure you want to delete dashboard "${dashboard?.name || 'Dashboard'}"?`}
        onConfirm={() => {
          handleDelete();
          closeDeleteConfirm();
        }}
        onCancel={closeDeleteConfirm}
      />
    </div>
  );
};
export default DesignDashboard;