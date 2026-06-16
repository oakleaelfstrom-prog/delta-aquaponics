# Delta Aquaponics Dashboard — Session Handover
**Date:** 2026-06-16  
**Git branch:** main  
**Last commit:** `dc9b96f` — "Unify harvest countdown: bed cards now use same data source as Pillars"

---

## Project Overview

Single-file HTML dashboard for Delta Aquaponics farm in Shorobe, Botswana.

- **File:** `/Users/Oak/Desktop/for claude/delta-aquaponics-dashboard.html`
- **Auto-deployed to Vercel** via GitHub push to `github.com:oakleaelfstrom-prog/delta-aquaponics.git` (main branch)
- **Preview server:** Python HTTP on port 8788 at `/private/tmp/dashboard.html`
  - To update preview after editing: `cp "/Users/Oak/Desktop/for claude/delta-aquaponics-dashboard.html" /private/tmp/dashboard.html`
  - Preview server ID (Claude Preview MCP): `47b66d3b-eee9-411a-894a-6b7a22d317bc`
- **Data source:** Google Apps Script Web App
  - URL: `https://script.google.com/macros/s/AKfycbxVpKeVkudSCYG802UWe6pUSceK-JNKoJ9fn2YD4jj9CZqnyNMn1CXYsF5sfWIg8xh1/exec`
  - Defined at line 707 as `DEFAULT_WEBAPP_URL`

---

## CRITICAL SECURITY RULE — Never Violate

The `Financial_Records` tab in the Google Sheet must **NEVER** be read, displayed, or referenced anywhere. `ALLOWED_TABS` in `doGet()` explicitly excludes it and must stay that way. This is non-negotiable.

---

## Architecture

### Data Flow
1. `DEFAULT_DATA` is baked into the HTML as fallback data
2. GAS Web App returns live JSON from Google Sheets
3. `buildMergedData()` (line 1066) merges DEFAULT_DATA with live GAS data via `mergeByKey()`
4. `mergeByKey` sorts by `a[0]` (date string) only — NOT by date+time
   - **This is a known limitation**: within the same date, entry order depends on insertion order from the input arrays
   - Within the same date, GAS Form1 returns Evening→Midday→Morning order (Morning ends up last in wq/siph/env arrays)
5. A `_tOrd` helper (`t => t==='Evening'?3:t==='Midday'?2:1`) exists to correct this for time-ordered lookups

### Key Data Arrays (in `D` object after `buildMergedData`)
- `D.wq` — water quality rows: `[date, timeSlot/source, temp, pH, notes, NO₃, NO₂]`
  - `temp` (index 2) comes from Form1 (Morning/Midday/Evening)
  - `pH` (index 3) comes from Form2 (source='Form2')
  - These are separate rows, so `latest_wq` (latest pH) and `latest_wtemp_r` (latest temp) need separate lookups
- `D.env` — environment rows: `[date, timeSlot, insideTemp, outsideTemp, weather]`
- `D.siphons` — siphon rows: `[date, timeSlot, s1, s2, s3, s4, s5, s6]`
- `D.fish` — fish records: `[date, species, initialStock, deaths, cause, notes, currentStock]`
- `D.plants` — plant records (see structure below)
- `D.compliance` — array of `{date, f1_morn, f1_mid, f1_eve, f2}` where f1_* values are either `"HH:MM"` string (submission time) or `true` (if time parsing failed)

### D.plants Array Structure
```
p[0]  = date (YYYY-MM-DD, the form submission date)
p[1]  = bedName ('Row 1' … 'Row 6', 'DWC Tank 1'…'DWC Tank 4')
p[2]  = type/event (e.g. 'Planted', 'Weekly Check', 'Harvested')
p[3]  = health ('Good', 'Fair', 'Poor')
p[4]  = pests
p[5]  = harvestDate (expected harvest date, YYYY-MM-DD — recorded weekly in Form3_Weekly)
p[6]  = notes
p[7]  = yellowing ('Yes'/'No')
p[8]  = wilting ('Yes'/'No')
p[9]  = bitterness ('Yes'/'No') — DWC only
p[10] = cropName (e.g. 'Lettuce Atlantis')
p[11] = plantedDate (YYYY-MM-DD — ONLY in the FIRST week's Form3 submission for that crop)
```
**Important:** `p[11]` (planted date) is only set on the FIRST week's submission.
To find it, sort plant records oldest-first and use `.find(p => p[11])`.

