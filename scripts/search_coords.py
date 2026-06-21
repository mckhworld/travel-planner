#!/usr/bin/env python3
"""
Search for coordinates of places in a travel plan JSON file using Google Maps.
Updates the lat/lng fields in-place, one place at a time.
"""
import json
import re
import sys

def extract_coords_from_url(url):
    """Extract coordinates from Google Maps URL with data= parameter."""
    # Pattern to match coordinates in data= parameter: !3d<lat>!4d<lng>
    match = re.search(r'!3d([0-9.-]+)!4d([0-9.-]+)', url)
    if match:
        lat = float(match.group(1))
        lng = float(match.group(2))
        return lat, lng
    
    # Also check for @<lat>,<lng> before data=
    match = re.search(r'@([0-9.-]+),([0-9.-]+)', url)
    if match:
        lat = float(match.group(1))
        lng = float(match.group(2))
        return lat, lng
    
    return None, None

def search_place_in_google_maps(place_name):
    """
    Search for a place in Google Maps and return its coordinates.
    
    This function uses the MCP tools to interact with Chrome DevTools.
    Returns (lat, lng) tuple or None if not found.
    """
    from mcp import MCP
    mcp = MCP()
    
    # Connect to chrome-devtools if not already connected
    try:
        mcp.connect("chrome-devtools")
    except Exception as e:
        print(f"Error connecting to chrome-devtools: {e}")
        return None
    
    try:
        # Navigate to Google Maps
        mcp.chrome_devtools_navigate_page(url="https://maps.google.com.hk")
        
        # Wait for page to load
        import time
        time.sleep(2)
        
        # Get snapshot to find search input
        snapshot = mcp.chrome_devtools_take_snapshot()
        
        # Find the search input element (usually has text "搜尋 Google 地圖" or similar)
        # Look for combobox element
        search_input = None
        search_button = None
        
        # Try to find combobox element for search
        if hasattr(snapshot, 'uid'):
            # We need to use the actual uid from snapshot
            pass
        
        return None
    except Exception as e:
        print(f"Error searching place: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python search_coords.py <json_file> [start_index]")
        sys.exit(1)
    
    json_file = sys.argv[1]
    start_index = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    
    # Load the JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    places = data.get('places', [])
    
    print(f"Found {len(places)} places in the travel plan.")
    print(f"Starting from index: {start_index}")
    
    for i, place in enumerate(places[start_index:], start=start_index):
        print(f"\n[{i+1}/{len(places)}] Processing: {place['name']}")
        
        # Skip if already has coordinates
        if place.get('lat', 0) != 0 and place.get('lng', 0) != 0:
            print(f"  Already has coordinates: {place['lat']}, {place['lng']}")
            continue
        
        print(f"  Searching for coordinates...")
        
        # TODO: Implement actual search logic using MCP
        # For now, just print what would be searched
        print(f"  Would search for: {place['name']}")
        
        # Save after each place
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Ask user to confirm before continuing
        input("Press Enter to continue...")

if __name__ == "__main__":
    main()
