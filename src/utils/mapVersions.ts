import { MapVersion } from '../types/map';
import { mapStyles } from './mapStyles';

export const mapVersions: MapVersion[] = [
  {
    id: 1,
    name: 'Standard View',
    style: mapStyles.standard,
    options: {
      markerStyle: 'pins',
      enableClustering: false
    }
  },
  {
    id: 2,
    name: 'Satellite Clusters',
    style: mapStyles.satellite,
    options: {
      markerStyle: 'custom',
      enableClustering: true
    }
  },
  {
    id: 3,
    name: 'Terrain Photos',
    style: mapStyles.terrain,
    options: {
      markerStyle: 'photos',
      enableClustering: false
    }
  },
  {
    id: 4,
    name: 'Dark Analytics',
    style: mapStyles.dark,
    options: {
      markerStyle: 'custom',
      enableClustering: false,
      customOptions: {
        heatmap: true,
        darkMode: true,
        dynamicSize: true
      }
    }
  },
  {
    id: 5,
    name: 'Interactive Hybrid',
    style: mapStyles.hybrid,
    options: {
      markerStyle: 'custom',
      enableClustering: true,
      customOptions: {
        animation: true
      }
    }
  }
];