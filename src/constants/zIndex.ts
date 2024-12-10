/**
 * Z-index constants for consistent layering across the application
 * 
 * Guidelines:
 * - Base elements: 0-99
 * - Overlays and controls: 100-999
 * - Modals and dropdowns: 1000-1999
 * - Tooltips and notifications: 2000-2999
 * - Critical UI (loading, errors): 3000+
 */

export const Z_INDEX = {
  // Base map elements
  MAP_BASE: 0,
  MAP_MARKERS: 50,
  
  // Map controls and overlays
  MAP_CONTROLS: 1000,
  MAP_SEARCH: 1000,
  MAP_BUTTONS: 1000,
  
  // Modals and dropdowns
  MODAL_BACKDROP: 1500,
  MODAL_CONTENT: 1600,
  DROPDOWN_MENU: 1700,
  
  // Tooltips and notifications
  TOOLTIP: 2000,
  NOTIFICATION: 2500,
  
  // Critical UI elements
  LOADING_OVERLAY: 3000,
  ERROR_MESSAGE: 3100,
} as const;
