#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

# Read the original file with coordinates in main places array
with open('/Users/cheung/repos/2026-11-tokyo-travel-plan-20260621-2011.json', 'r') as f:
    data = json.load(f)

# Build a lookup dict for coordinates by place name
coord_lookup = {}
for p in data.get('places', []):
    if p.get('lat') and p.get('lng') and (p['lat'] != 0 or p['lng'] != 0):
        coord_lookup[p['name']] = {'lat': p['lat'], 'lng': p['lng']}

print(f"Found {len(coord_lookup)} places with coordinates in main array")

# Update groups' places with coordinates
updated_groups = 0
for group in data.get('groups', []):
    for place in group.get('places', []):
        name = place.get('name')
        if name and coord_lookup.get(name) and (place.get('lat') == 0 or place.get('lng') == 0):
            place['lat'] = coord_lookup[name]['lat']
            place['lng'] = coord_lookup[name]['lng']
            updated_groups += 1

print(f"Updated {updated_groups} places in groups")

# Count remaining zeros
remaining_zeros = sum(1 for g in data.get('groups', []) 
                      for p in g.get('places', []) 
                      if p.get('lat') == 0 and p.get('lng') == 0)
print(f"Remaining places with lat=0, lng=0: {remaining_zeros}")

# Write back
with open('/Users/cheung/repos/2026-11-tokyo-travel-plan-20260621-2011.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ Written back to original file")
