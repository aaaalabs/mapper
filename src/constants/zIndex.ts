/**
 * Z-index constants for consistent layering across the application
 * 
 * Guidelines:
 * - Base elements: 0-99
 * - Overlays and controls: 100-999
 * - Map UI elements: 1000-1499
 * - Modals and dropdowns: 1500-1999
 * - Tooltips and notifications: 2000-2999
 * - Critical UI (loading, errors): 3000+
 */

export const Z_INDEX = {
  // Base map elements
  MAP_BASE: 0,
  MAP_MARKERS: 50,
  
  // Map controls and overlays
  MAP_CONTROLS: 1000,
  MAP_SEARCH: 1100,
  MAP_BUTTONS: 1200,
  MAP_SETTINGS: 1300,
  
  // Modals and dropdowns
  MODAL_BACKDROP: 1500,
  MODAL_CONTENT: 1600,
  DROPDOWN_MENU: 1700,
  
  // Auth modals (should be above regular modals)
  AUTH_MODAL_BACKDROP: 2000,
  AUTH_MODAL_CONTENT: 2100,
  
  // Tooltips and notifications
  TOOLTIP: 2500,
  NOTIFICATION: 2600,
  
  // Critical UI elements
  LOADING_OVERLAY: 3000,
  ERROR_MESSAGE: 3100,
} as const;
