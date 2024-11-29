"""Configuration settings for the API."""
import os

# API Settings
API_PORT = int(os.getenv('API_PORT', 5000))
DEBUG_MODE = os.getenv('DEBUG_MODE', 'true').lower() == 'true'

# Map Settings
DEFAULT_ZOOM = 2
DEFAULT_MARKER_SIZE = (50, 50)
POPUP_MAX_WIDTH = 250

# File Settings
ALLOWED_EXTENSIONS = {'csv'}
TEMP_MAP_FILENAME = 'community_map.html'

# Geocoding Settings
GEOCODER_USER_AGENT = 'community_mapper'
GEOCODER_TIMEOUT = 10