from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

def get_coordinates(location: str) -> tuple[float, float] | None:
    """Get coordinates for a given location string."""
    try:
        geolocator = Nominatim(user_agent="community_mapper")
        location_data = geolocator.geocode(location)
        if location_data:
            return location_data.latitude, location_data.longitude
        return None
    except GeocoderTimedOut:
        return None