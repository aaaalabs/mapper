"""Map generation utilities."""
import folium
from folium import plugins
from pandas import DataFrame
from .config import DEFAULT_ZOOM, DEFAULT_MARKER_SIZE, POPUP_MAX_WIDTH

def create_popup_content(row: dict) -> str:
    """Create HTML content for map marker popup."""
    website_link = f"<a href='{row['website']}' target='_blank'>Website</a>" if row.get('website') else ""
    linkedin_link = f"<a href='{row['linkedin']}' target='_blank'>LinkedIn</a>" if row.get('linkedin') else ""
    
    links = " | ".join(filter(None, [website_link, linkedin_link]))
    
    return f"""
        <div style='text-align:center;'>
            <img src='{row["image"]}' style='width:100px;height:100px;border-radius:50%;margin-bottom:8px;'><br>
            <strong style='font-size:16px;'>{row["name"]}</strong><br>
            <span style='color:#666;'>{row.get("title", "")}</span><br>
            <span style='color:#666;'>{row["location"]}</span><br>
            <div style='margin-top:8px;'>{links}</div>
        </div>
    """

def create_map_marker(row: dict, map_obj: folium.Map) -> None:
    """Create a map marker with user data."""
    if isinstance(row.get('image'), str) and row['image'].startswith('http'):
        icon = folium.CustomIcon(
            row['image'],
            icon_size=DEFAULT_MARKER_SIZE,
            icon_anchor=None,
            popup_anchor=None
        )
        popup = folium.Popup(
            create_popup_content(row),
            max_width=POPUP_MAX_WIDTH
        )
        folium.Marker(
            location=[row['latitude'], row['longitude']],
            popup=popup,
            icon=icon,
            tooltip=row['name']
        ).add_to(map_obj)

def generate_community_map(df: DataFrame) -> folium.Map:
    """Generate a Folium map with community markers."""
    # Calculate center point
    center_lat = df['latitude'].mean()
    center_lon = df['longitude'].mean()
    
    # Create map
    map_obj = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=DEFAULT_ZOOM,
        control_scale=True
    )
    
    # Add fullscreen control
    plugins.Fullscreen().add_to(map_obj)
    
    # Add markers
    for _, row in df.iterrows():
        create_map_marker(row.to_dict(), map_obj)
    
    # Add search control
    search_data = {}
    for _, row in df.iterrows():
        search_data[row['name']] = [row['latitude'], row['longitude']]
    
    search = plugins.Search(
        layer=None,
        geom_type='Point',
        placeholder='Search members...',
        collapsed=False,
        search_label='name'
    ).add_to(map_obj)
    
    return map_obj