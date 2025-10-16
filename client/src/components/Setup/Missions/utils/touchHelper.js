/**
 * Touch helper utilities for mission action buttons
 */
import React from 'react';

/**
 * Creates touch event handlers that simulate click events
 * @param {Function} onClickHandler - The original onClick handler
 * @returns {Object} Touch event handlers
 */
export const createTouchHandlers = (onClickHandler) => {
  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouchHandled = false;

  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartTime = Date.now();
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isTouchHandled = false;
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 1 && !isTouchHandled) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX);
      const deltaY = Math.abs(touch.clientY - touchStartY);
      
      // If moved more than 10px, cancel the touch
      if (deltaX > 10 || deltaY > 10) {
        isTouchHandled = true;
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isTouchHandled && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaTime = Date.now() - touchStartTime;
      const deltaX = Math.abs(touch.clientX - touchStartX);
      const deltaY = Math.abs(touch.clientY - touchStartY);
      
      // Only trigger click if touch was short and didn't move much
      if (deltaTime < 500 && deltaX < 10 && deltaY < 10) {
        // Create synthetic click event
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          currentTarget: e.currentTarget,
          target: e.target,
          type: 'click'
        };
        
        onClickHandler(syntheticEvent);
      }
    }
    
    // Reset state
    isTouchHandled = false;
    touchStartTime = 0;
    touchStartX = 0;
    touchStartY = 0;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

/**
 * Higher-order component that adds touch support to any component with onClick
 * @param {React.Component} WrappedComponent - Component to wrap
 * @returns {React.Component} Component with touch support
 */
export const withTouchSupport = (WrappedComponent) => {
  return React.forwardRef((props, ref) => {
    const { onClick, ...otherProps } = props;
    
    if (!onClick) {
      return <WrappedComponent ref={ref} {...props} />;
    }
    
    const touchHandlers = createTouchHandlers(onClick);
    
    return (
      <WrappedComponent
        ref={ref}
        {...otherProps}
        onClick={onClick}
        {...touchHandlers}
      />
    );
  });
};

/**
 * Hook for adding touch support to buttons
 * @param {Function} onClickHandler - Click handler function
 * @returns {Object} Touch event handlers
 */
export const useTouchSupport = (onClickHandler) => {
  return createTouchHandlers(onClickHandler);
};
