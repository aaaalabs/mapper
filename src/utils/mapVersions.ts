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
      markerStyle: 'pins',
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
      markerStyle: 'pins',
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
      markerStyle: 'pins',
      enableClustering: true,
      customOptions: {
        animation: true
      }
    }
  }
];