export interface MapPopupStyle {
  background: string;
  text: string;
  border: string;
  shadow: string;
}

export interface MapStyle {
  id: string;
  markerStyle: 'pins' | 'photos';
  popupStyle: MapPopupStyle;
}

export interface MapFeatures {
  enableClustering: boolean;
  enableFullscreen: boolean;
  enableSharing: boolean;
  enableSearch: boolean;
}

export interface MapCustomization {
  markerColor: string;
  clusterColor: string;
  fontFamily: string;
}

export interface MapSettings {
  style: MapStyle;
  features: MapFeatures;
  customization: MapCustomization;
  center?: number[];
  zoom?: number;
}

export const defaultMapSettings: MapSettings = {
  style: {
    id: 'minimal',
    markerStyle: 'pins',
    popupStyle: {
      background: '#FFFFFF',
      text: '#1D3640',
      border: '#E2E8F0',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  },
  features: {
    enableClustering: true,
    enableFullscreen: true,
    enableSharing: true,
    enableSearch: false
  },
  customization: {
    markerColor: '#E9B893',
    clusterColor: '#F99D7C',
    fontFamily: 'Inter'
  },
  center: [0, 0]
};
