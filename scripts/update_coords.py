#!/usr/bin/env python3
"""
Update coordinates for places in a travel plan JSON file.
Uses Google Maps search via Chrome DevTools MCP.
"""
import json
import re
import time

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

def get_current_url():
    """Get current URL from Chrome DevTools."""
    result = mcp({'tool': 'chrome_devtools_evaluate_script', 'args': '{"script": "window.location.href"}'})
    return result.get('result', {}).get('value', '')

def search_place_and_get_coords(place_name):
    """
    Search for a place in Google Maps and return its coordinates.
    
    Returns (lat, lng) tuple or None if not found.
    """
    # Navigate to Google Maps
    mcp({'tool': 'chrome_devtools_navigate_page', 'args': '{"url": "https://maps.google.com.hk"}'})
    time.sleep(2)
    
    # Fill search input
    mcp({'tool': 'chrome_devtools_fill', 'args': '{"uid": "1_9", "value": "' + place_name.replace('"', '\\"') + '"}'})
    time.sleep(1)
    
    # Click search button
    mcp({'tool': 'chrome_devtools_click', 'args': '{"uid": "1_10"}'})
    time.sleep(3)
    
    # Get the URL after search
    url = get_current_url()
    print(f"  Current URL: {url}")
    
    # Extract coordinates from URL
    lat, lng = extract_coords_from_url(url)
    if lat and lng:
        print(f"  Found coordinates from URL: {lat}, {lng}")
        return lat, lng
    
    # If no coords in URL, try network request method
    print("  No coordinates found in URL, trying network request...")
    
    return None, None

def main():
    json_file = "2026-11-tokyo-travel-plan-20260621-2011.json"
    
    # Load the JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    places = data.get('places', [])
    print(f"Found {len(places)} places in the travel plan.")
    
    # Initialize MCP
    global mcp
    from mcp import mcp as mcp_func
    
    for i, place in enumerate(places):
        print(f"\n[{i+1}/{len(places)}] Processing: {place['name']}")
        
        # Skip if already has coordinates
        if place.get('lat', 0) != 0 and place.get('lng', 0) != 0:
            print(f"  Already has coordinates: {place['lat']}, {place['lng']}")
            # Save after each place
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            continue
        
        print(f"  Searching for coordinates...")
        
        # Search for the place
        lat, lng = search_place_and_get_coords(place['name'])
        
        if lat and lng:
            place['lat'] = round(lat, 7)
            place['lng'] = round(lng, 7)
            print(f"  Updated: {place['lat']}, {place['lng']}")
        else:
            print(f"  Could not find coordinates")
        
        # Save after each place
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Ask user to confirm before continuing
        input("Press Enter to continue...")

if __name__ == "__main__":
    main()
