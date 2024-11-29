"""Data processing utilities for CSV files."""
import pandas as pd
from typing import Optional
from .geocoding import get_coordinates

REQUIRED_COLUMNS = ['name', 'location', 'image']
OPTIONAL_COLUMNS = ['title', 'latitude', 'longitude', 'linkedin', 'website', 'updated_at']

def validate_columns(df: pd.DataFrame) -> None:
    """Validate that required columns are present."""
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and standardize the data."""
    # Ensure all required columns exist
    validate_columns(df)
    
    # Fill missing values
    df['title'] = df['title'].fillna('')
    df['linkedin'] = df['linkedin'].fillna('#')
    df['website'] = df['website'].fillna('')
    
    # Convert coordinates to float if they exist
    if 'latitude' in df.columns and 'longitude' in df.columns:
        df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
        df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
    
    return df

def add_missing_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    """Add coordinates for rows missing latitude/longitude."""
    needs_coords = (
        df['latitude'].isna() | 
        df['longitude'].isna() | 
        ~df.columns.isin(['latitude', 'longitude'])
    ).any()
    
    if needs_coords:
        coordinates = []
        for location in df['location']:
            coords = get_coordinates(location)
            coordinates.append(coords if coords else (0, 0))
        
        df['latitude'] = [coord[0] for coord in coordinates]
        df['longitude'] = [coord[1] for coord in coordinates]
    
    return df

def process_csv_data(file) -> pd.DataFrame:
    """Process CSV data and prepare it for map generation."""
    try:
        # Read CSV file
        df = pd.read_csv(file)
        
        # Clean and validate data
        df = clean_data(df)
        
        # Add coordinates if missing
        df = add_missing_coordinates(df)
        
        return df
        
    except Exception as e:
        raise ValueError(f"Error processing CSV file: {str(e)}")