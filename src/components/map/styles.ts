import { MapSettings, defaultMapSettings } from '../../types/mapSettings';

export const getPopupStyles = (settings: MapSettings = defaultMapSettings) => {
  // Ensure we have default values even if settings is incomplete
  const style = settings?.style || defaultMapSettings.style;
  const customization = settings?.customization || defaultMapSettings.customization;
  const popupStyle = style?.popupStyle || defaultMapSettings.style.popupStyle;
  
  return {
    wrapper: {
      backgroundColor: popupStyle.background,
      color: popupStyle.text,
      borderColor: popupStyle.border,
      boxShadow: popupStyle.shadow,
    },
    image: {
      borderRadius: '50%',
      width: '4rem',
      height: '4rem',
      objectFit: 'cover' as const,
    },
    title: {
      color: popupStyle.text,
      fontFamily: customization.fontFamily,
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    text: {
      color: popupStyle.text,
      opacity: 0.8,
      fontSize: '0.875rem',
    },
    link: {
      color: customization.markerColor,
      '&:hover': {
        opacity: 0.8,
      },
    },
  };
};

export const getMarkerStyles = (settings: MapSettings = defaultMapSettings) => {
  const style = settings?.style || defaultMapSettings.style;
  const customization = settings?.customization || defaultMapSettings.customization;
  const popupStyle = style?.popupStyle || defaultMapSettings.style.popupStyle;
  const markerSize = style.markerStyle === 'photos' ? '40px' : '25px';

  return {
    cluster: {
      backgroundColor: customization.clusterColor,
      color: popupStyle.text,
      width: '35px',
      height: '35px',
      borderRadius: '50%',
      border: '2px solid #fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600'
    },
    marker: {
      color: customization.markerColor,
      width: markerSize,
      height: style.markerStyle === 'photos' ? markerSize : '41px',
      borderRadius: style.markerStyle === 'photos' ? '50%' : '0',
      border: style.markerStyle === 'photos' ? '2px solid #fff' : 'none',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
};