---

## Key Functions & Line Numbers

| Function | Line | Purpose |
|---|---|---|
| `buildMergedData()` | 1066 | Merges DEFAULT_DATA with live GAS data |
| `renderBedTimeline()` | 1427 | Full-screen timeline for a growing bed row |
| `openBedDrillDown()` | 1410 | Opens the timeline modal |
| `navigateBedTimeline()` | 1418 | Left/right row navigation |
| `renderAlerts()` | 1717 | Top alert banners |
| `renderExecutiveSummary()` | 1791 | Hero/Pillars section |
| `renderScorecards()` | 1882 | Pillar scorecards (harvest, compliance, etc.) |
| `renderHealthRow()` | 2060 | System Analytics cards (Climate, Water, Siphon, Fish, Equipment, Daily Rounds) |
| `renderCropGrid()` | 2234 | Growing Beds section (bed cards + DWC cards) |

---

## Changes Made In The Previous Session (Before This One)

These were all committed:

1. **Full-screen bed row timeline** — clicking a bed card opens a full-screen vertical timeline with left/right navigation, swipe support, progress bar, TODAY marker, and green harvest endpoint
2. **Timeline redesign** — central vertical line, alternating left/right cards with arrow tips, TODAY dot in dark with 64px gap before harvest, past events full-color, future events dimmed 45%
3. **Date chips in timeline** — bold 11px dark text on subtle grey chip
4. **Water temp fix** — `latest_wtemp_r = [...wq].reverse().find(r=>r[2]!=null)` added as a separate lookup because temp (Form1) and pH (Form2) are in separate wq rows

---

## Changes Made In THIS Session

### 1. Fixed "Last reading" time slot for Water Vitals & Siphon Health (line 2136–2153)
**Bug:** Both cards showed "Morning" as the last reading time even when Evening was the latest round.  
**Root cause:** `D.wq[D.wq.length-1][1]` always returned "Morning" because Morning is the last element in the wq array for a given date (GAS insertion order issue).  
**Fix:** Moved `_tO` helper before the slot lookups, added `_byTime` sort helper, rebuilt `lastWQSlot` and `lastSiphSlot` using time-ordered sort:
```javascript
const _tO = t => t==='Evening'?3:t==='Midday'?2:1;
const _byTime = arr => [...arr].sort((a,b)=>a[0]!==b[0]?(a[0]<b[0]?-1:1):_tO(a[1])-_tO(b[1]));
const _latestWQ   = D.wq.length ? _byTime(D.wq.filter(r=>r[2]!=null)).pop()||null : null;
const lastWQDate  = _latestWQ ? _latestWQ[0] : s.last_wq_date||'—';
const lastWQSlot  = _latestWQ ? _latestWQ[1] : null;
const _latestSiph = D.siphons.length ? _byTime(D.siphons).pop() : null;
const lastSiphDate = _latestSiph ? _latestSiph[0] : '—';
const lastSiphSlot = _latestSiph ? _latestSiph[1] : null;
// ... Climate env sort also uses _byTime now
const _latestEnv = D.env.length ? _byTime(D.env).pop() : null;
```
The Climate card footer was already fixed in the previous session to use `lastEnvDate`/`lastEnvSlot` (not `lastWQDate`/`lastWQSlot`).

### 2. Fish feeding clock time (line ~2149, 2192)
**Bug:** Fish tank card showed "Last fed: 9 Jun" — no time of day.  
**Fix:** Extract the submission clock time from the compliance entry (already stored as "HH:MM" string in `comp_map[dt].f1_eve/f1_mid/f1_morn`):
```javascript
const lastRoundFeedTime = lastRoundEntry
  ? (typeof lastRoundEntry.f1_eve==='string' ? lastRoundEntry.f1_eve
    : typeof lastRoundEntry.f1_mid==='string' ? lastRoundEntry.f1_mid
    : typeof lastRoundEntry.f1_morn==='string' ? lastRoundEntry.f1_morn : null)
  : null;
```
Display: `fmtDate(lastRoundDate)+(lastRoundFeedTime?' · '+lastRoundFeedTime:lastRoundSlot?' · '+lastRoundSlot:'')` — shows e.g. "9 Jun · 17:05". Falls back to slot name ("Evening") if no clock time available.

