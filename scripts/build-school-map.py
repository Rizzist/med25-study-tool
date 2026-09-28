"""Refresh the small, attributed OSM snapshot used by the local campus viewer.

No live map requests or location tracking are needed when students open the tab.
Heights without explicit source values remain illustrative, never floor counts.
"""
import json
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://api.openstreetmap.org/api/0.6/map?bbox=51.392,35.704,51.399,35.708'
root = ET.fromstring(urlopen(Request(URL, headers={'User-Agent': 'MED25-campus-directory/1.0'}), timeout=60).read())
nodes = {n.attrib['id']: [float(n.attrib['lon']), float(n.attrib['lat'])] for n in root.findall('node')}
features = []
keep_tags = {'name', 'name:en', 'name:fa', 'building', 'building:levels', 'height', 'amenity', 'highway', 'leisure', 'landuse', 'addr:street', 'addr:housenumber', 'website', 'entrance'}
for kind in ['node', 'way']:
    for el in root.findall(kind):
        tags = {t.attrib['k']: t.attrib['v'] for t in el.findall('tag') if t.attrib['k'] in keep_tags}
        if not tags:
            continue
        if kind == 'way':
            points = [nodes[n.attrib['ref']] for n in el.findall('nd') if n.attrib['ref'] in nodes]
            if not points or not any(51.392 <= x <= 51.399 and 35.704 <= y <= 35.708 for x,y in points):
                continue
            if not any(k in tags for k in ['building', 'highway', 'leisure', 'landuse']):
                continue
        else:
            points = [nodes[el.attrib['id']]]
            if not ('name' in tags and tags.get('amenity') in ['university','college','library','cafe','restaurant']) and 'entrance' not in tags:
                continue
        features.append({'id': f'{kind}-{el.attrib["id"]}', 'osmUrl': f'https://www.openstreetmap.org/{kind}/{el.attrib["id"]}', 'tags': tags, 'points': points})
data = {'version':1, 'retrievedAt':datetime.now(timezone.utc).isoformat(), 'source': URL, 'attribution':'© OpenStreetMap contributors', 'license':'https://www.openstreetmap.org/copyright', 'bounds':[51.392,35.704,51.399,35.708], 'features':features}
out = ROOT/'public/study/school-map/campus.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(data, ensure_ascii=False, separators=(',',':'))+'\n')
print(f'{len(features)} features; {out.stat().st_size} bytes')
for f in features:
    if 'name' in f['tags']:
        print(f['id'], json.dumps(f['tags'], ensure_ascii=False))
