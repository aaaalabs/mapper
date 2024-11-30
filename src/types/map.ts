export interface MapStyle {
  id: string;
  name: string;
  url: string;
  attribution: string;
  popupStyle: {
    background: string;
    text: string;
    border: string;
    shadow: string;
  };
}

export interface MapVersion {
  id: number;
  name: string;
  style: MapStyle;
  options: {
    markerStyle: 'pins' | 'photos' | 'custom';
    enableClustering: boolean;
    customOptions?: {
      heatmap?: boolean;
      animation?: boolean;
      darkMode?: boolean;
      dynamicSize?: boolean;
    };
  };
}