### 3. Unified harvest countdown between Pillars and Growing Beds (line ~2286, 2318–2360, 2400)
**Bug:** Pillars showed "Row 5 in 25d" but Growing Beds cards showed "~20d" for the same row.  
**Root cause:** Two completely different calculation methods:
- Pillars: used actual recorded harvest date (`r[5]` from Form3_Weekly)
- Bed cards: filtered to records WITHOUT harvest dates (`!p[5]`), then estimated from planted date + `HARVEST_WINDOWS` min days

**Fix:**
1. Added `bedHarvestDate` lookup before `bedCard()`:
```javascript
const bedHarvestDate = {};
D.plants.forEach(p => {
  if(!p[1]||!p[5]) return;
  if(!bedHarvestDate[p[1]] || p[0] > (bedHarvestDate[p[1]].recordedOn||''))
    bedHarvestDate[p[1]] = {date: p[5], recordedOn: p[0]};
});
```
2. Inside `bedCard()`, use `actualHarvestDate = bedHarvestDate[label]?.date` first, only fall back to HARVEST_WINDOWS estimation if no date recorded
3. Footer now shows "harvest 7 Jul" (actual date) instead of "target 28–35d" (generic crop window)
4. Use `new Date(actualHarvestDate)` (matching Pillars) to avoid 1-day timezone rounding offset

---

## Current State of Growing Beds (as of last commit)
```
Row 1 — Tomato Trinity F1       → In ~50d  (harvest 1 Aug)
Row 2 — Tomato Cherry Samantha  → In ~50d  (harvest 1 Aug)
Row 3 — Sweet Pepper Yolo W.    → In ~29d  (harvest 11 Jul)
Row 4 — Lettuce Elise Prime     → In ~25d  (harvest 7 Jul)
Row 5 — Lettuce Atlantis        → In ~25d  (harvest 7 Jul)
Row 6 — Kale Choumoullier       → In ~32d  (harvest 14 Jul)
DWC Tanks 1–4 → Empty
```
Pillars shows "Next: Row 5 in 25d" — matches exactly.

---

## Known Remaining Issues / Things NOT Yet Done

None confirmed outstanding at end of session. All user-reported issues were resolved:
- ✅ Timeline full-screen with navigation
- ✅ Timeline date chips readable
- ✅ Water temp visible in Water Vitals
- ✅ Climate last reading shows "Evening" (not "Morning")
- ✅ Water Vitals last reading shows "Evening" (not "Morning")
- ✅ Siphon Health last reading shows "Evening" (not "Morning")
- ✅ Fish tank "Last fed" shows clock time (e.g. "17:05")
- ✅ Harvest days consistent between Pillars and Growing Beds

---

## Form Versions & Column Offsets (Form1_DailyRounds, line ~878)
```javascript
const isNewF1 = r.length >= 23;
const isOldOld = !isNewF1 && r.length > 20;
const tm = isNewF1 ? (sv(r[2]) || 'Morning') : (timeLabel(String(r[0])) || 'Morning');
const aiCol = isNewF1 ? 3 : 2;   // inside temp
const aoCol = isNewF1 ? 4 : 3;   // outside temp
const wtCol = isNewF1 ? 5 : 4;   // water temp
const wxCol = isNewF1 ? 6 : 5;   // weather
const s0    = isNewF1 ? 12 : 10; // first siphon col (6 rows: s0…s0+5)
const notesCol = isNewF1 ? 22 : isOldOld ? 30 : 18;
```

## HARVEST_WINDOWS (crop-type day ranges, used as fallback only)
Defined somewhere in the file — lettuce is typically 28–35d, tomato ~90d, pepper ~80d, kale ~55d.
Search for `HARVEST_WINDOWS` to find the exact values.

---

## How to Work on This File

1. Edit `/Users/Oak/Desktop/for claude/delta-aquaponics-dashboard.html`
2. `cp "/Users/Oak/Desktop/for claude/delta-aquaponics-dashboard.html" /private/tmp/dashboard.html`
3. Verify in preview (port 8788) or use `preview_eval` to reload
4. Commit & push — Vercel auto-deploys on push to main

The user expects **commit + push after every set of changes** without being asked.
