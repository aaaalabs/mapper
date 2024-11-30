import { MapStyle } from '../types/map';
import { mapStyles } from './mapStyles';

interface MapConfig {
  currentZoom: number;
  viewportSize: { width: number; height: number };
  mapPurpose: 'community' | 'navigation' | 'analytics';
  minZoom: number;
  maxZoom: number;
}

interface StyleMetrics {
  loadTime: number;
  contrastRatio: number;
  featureVisibility: number;
  readabilityScore: number;
}

function calculateContrastRatio(style: MapStyle): number {
  // Simplified contrast calculation
  const backgroundLuminance = getLuminance(style.popupStyle.background);
  const textLuminance = getLuminance(style.popupStyle.text);
  return Math.max(backgroundLuminance, textLuminance) / Math.min(backgroundLuminance, textLuminance);
}

function getLuminance(color: string): number {
  // Basic luminance calculation for hex colors
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function evaluateStyle(style: MapStyle, config: MapConfig): StyleMetrics {
  const contrastRatio = calculateContrastRatio(style);
  
  // Calculate readability score based on zoom level
  const readabilityScore = Math.min(
    1,
    (config.currentZoom - config.minZoom) / (config.maxZoom - config.minZoom)
  ) * 100;

  // Estimate feature visibility based on style characteristics
  const featureVisibility = style.id === 'satellite' ? 90 :
    style.id === 'terrain' ? 85 :
    style.id === 'standard' ? 80 :
    style.id === 'dark' ? 75 : 70;

  // Simulate load time based on tile complexity
  const loadTime = style.id === 'satellite' ? 1800 :
    style.id === 'terrain' ? 1200 :
    style.id === 'hybrid' ? 1500 : 800;

  return {
    loadTime,
    contrastRatio,
    featureVisibility,
    readabilityScore
  };
}

function selectOptimalStyle(config: MapConfig): { styleId: string; metrics: StyleMetrics } {
  let bestScore = -1;
  let selectedStyle: MapStyle = mapStyles.standard;
  let bestMetrics: StyleMetrics = {} as StyleMetrics;

  for (const [id, style] of Object.entries(mapStyles)) {
    const metrics = evaluateStyle(style, config);
    
    // Calculate weighted score based on requirements
    const loadTimeScore = Math.max(0, 1 - metrics.loadTime / 2000) * 25;
    const contrastScore = (metrics.contrastRatio >= 4.5 ? 1 : 0) * 25;
    const visibilityScore = (metrics.featureVisibility / 100) * 25;
    const readabilityScore = (metrics.readabilityScore / 100) * 25;
    
    const totalScore = loadTimeScore + contrastScore + visibilityScore + readabilityScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      selectedStyle = style;
      bestMetrics = metrics;
    }
  }

  return {
    styleId: selectedStyle.id,
    metrics: bestMetrics
  };
}

export function initializeMap(config: MapConfig) {
  const { styleId, metrics } = selectOptimalStyle(config);
  
  // Preload tile resources for faster initial render
  const style = mapStyles[styleId];
  const preloadTile = new Image();
  preloadTile.src = style.url
    .replace('{s}', 'a')
    .replace('{z}', config.currentZoom.toString())
    .replace('{x}', '0')
    .replace('{y}', '0');

  return {
    styleId,
    style: mapStyles[styleId],
    metrics,
    loadTime: metrics.loadTime,
  };
}