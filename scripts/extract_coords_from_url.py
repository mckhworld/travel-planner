#!/usr/bin/env python3
import re
import json

def extract_coords_from_url(url):
    """Extract coordinates from Google Maps URL with data= parameter."""
    # Pattern to match coordinates in data= parameter
    # Format: !3d<lat>!4d<lng>
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

# Test with the example URL from skill
url = "https://www.google.com.hk/maps/place/mai+mai/@35.6747648,139.7617849,17z/data=!3m2!4b1!5s0x60188be53d8ad29d:0x2860ae5e8e104f68!4m6!3m5!1s0x60188be53d8f6d49:0x62dfdd642fee325d!8m2!3d35.6747605!4d139.7643598!16s%2Fg%2F1tgdt3q2?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D"
lat, lng = extract_coords_from_url(url)
print(f"URL: {url}")
print(f"Coordinates from !3d!4d pattern: lat={lat}, lng={lng}")

# Test with the URL we got from search
url2 = "https://www.google.com.hk/maps/place/%E6%9C%89%E6%A8%82%E7%94%BA/@35.6742396,139.7562991,16z/data=!3m1!4b1!4m10!1m2!2m1!1z5pyJ5qiC55S6IOmjr-WcmCDjgojjgZPjgb_jgZ7jgobjgoogKG5vIHN0b3JlLCBkZWxpdmVyeSk!3m6!1s0x60188befe830f2f9:0x75481cc04dd6de61!8m2!3d35.6745957!4d139.7620134!15sCjjmnInmqILnlLog6aOv5ZyYIOOCiOOBk-OBv-OBnuOChuOCiiAobm8gc3RvcmUsIGRlbGl2ZXJ5KZIBDHN1YmxvY2FsaXR5MuABAA!16zL20vMGNnM3pz?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D"
lat2, lng2 = extract_coords_from_url(url2)
print(f"\nURL 2: {url2}")
print(f"Coordinates from !3d!4d pattern: lat={lat2}, lng={lng2}")
