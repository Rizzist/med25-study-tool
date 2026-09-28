# Guided resizing + School Map

Updated 2026-09-28. No changes to scoring, question content or saved exam results.

## Verification / delivery scope

| Area | Verdict | Evidence / boundary |
| --- | --- | --- |
| Guided split | SHIP | Dragged 56% to 64%; reload + Resume retained 64%. Keyboard arrows and Enter reset work. Shared component used by practice and past papers. |
| Portrait guided layout | SHIP | At 390 × 844 the divider is hidden, PDF follows the questions and no horizontal page overflow occurs. |
| General navigation | SHIP | School Map follows Results; independent of selected course. Phone navigation has five columns. Course strip is hidden only on the map. |
| Central campus map | SHIP for sourced footprint visualization | 174 OSM features, six curated named destinations. Actual footprint coordinates, illustrative unmeasured heights. Source and ODbL attribution visible. This is not an architecturally accurate campus model. |
| Search and rooms | SHIP for building-level notes | English/Persian search; add, save, reopen, remove, JSON import/export. Temporary QA room was removed. Local-only data, no server submission. |
| Google Maps | SHIP | Search and walking-directions URLs use official API=1 format and correct latitude/longitude ordering. No user geolocation captured. Pins are building areas, not verified entrances. |
| Snapp | SHIP for manual handoff only | Copy destination + open official Snapp ride page. User picks pickup, verifies destination/fare and confirms booking in Snapp. No verified destination-prefill contract or booking integration is claimed. |
| All rooms/classes and indoor 3D | BLOCKED: authoritative source data needed | No complete verified floor plan, room directory or live timetable obtained. User has been asked to identify the campus and supply these. No fabricated classrooms, floors, schedules or indoor coordinates. |

## Tests performed

- `npx tsc --noEmit`: pass.
- 22 targeted guided/map/hook checks: pass.
- `npm run mcq:check`: 68 checks pass (practice, finals, results, immutable scores, persistence).
- `npm run build`: successful optimized Next.js build, including guided/review/respiratory validations.
- Chrome localhost computer-use: desktop 3D render, no runtime errors, Persian pharmacy search, selected destination/links, focus control, room persistence, 390px mobile navigation/overflow, drag/keyboard/reload split and portrait PDF stacking.
- WebGL failure falls back to a 2D footprint map; this path is implemented but has not been forced in browser testing.
- No trip was booked; no unrelated browser data or exam results were modified.

## Data and refresh

- `public/study/school-map/campus.json`: attributed snapshot; no remote map requests during normal use. OSM author identifiers are stripped.
- `scripts/build-school-map.py`: manual refresh from the OSM map API. Run `python3 scripts/build-school-map.py`, inspect coordinate/name changes, then `npm run school-map:check` before publishing.
- `src/lib/school-map.mjs`: curated named destinations, Persian/English normalization, safe room import, Google Maps URLs and Snapp handoff.
- `src/components/SchoolMapScene.tsx`: lazy Three.js renderer, on-demand frames, bounded device pixel ratio, selection without automatic camera movement, manual focus/top/zoom, resource cleanup and 2D fallback.
- `src/components/SchoolMap.tsx`: directory, local room notes, import/export and travel controls.
- `med25-school-rooms-v1`: local storage room data. `med25-guided-split-v1`: saved divider percentage (30–70%, default 54%).

Room file format (buildingId must exist in the checked-in campus snapshot):

```json
{"version":1,"rooms":[{"id":"room-example","buildingId":"way-671524505","name":"Name from timetable","number":"","floor":"","notes":"","source":"Verified timetable or directory"}]}
```

Imports merge by unique `room-` prefixed ID (avoiding collisions with mapped buildings), reject conflicts rather than silently replacing notes, and cap at 500 rooms / 500 KB. Personal room pins deliberately show the building, not an inferred position inside it.

## Sources and outstanding data

- [OpenStreetMap source bounds](https://api.openstreetmap.org/api/0.6/map?bbox=51.392,35.704,51.399,35.708), snapshot 2026-09-28; individual feature links retained.
- [OSM attribution and license](https://www.openstreetmap.org/copyright).
- [Official Google Maps URL documentation](https://developers.google.com/maps/documentation/urls/get-started).
- [School of Medicine](https://medicine.tums.ac.ir/) and [TUMS mentoring campus-guide post](https://t.me/TUMS_mentoring/482), offered as campus resources, not a complete room catalogue.
- [Snapp official ride page](https://snapp.ir/taxi-ride/).

To complete the original all-room ambition: confirm central vs international campus; obtain an authorized floor plan/room directory and class schedule; map floor elevations and room polygons to the sourced buildings; verify entrances and room naming with TUMS; then replace the explicit building-level-only limitation. Neighboring University of Tehran buildings must not be assumed to be TUMS classrooms.
