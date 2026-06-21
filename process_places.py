#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, uuid, re
from datetime import datetime

with open('/tmp/places_raw.json', 'r') as f:
    data = json.load(f)

rows = data['values'][1:]  # skip header

# Place name cleaning: extract just the place name, strip notes
def clean_name(raw):
    if not raw: return ''
    s = ' '.join(raw.strip().split())
    
    # Remove leading emoji chars (Unicode > 127)
    while s and ord(s[0]) > 127:
        # Skip zero-width joiner, variation selector-16
        if s[0] in ('\u200d', '\uFE0F'):
            continue
        s = s[1:]
    
    if not s: return ''
    
    # Remove parenthesized transport notes like "(🚃 Train 30min...)"
    if s.startswith('(') and ')' in s:
        return ''  # purely parenthetical = transport note
    
    # Remove trailing note text after newline or period that looks like a description
    # e.g., "熱乃湯 熱乃湯一天會舉行..." -> keep only first meaningful part
    # Split on common separators for notes
    parts = re.split(r'\s*[\n\r。\.]\s*', s)
    
    # Take the first part (the actual place name)
    result = parts[0].strip()
    
    # If the first part is too short (< 3 chars), try second part
    if len(result) < 3 and len(parts) > 1:
        result = parts[1].strip() if len(parts) > 1 else result
    
    return result

# Skip patterns for non-place rows
SKIP_EXACT = ['草津', '川越', '四萬溫泉', '輕井澤']
SKIP_PATTERNS = [
    'Flight', 'Skyliner', 'Hotel store luggage', 'Train to', 'airport rent car',
    '江之電一日卷', 'Nissan rent-a-car', 'drive from', 'breakfast???',
    'Hotel取行李', 'CX501', 'End', '"Visit Japan"', '申請國際車牌',
    'rent car?', 'Booked ', '早啲去影相', '???'
]

def is_place(row):
    if len(row) < 3 or not row[2]: return False
    name = clean_name(row[2])
    if not name: return False
    
    # Skip exact region names used as place entries
    if name in SKIP_EXACT: return False
    
    # Skip skip patterns
    for s in SKIP_PATTERNS:
        if s.lower() in name.lower(): return False
    
    # Must have substance
    if len(name) < 2: return False
    
    return True

# Type classification
def categorize(name, area):
    combined = f"{name} {area}"
    
    if any(kw in combined for kw in ['溫泉', '湯畑', '湯揉', 'おさ湯', '熱乃湯']):
        return ('onsen', '♨️')
    if any(kw in combined for kw in ['酒店', 'hotel', 'inn', '旅館']):
        return ('hotel', '🏨')
    if any(kw in combined for kw in ['餐廳', '食堂', '蕎麥麵', '蕎麦', '燒肉',
                                     'Omakase', '漢堡扒', '牛肉蓋飯', '卵かけごはん',
                                     '和牛', '挽肉と米', 'Roast Beef', '生牛肉飯',
                                     '烏冬', 'かに地獄', '肉男', '飯團', '川上庵',
                                     '柏香亭']):
        return ('restaurant', '🍽️')
    if any(kw in combined for kw in ['咖哩包', '糰子', '今川燒', '草莓', '半月燒',
                                     '咖啡餅', '馬卡龍', '費南雪', '紅薯麵包',
                                     '米飛兔吐司', '地瓜片', '烤地瓜']):
        return ('snack', '🍰')
    if any(kw in combined for kw in ['cafe', '咖啡', 'IKARU', '丸山']):
        return ('cafe', '☕')
    if any(kw in combined for kw in ['神社', '寺廟', '冰川神社', '日枝大神社',
                                     '法輪寺']):
        return ('temple', '⛩️')
    if any(kw in combined for kw in ['教堂', 'capelle', '天主']):
        return ('church', '⛪')
    if any(kw in combined for kw in ['Outlet', '購物']):
        return ('shopping', '🛍️')
    if any(kw in combined for kw in ['停車場', 'Car parking']):
        return ('parking', '🅿️')
    if any(kw in combined for kw in ['舞台劇', '迪士尼']):
        return ('entertainment', '🎭')
    if any(kw in combined for kw in ['森林', '瀑布', '湖', '甌穴']):
        return ('nature', '🌿')
    if any(kw in combined for kw in ['燈塔', '時之鐘', '大時計']):
        return ('sightseeing', '📸')
    
    # Default
    return ('sightseeing', '📸')

