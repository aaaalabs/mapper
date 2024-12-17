import { MapSettings, defaultMapSettings } from '../../types/mapSettings';

export const getPopupStyles = (settings: MapSettings = defaultMapSettings) => {
  const popupStyle = settings?.style?.popupStyle || defaultMapSettings.style.popupStyle;
  const fontFamily = settings?.customization?.fontFamily || defaultMapSettings.customization.fontFamily;
  
  return {
    wrapper: {
      backgroundColor: popupStyle.background,
      color: popupStyle.text,
      borderColor: popupStyle.border,
      boxShadow: popupStyle.shadow,
    },
    image: {
      borderRadius: '50%',
      border: '2px solid ' + popupStyle.border,
      backgroundColor: popupStyle.background,
    },
    title: {
      color: popupStyle.text,
      fontSize: '0.9rem',
      fontWeight: 600,
      fontFamily,
      letterSpacing: '-0.01em',
    },
    subtitle: {
      color: popupStyle.text,
      opacity: 0.9,
      fontFamily,
      letterSpacing: '-0.01em',
    },
    text: {
      color: popupStyle.text,
      opacity: 0.8,
      fontFamily,
      letterSpacing: '-0.01em',
    },
    link: {
      color: popupStyle.text,
      opacity: 0.9,
      fontFamily,
      transition: 'all 0.15s ease-in-out',
      fontWeight: 500,
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