def extract_links(row):
    links = []
    for i in range(7, 11):
        if len(row) > i and row[i]:
            val = row[i].strip()
            if any(val.startswith(p) for p in ['http://', 'https://']):
                links.append(val)
            elif val.startswith('www.'):
                links.append('https://' + val)
    return list(dict.fromkeys(links))  # deduplicate

def extract_notes(row):
    parts = []
    for i in [4, 5]:
        if len(row) > i and row[i]:
            parts.append(row[i].strip())
    return '\n'.join(parts).strip() if parts else ''

def extract_address(row):
    return row[6].strip() if len(row) > 6 and row[6] else ''

def date_sort_key(d):
    if not d: return 'zzz'
    m = re.match(r'(\d{1,2})/(\d{1,2})月/(\d{4})', d)
    if m: return f"{int(m.group(3)):04d}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    m = re.match(r'(\d{1,2})/(\d{1,2})', d)
    if m: return f"2026-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    return d

# Process all rows
groups = {}  # date -> [places]
other_places = []
current_date = None

for i, row in enumerate(rows):
    if not is_place(row):
        # Update current date from date header rows
        if len(row) > 0 and row[0]:
            val = row[0].strip()
            if re.match(r'\d{1,2}/\d{1,2}', val):
                current_date = val
        continue
    
    name = clean_name(row[2])
    area = row[1].strip() if len(row) > 1 and row[1] else ''
    date = (row[0].strip() if len(row) > 0 and row[0] else current_date)
    
    ptype, emoji = categorize(name, area)
    
    # Special emojis
    if '哈利·波特' in name: emoji = '🪄'
    
    place = {
        'id': str(uuid.uuid4()),
        'name': name,
        'emoji': emoji,
        'lat': 0,
        'lng': 0,
        'region': area or 'Unknown',
        'type': ptype,
        'area': area,
        'hours': row[3].strip() if len(row) > 3 and row[3] else '',
        'notes': extract_notes(row),
        'ai_notes': '',
        'address': extract_address(row),
        'links': extract_links(row)
    }
    
    if date:
        groups.setdefault(date, []).append(place)
    else:
        other_places.append(place)

# Build output in chronological order
result_groups = []
sorted_dates = sorted(groups.keys(), key=date_sort_key)

for date in sorted_dates:
    places = groups[date]
    areas = set(p['area'] for p in places if p['area'])
    
    emoji_map2 = {'onsen':'♨️','hotel':'🏨','restaurant':'🍽️','snack':'🍰',
                  'cafe':'☕','temple':'⛩️','church':'⛪','shopping':'🛍️',
                  'parking':'🅿️','entertainment':'🎭','nature':'🌿','sightseeing':'📸'}
    
    if len(areas) == 1:
        area = list(areas)[0]
        types = [p['type'] for p in places]
        dominant_type = max(set(types), key=types.count)
        emoji = emoji_map2.get(dominant_type, '📅')
        group_name = f"{date} - {area}"
    else:
        emoji = '📅'
        group_name = date
    
    result_groups.append({
        'id': str(uuid.uuid4()),
        'name': group_name,
        'emoji': emoji,
        'collapsed': False,
        'places': places
    })

# Add "其他" group for unassigned places
if other_places:
    result_groups.append({
        'id': str(uuid.uuid4()),
        'name': '其他 (未安排)',
        'emoji': '📌',
        'collapsed': True,
        'places': other_places
    })

output = {
    '_meta': {
        'version': '1.0',
        'planName': '日本旅行 2026',
        'lastSaved': str(datetime.now().isoformat())
    },
    'groups': result_groups
}

# Print summary
total_places = sum(len(g['places']) for g in result_groups)
print(f"Total places: {total_places}")
print(f"Groups: {len(result_groups)}")

for g in result_groups:
    print(f"\n  [{g['emoji']}] {g['name']} ({len(g['places'])} places)")
    for p in g['places']:
        links_str = f" | {p['links']}" if p['links'] else ""
        print(f"    {p['emoji']} {p['name']} [{p['type']}] ({p['area']}){links_str}")

# Write output
with open('/Users/cheung/repos/travel-planner/import.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✅ Written to /Users/cheung/repos/travel-planner/import.json")
