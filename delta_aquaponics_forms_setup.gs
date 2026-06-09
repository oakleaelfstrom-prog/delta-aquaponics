// ============================================================
// DELTA AQUAPONICS — FULL DATA PIPELINE SETUP
// Google Apps Script  ·  Version 2.0
// ============================================================
//
// SETUP INSTRUCTIONS:
//   1. Create a new Google Apps Script project at script.google.com
//   2. Paste this entire script (replace any existing code)
//   3. If you already have a Google Sheet, paste its ID into
//      CONFIG.SPREADSHEET_ID below.  Otherwise leave it blank
//      and setup() will create a new spreadsheet.
//   4. Click Run → setup().  Approve permissions when prompted.
//   5. After setup runs, open View → Logs to copy the form URLs.
//   6. Deploy as a Web App:
//        Deploy → New deployment → Type: Web App
//        Execute as: Me  ·  Who has access: Anyone
//      Copy the Web App URL.
//   7. Paste the Web App URL into the dashboard Settings modal.
//
// IMPORTANT:
//   • Run setup() only once.  Running it again creates duplicate
//     forms and triggers.  If you need to re-run, delete the
//     script properties first (Project Settings → Script Props).
//   • Tabs 4–9 (Environmental_Data … System_Maintenance) are
//     historical data.  This script never touches them.
//   • Financial_Records is never read or referenced here.
// ============================================================

// ── CONFIG ────────────────────────────────────────────────────
// Edit SPREADSHEET_ID before running setup().
// FORM_IDS are filled automatically by setup() via Script Properties.
const CONFIG = {
  SPREADSHEET_ID: '',   // ← paste existing Sheet ID, or leave blank
};

// ============================================================
// COLUMN MAPS
// These document exactly what is stored in every tab so anyone
// can update field positions if the forms change later.
// ============================================================

// ── Form1_DailyRounds ────────────────────────────────────────
//  Col  0: Timestamp  (auto)
//  Col  1: Staff name
//  Col  2: Air temp — inside greenhouse (°C)
//  Col  3: Air temp — outside greenhouse (°C)
//  Col  4: Water temp — fish tank (°C)
//  Col  5: Weather conditions
//  Col  6: Greenhouse fan
//  Col  7: Fish fed this round
//  Col  8: Feed amount given (g)            [optional]
//  Col  9: Feeding time
//  Col 10: Gravel bed row 1 cycle time (mins)
//  Col 11: Gravel bed row 2 cycle time (mins)
//  Col 12: Gravel bed row 3 cycle time (mins)
//  Col 13: Gravel bed row 4 cycle time (mins)
//  Col 14: Gravel bed row 5 cycle time (mins)
//  Col 15: Gravel bed row 6 cycle time (mins)
//  Col 16: Dry zone present on all rows (top 50–75 mm dry)
//  Col 17: Algae visible on gravel surface
//  Col 18: DWC Tank 1 — bubbles visible
//  Col 19: DWC Tank 1 — water running in
//  Col 20: DWC Tank 1 — boards not blocking outlets
//  Col 21: DWC Tank 2 — bubbles visible
//  Col 22: DWC Tank 2 — water running in
//  Col 23: DWC Tank 2 — boards not blocking outlets
//  Col 24: Any issues or observations       [optional]

// ── Form2_DailyCheck ─────────────────────────────────────────
//  Col  0: Timestamp  (auto)
//  Col  1: Staff name
//  Col  2: Date
//  Col  3: pH
//  Col  4: Nitrate NO₃ (ppm)
//  Col  5: Nitrite NO₂ (ppm)
//  Col  6: Row 1 — overall health
//  Col  7: Row 1 — yellowing or discolouration
//  Col  8: Row 1 — drooping or wilting
//  Col  9: Row 1 — pests observed
//  Col 10: Row 1 — canopy management done
//  Col 11: Row 1 — ready to harvest
//  Col 12: Row 1 — harvested today
//  Col 13: Row 1 — estimated harvest weight (kg)  [optional]
//  Col 14: Row 1 — notes                          [optional]
//  Col 15-23: Row 2  (same 9 fields, same order)
//  Col 24-32: Row 3
//  Col 33-41: Row 4
//  Col 42-50: Row 5
//  Col 51-59: Row 6
//  Col 60: DWC Tank 1 — overall health
//  Col 61: DWC Tank 1 — yellowing or discolouration
//  Col 62: DWC Tank 1 — drooping or wilting
//  Col 63: DWC Tank 1 — pests observed
//  Col 64: DWC Tank 1 — lettuce taste check — any bitterness
//  Col 65: DWC Tank 1 — trays ready to harvest
//  Col 66: DWC Tank 1 — harvested today
//  Col 67: DWC Tank 1 — estimated harvest weight (kg)  [optional]
//  Col 68: DWC Tank 1 — notes                          [optional]
//  Col 69-77: DWC Tank 2  (same 9 fields)
//  Col 78: Fish active and feeding normally
//  Col 79: Any fish listing, gasping or sitting on bottom
//  Col 80: Any visible disease signs
//  Col 81: Dead fish count
//  Col 82: Dead fish removed and logged
//  Col 83: Circulation pumps running
//  Col 84: Sump water level normal
//  Col 85: No leaks or overflows
//  Col 86: System clean — no debris or buildup
//  Col 87: Biowaste bin empty
//  Col 88: Nutrient bins full
//  Col 89: Water clear, no bad smell
//  Col 90: DWC Tank 1 — air blower on
//  Col 91: DWC Tank 1 — bubbles visible (equipment check)
//  Col 92: DWC Tank 1 — water running in (equipment check)
//  Col 93: DWC Tank 1 — boards not blocking outlets (equipment check)
//  Col 94: DWC Tank 2 — air blower on
//  Col 95: DWC Tank 2 — bubbles visible (equipment check)
//  Col 96: DWC Tank 2 — water running in (equipment check)
//  Col 97: DWC Tank 2 — boards not blocking outlets (equipment check)
//  Col 98: Any issues or observations  [optional]

// ── Form3_Weekly ─────────────────────────────────────────────
//  Col  0: Timestamp  (auto)
//  Col  1: Staff name
//  Col  2: Week commencing date
//  Col  3: Ammonia NH₃ (ppm)
//  Col  4: Calcium Ca (ppm)
//  Col  5: Magnesium Mg (ppm)
//  Col  6: Potassium K (ppm)
//  Col  7: Manganese Mn (ppm)
//  Col  8: Iron Fe (ppm)
//  Col  9: Number of fish sampled
//  Col 10: Average fish weight (g)
//  Col 11: Feed type
//  Col 12: Daily feed quantity (g)
//  Col 13: Fish visual health
//  Col 14: Health observations  [optional]
//  Col 15: Row 1 — expected harvest date  [optional]
//  Col 16: Row 2 — expected harvest date  [optional]
//  Col 17: Row 3 — expected harvest date  [optional]
//  Col 18: Row 4 — expected harvest date  [optional]
//  Col 19: Row 5 — expected harvest date  [optional]
//  Col 20: Row 6 — expected harvest date  [optional]
//  Col 21: DWC Tank 1 — expected harvest date  [optional]
//  Col 22: DWC Tank 2 — expected harvest date  [optional]
//  Col 23: Total harvest this week (kg)
//  Col 24: Any crop losses or beds replanted
//  Col 25: Crop loss or replanting notes  [optional]
//  Col 26: Any issues or observations     [optional]

// ── Historical tabs (tabs 4–9) ────────────────────────────────
//  Environmental_Data:    Date | Time | Air temp inside | Air temp outside | Weather
//  Water_Quality:         Date | Time | Water temp (°C) | pH | Notes
//  Siphons_Drain_Cycle:   Date | Time | Row1 | Row2 | Row3 | Row4 | Row5 | Row6  (cycle mins)
//  Fish_Records:          Date | Species | Initial stock | Deaths | Cause | Health notes | Running total
//  Plant_Records:         Date | Crop / Bed | Activity | Growth notes | Pests | Expected harvest date | Notes
//  System_Maintenance:    Date | Component | Type | Details | Performed by | Notes

// ============================================================
// SHEET HEADERS (must match form question titles exactly)
// ============================================================

const HEADERS = {
  Form1_DailyRounds: [
    'Timestamp', 'Staff name',
    'Air temp — inside greenhouse (°C)', 'Air temp — outside greenhouse (°C)',
    'Water temp — fish tank (°C)', 'Weather conditions', 'Greenhouse fan',
    'Fish fed this round', 'Feed amount given (g)', 'Feeding time',
    'Gravel bed row 1 cycle time (mins)', 'Gravel bed row 2 cycle time (mins)',
    'Gravel bed row 3 cycle time (mins)', 'Gravel bed row 4 cycle time (mins)',
    'Gravel bed row 5 cycle time (mins)', 'Gravel bed row 6 cycle time (mins)',
    'Dry zone present on all rows (top 50–75 mm dry)', 'Algae visible on gravel surface',
    'DWC Tank 1 — bubbles visible', 'DWC Tank 1 — water running in', 'DWC Tank 1 — boards not blocking outlets',
    'DWC Tank 2 — bubbles visible', 'DWC Tank 2 — water running in', 'DWC Tank 2 — boards not blocking outlets',
    'Any issues or observations'
  ],
  Form2_DailyCheck: [
    'Timestamp', 'Staff name', 'Date', 'pH', 'Nitrate NO₃ (ppm)', 'Nitrite NO₂ (ppm)',
    'Row 1 — overall health', 'Row 1 — yellowing or discolouration', 'Row 1 — drooping or wilting',
    'Row 1 — pests observed', 'Row 1 — canopy management done', 'Row 1 — ready to harvest',
    'Row 1 — harvested today', 'Row 1 — estimated harvest weight (kg)', 'Row 1 — notes',
    'Row 2 — overall health', 'Row 2 — yellowing or discolouration', 'Row 2 — drooping or wilting',
    'Row 2 — pests observed', 'Row 2 — canopy management done', 'Row 2 — ready to harvest',
    'Row 2 — harvested today', 'Row 2 — estimated harvest weight (kg)', 'Row 2 — notes',
    'Row 3 — overall health', 'Row 3 — yellowing or discolouration', 'Row 3 — drooping or wilting',
    'Row 3 — pests observed', 'Row 3 — canopy management done', 'Row 3 — ready to harvest',
    'Row 3 — harvested today', 'Row 3 — estimated harvest weight (kg)', 'Row 3 — notes',
    'Row 4 — overall health', 'Row 4 — yellowing or discolouration', 'Row 4 — drooping or wilting',
    'Row 4 — pests observed', 'Row 4 — canopy management done', 'Row 4 — ready to harvest',
    'Row 4 — harvested today', 'Row 4 — estimated harvest weight (kg)', 'Row 4 — notes',
    'Row 5 — overall health', 'Row 5 — yellowing or discolouration', 'Row 5 — drooping or wilting',
    'Row 5 — pests observed', 'Row 5 — canopy management done', 'Row 5 — ready to harvest',
    'Row 5 — harvested today', 'Row 5 — estimated harvest weight (kg)', 'Row 5 — notes',
    'Row 6 — overall health', 'Row 6 — yellowing or discolouration', 'Row 6 — drooping or wilting',
    'Row 6 — pests observed', 'Row 6 — canopy management done', 'Row 6 — ready to harvest',
    'Row 6 — harvested today', 'Row 6 — estimated harvest weight (kg)', 'Row 6 — notes',
    'DWC Tank 1 — overall health', 'DWC Tank 1 — yellowing or discolouration', 'DWC Tank 1 — drooping or wilting',
    'DWC Tank 1 — pests observed', 'DWC Tank 1 — lettuce taste check — any bitterness',
    'DWC Tank 1 — trays ready to harvest', 'DWC Tank 1 — harvested today',
    'DWC Tank 1 — estimated harvest weight (kg)', 'DWC Tank 1 — notes',
    'DWC Tank 2 — overall health', 'DWC Tank 2 — yellowing or discolouration', 'DWC Tank 2 — drooping or wilting',
    'DWC Tank 2 — pests observed', 'DWC Tank 2 — lettuce taste check — any bitterness',
    'DWC Tank 2 — trays ready to harvest', 'DWC Tank 2 — harvested today',
    'DWC Tank 2 — estimated harvest weight (kg)', 'DWC Tank 2 — notes',
    'Fish active and feeding normally', 'Any fish listing, gasping or sitting on bottom',
    'Any visible disease signs', 'Dead fish count', 'Dead fish removed and logged',
    'Circulation pumps running', 'Sump water level normal', 'No leaks or overflows',
    'System clean — no debris or buildup', 'Biowaste bin empty', 'Nutrient bins full',
    'Water clear, no bad smell',
    'DWC Tank 1 — air blower on', 'DWC Tank 1 — bubbles visible (equip)',
    'DWC Tank 1 — water running in (equip)', 'DWC Tank 1 — boards not blocking outlets (equip)',
    'DWC Tank 2 — air blower on', 'DWC Tank 2 — bubbles visible (equip)',
    'DWC Tank 2 — water running in (equip)', 'DWC Tank 2 — boards not blocking outlets (equip)',
    'Any issues or observations'
  ],
  Form3_Weekly: [
    'Timestamp', 'Staff name', 'Week commencing date',
    'Ammonia NH₃ (ppm)', 'Calcium Ca (ppm)',
    'Magnesium Mg (ppm)', 'Potassium K (ppm)', 'Manganese Mn (ppm)', 'Iron Fe (ppm)',
    'Number of fish sampled', 'Average fish weight (g)', 'Feed type', 'Daily feed quantity (g)',
    'Fish visual health', 'Health observations',
    'Row 1 — expected harvest date', 'Row 2 — expected harvest date',
    'Row 3 — expected harvest date', 'Row 4 — expected harvest date',
    'Row 5 — expected harvest date', 'Row 6 — expected harvest date',
    'DWC Tank 1 — expected harvest date', 'DWC Tank 2 — expected harvest date',
    'Total harvest this week (kg)', 'Any crop losses or beds replanted',
    'Crop loss or replanting notes', 'Any issues or observations'
  ]
};

// ============================================================
// SCRIPT PROPERTIES (auto-populated by setup)
// ============================================================

function getProps() {
  return PropertiesService.getScriptProperties();
}

function getSsId() {
  return getProps().getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
}

function getFormId(n) {
  return getProps().getProperty('FORM' + n + '_ID') || '';
}

// ============================================================
// SETUP — run this once
// ============================================================

function setup() {
  const props = getProps();

  // 1. Spreadsheet
  let ss;
  let ssId = getSsId();
  if (ssId) {
    ss = SpreadsheetApp.openById(ssId);
    Logger.log('Using existing spreadsheet: ' + ss.getName());
  } else {
    ss = SpreadsheetApp.create('Delta Aquaponics Data');
    ssId = ss.getId();
    props.setProperty('SPREADSHEET_ID', ssId);
    Logger.log('Created new spreadsheet. ID: ' + ssId);
    Logger.log('Update CONFIG.SPREADSHEET_ID = "' + ssId + '"');
  }

  // 2. Sheet tabs 1–3 (create or reset headers; never touch 4–9)
  setupFormTabs(ss);

  // 3. Create forms
  Logger.log('Creating Form 1 (3x daily round)…');
  const form1 = createForm1();
  props.setProperty('FORM1_ID', form1.getId());

  Logger.log('Creating Form 2 (daily full check)…');
  const form2 = createForm2();
  props.setProperty('FORM2_ID', form2.getId());

  Logger.log('Creating Form 3 (weekly check)…');
  const form3 = createForm3();
  props.setProperty('FORM3_ID', form3.getId());

  // 4. Triggers
  setupTriggers(form1.getId(), form2.getId(), form3.getId());

  // 5. Summary
  Logger.log('=== SETUP COMPLETE ===');
  Logger.log('Spreadsheet ID : ' + ssId);
  Logger.log('Form 1 URL     : ' + form1.getPublishedUrl() + '  (edit: ' + form1.getEditUrl() + ')');
  Logger.log('Form 2 URL     : ' + form2.getPublishedUrl() + '  (edit: ' + form2.getEditUrl() + ')');
  Logger.log('Form 3 URL     : ' + form3.getPublishedUrl() + '  (edit: ' + form3.getEditUrl() + ')');
  Logger.log('Next step: Deploy → New deployment → Web App (Execute as Me, Anyone can access)');
  Logger.log('Then paste the Web App URL into the dashboard Settings modal.');
}

// Convenience function to log form URLs after setup
function listFormUrls() {
  const ids = [getFormId(1), getFormId(2), getFormId(3)];
  ids.forEach((id, i) => {
    if (!id) { Logger.log('Form ' + (i+1) + ': not created yet — run setup() first'); return; }
    const form = FormApp.openById(id);
    Logger.log('Form ' + (i+1) + ' — ' + form.getTitle());
    Logger.log('  Respondents: ' + form.getPublishedUrl());
    Logger.log('  Edit:        ' + form.getEditUrl());
  });
}

// ============================================================
// SHEET SETUP
// ============================================================

function setupFormTabs(ss) {
  const tabNames = ['Form1_DailyRounds', 'Form2_DailyCheck', 'Form3_Weekly'];
  tabNames.forEach((name, i) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      // Insert at position i+1 so they appear first
      sheet = ss.insertSheet(name, i);
    }
    // Only write headers if row 1 is empty
    const firstCell = sheet.getRange(1, 1).getValue();
    if (!firstCell) {
      const hdrs = HEADERS[name];
      sheet.getRange(1, 1, 1, hdrs.length).setValues([hdrs]);
      sheet.getRange(1, 1, 1, hdrs.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      Logger.log('Headers written to ' + name);
    } else {
      Logger.log(name + ' already has headers — skipped');
    }
  });
}

// ============================================================
// FORM 1 — 3× DAILY ROUND
// ============================================================

function createForm1() {
  const form = FormApp.create('Delta Aquaponics — Daily Round');
  form.setDescription('Complete this form each morning, midday and evening. Takes around 5 minutes.');
  form.setCollectEmail(false);
  form.setProgressBar(false);

  // Staff name
  form.addTextItem().setTitle('Staff name').setRequired(true);

  // ── Temperatures ──────────────────────────────────────────
  form.addSectionHeaderItem().setTitle('Temperatures');

  numItem(form, 'Air temp — inside greenhouse (°C)', true);
  numItem(form, 'Air temp — outside greenhouse (°C)', true);
  numItem(form, 'Water temp — fish tank (°C)', true);

  form.addListItem()
    .setTitle('Weather conditions')
    .setChoiceValues(['Sunny', 'Partly Sunny', 'Cloudy', 'Light Rain', 'Overcast', 'Hot', 'Cold'])
    .setRequired(true);

  form.addListItem()
    .setTitle('Greenhouse fan')
    .setChoiceValues(['On', 'Off'])
    .setRequired(true);

  // ── Fish feeding ──────────────────────────────────────────
  form.addSectionHeaderItem().setTitle('Fish feeding');

  yesNo(form, 'Fish fed this round', true);
  numItem(form, 'Feed amount given (g)', false);
  form.addTimeItem().setTitle('Feeding time').setRequired(true);

  // ── Gravel beds — autosyphon cycles ──────────────────────
  form.addSectionHeaderItem().setTitle('Gravel beds — autosyphon cycles');

  for (let i = 1; i <= 6; i++) {
    numItem(form, 'Gravel bed row ' + i + ' cycle time (mins)', true);
  }

  form.addMultipleChoiceItem()
    .setTitle('Dry zone present on all rows (top 50–75 mm dry)')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Algae visible on gravel surface')
    .setChoiceValues(['Yes', 'No', 'Some'])
    .setRequired(true);

  // ── DWC tanks — floating trays ────────────────────────────
  form.addSectionHeaderItem().setTitle('DWC tanks — floating trays');

  ['DWC Tank 1', 'DWC Tank 2'].forEach(tank => {
    yesNo(form, tank + ' — bubbles visible', true);
    yesNo(form, tank + ' — water running in', true);
    yesNo(form, tank + ' — boards not blocking outlets', true);
  });

  // ── Notes ─────────────────────────────────────────────────
  form.addSectionHeaderItem().setTitle('Notes');
  form.addParagraphTextItem().setTitle('Any issues or observations').setRequired(false);

  return form;
}

// ============================================================
// FORM 2 — DAILY FULL SYSTEM CHECK
// ============================================================

function createForm2() {
  const form = FormApp.create('Delta Aquaponics — Daily Check');
  form.setDescription('Full system check. Submit once per day, ideally before midday.');
  form.setCollectEmail(false);

  form.addTextItem().setTitle('Staff name').setRequired(true);
  form.addDateItem().setTitle('Date').setRequired(true);

  // ── Water chemistry ───────────────────────────────────────
  form.addSectionHeaderItem().setTitle('Water chemistry');
  numItem(form, 'pH', true);
  numItem(form, 'Nitrate NO₃ (ppm)', true);
  numItem(form, 'Nitrite NO₂ (ppm)', true);

  // ── Gravel rows (6 × 9 fields) ───────────────────────────
  for (let row = 1; row <= 6; row++) {
    form.addSectionHeaderItem().setTitle('Row ' + row + ' — plant inspection');
    addBedInspectionBlock(form, 'Row ' + row, false);
  }

  // ── DWC tanks (2 × 9 fields) ─────────────────────────────
  for (let tank = 1; tank <= 2; tank++) {
    form.addSectionHeaderItem().setTitle('DWC Tank ' + tank + ' — inspection');
    addBedInspectionBlock(form, 'DWC Tank ' + tank, true);
  }

  // ── Fish check ────────────────────────────────────────────
  form.addSectionHeaderItem().setTitle('Fish check');

  yesNo(form, 'Fish active and feeding normally', true);
  yesNo(form, 'Any fish listing, gasping or sitting on bottom', true);
  yesNo(form, 'Any visible disease signs', true);
  numItem(form, 'Dead fish count', true);

  form.addMultipleChoiceItem()
    .setTitle('Dead fish removed and logged')
    .setChoiceValues(['Yes', 'No', 'None to remove'])
    .setRequired(true);

  // ── Equipment checklist ───────────────────────────────────
  form.addSectionHeaderItem().setTitle('Equipment checklist');

  const equipItems = [
    'Circulation pumps running',
    'Sump water level normal',
    'No leaks or overflows',
    'System clean — no debris or buildup',
    'Biowaste bin empty',
    'Nutrient bins full',
    'Water clear, no bad smell',
    'DWC Tank 1 — air blower on',
    'DWC Tank 1 — bubbles visible',
    'DWC Tank 1 — water running in',
    'DWC Tank 1 — boards not blocking outlets',
    'DWC Tank 2 — air blower on',
    'DWC Tank 2 — bubbles visible',
    'DWC Tank 2 — water running in',
    'DWC Tank 2 — boards not blocking outlets',
  ];
  equipItems.forEach(title => {
    form.addMultipleChoiceItem()
      .setTitle(title)
      .setChoiceValues(['OK', 'Issue', 'Not checked'])
      .setRequired(true);
  });

  // ── Notes ─────────────────────────────────────────────────
  form.addSectionHeaderItem().setTitle('Notes');
  form.addParagraphTextItem().setTitle('Any issues or observations').setRequired(false);

  return form;
}

// Adds 9 inspection fields for a gravel row or DWC tank.
// isDWC = true → 4th field is "bitterness" instead of "canopy management"
function addBedInspectionBlock(form, prefix, isDWC) {
  form.addMultipleChoiceItem()
    .setTitle(prefix + ' — overall health')
    .setChoiceValues(['Good', 'Concerns', 'Problem'])
    .setRequired(true);

  yesNo(form, prefix + ' — yellowing or discolouration', true);
  yesNo(form, prefix + ' — drooping or wilting', true);

  form.addMultipleChoiceItem()
    .setTitle(prefix + ' — pests observed')
    .setChoiceValues(['Yes', 'No', 'Possible'])
    .setRequired(true);

  if (isDWC) {
    form.addMultipleChoiceItem()
      .setTitle(prefix + ' — lettuce taste check — any bitterness')
      .setChoiceValues(['Yes', 'No', 'Not checked'])
      .setRequired(true);

    form.addMultipleChoiceItem()
      .setTitle(prefix + ' — trays ready to harvest')
      .setChoiceValues(['Yes', 'No', 'Some'])
      .setRequired(true);
  } else {
    form.addMultipleChoiceItem()
      .setTitle(prefix + ' — canopy management done')
      .setChoiceValues(['Yes', 'No', 'Not needed'])
      .setRequired(true);

    form.addMultipleChoiceItem()
      .setTitle(prefix + ' — ready to harvest')
      .setChoiceValues(['Yes', 'No', 'Partial'])
      .setRequired(true);
  }

  yesNo(form, prefix + ' — harvested today', true);
  numItem(form, prefix + ' — estimated harvest weight (kg)', false);
  form.addTextItem().setTitle(prefix + ' — notes').setRequired(false);
}

// ============================================================
// FORM 3 — WEEKLY CHECK
// ============================================================

function createForm3() {
  const form = FormApp.create('Delta Aquaponics — Weekly Check');
  form.setDescription('Full weekly check. Submit once per week.');
  form.setCollectEmail(false);

  form.addTextItem().setTitle('Staff name').setRequired(true);
  form.addDateItem().setTitle('Week commencing date').setRequired(true);

  // ── Full water chemistry ──────────────────────────────────
  form.addSectionHeaderItem().setTitle('Full water chemistry');

  numItem(form, 'Ammonia NH₃ (ppm)', true);
  numItem(form, 'Calcium Ca (ppm)', true);
  numItem(form, 'Magnesium Mg (ppm)', true);
  numItem(form, 'Potassium K (ppm)', true);
  numItem(form, 'Manganese Mn (ppm)', true);
  numItem(form, 'Iron Fe (ppm)', true);

  // ── Fish weight and feeding ───────────────────────────────
  form.addSectionHeaderItem().setTitle('Fish weight and feeding');

  numItem(form, 'Number of fish sampled', true);
  numItem(form, 'Average fish weight (g)', true);

  form.addListItem()
    .setTitle('Feed type')
    .setChoiceValues(['Starter', 'Grower'])
    .setRequired(true);

  numItem(form, 'Daily feed quantity (g)', true);

  form.addListItem()
    .setTitle('Fish visual health')
    .setChoiceValues(['Good', 'Concerns', 'Problem'])
    .setRequired(true);

  form.addParagraphTextItem().setTitle('Health observations').setRequired(false);

  // ── Expected harvest dates ────────────────────────────────
  form.addSectionHeaderItem().setTitle('Expected harvest dates');

  for (let i = 1; i <= 6; i++) {
    form.addDateItem().setTitle('Row ' + i + ' — expected harvest date').setRequired(false);
  }
  form.addDateItem().setTitle('DWC Tank 1 — expected harvest date').setRequired(false);
  form.addDateItem().setTitle('DWC Tank 2 — expected harvest date').setRequired(false);

  // ── Weekly harvest summary ────────────────────────────────
  form.addSectionHeaderItem().setTitle('Weekly harvest summary');

  numItem(form, 'Total harvest this week (kg)', true);

  form.addMultipleChoiceItem()
    .setTitle('Any crop losses or beds replanted')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);

  form.addParagraphTextItem().setTitle('Crop loss or replanting notes').setRequired(false);

  // ── Notes ─────────────────────────────────────────────────
  form.addSectionHeaderItem().setTitle('Notes');
  form.addParagraphTextItem().setTitle('Any issues or observations').setRequired(false);

  return form;
}

// ============================================================
// HELPERS FOR FORM CREATION
// ============================================================

// Number field (text item with number validation)
function numItem(form, title, required) {
  const item = form.addTextItem().setTitle(title).setRequired(required);
  try {
    item.setValidation(FormApp.createTextValidation().requireNumber().build());
  } catch(e) {
    // Validation may not be available in all Apps Script environments
  }
  return item;
}

// Yes / No radio
function yesNo(form, title, required) {
  return form.addMultipleChoiceItem()
    .setTitle(title)
    .setChoiceValues(['Yes', 'No'])
    .setRequired(required);
}

// ============================================================
// TRIGGERS
// ============================================================

function setupTriggers(form1Id, form2Id, form3Id) {
  // Delete any existing triggers for these forms first to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (['onForm1Submit','onForm2Submit','onForm3Submit'].includes(fn)) {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('onForm1Submit').forForm(form1Id).onFormSubmit().create();
  ScriptApp.newTrigger('onForm2Submit').forForm(form2Id).onFormSubmit().create();
  ScriptApp.newTrigger('onForm3Submit').forForm(form3Id).onFormSubmit().create();

  Logger.log('Triggers created for all 3 forms.');
}

// ── Generic trigger handler ───────────────────────────────────
// Iterates all question items on the form in order and maps each
// response by item ID so optional fields always land in the
// correct column even if they were left blank.
function handleFormSubmit_(e, formId, sheetName) {
  const ssId = getSsId();
  if (!ssId) { Logger.log('ERROR: No spreadsheet ID.  Run setup() first.'); return; }

  const form = FormApp.openById(formId);
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) { Logger.log('ERROR: Sheet not found: ' + sheetName); return; }

  // Question item types that produce responses
  const Q_TYPES = new Set([
    FormApp.ItemType.TEXT, FormApp.ItemType.PARAGRAPH_TEXT,
    FormApp.ItemType.MULTIPLE_CHOICE, FormApp.ItemType.CHECKBOX,
    FormApp.ItemType.LIST, FormApp.ItemType.DATE,
    FormApp.ItemType.TIME, FormApp.ItemType.SCALE,
    FormApp.ItemType.DURATION,
  ]);

  // Map itemId → response value
  const responseMap = {};
  e.response.getItemResponses().forEach(ir => {
    const v = ir.getResponse();
    responseMap[ir.getItem().getId()] = Array.isArray(v) ? v.join(', ') : v;
  });

  // Build row: timestamp + one cell per question, in form order
  const row = [e.response.getTimestamp()];
  form.getItems()
    .filter(item => Q_TYPES.has(item.getType()))
    .forEach(item => row.push(responseMap[item.getId()] !== undefined ? responseMap[item.getId()] : ''));

  sheet.appendRow(row);
}

function onForm1Submit(e) {
  try { handleFormSubmit_(e, getFormId(1), 'Form1_DailyRounds'); }
  catch(err) { Logger.log('onForm1Submit error: ' + err.message); }
}

function onForm2Submit(e) {
  try { handleFormSubmit_(e, getFormId(2), 'Form2_DailyCheck'); }
  catch(err) { Logger.log('onForm2Submit error: ' + err.message); }
}

function onForm3Submit(e) {
  try { handleFormSubmit_(e, getFormId(3), 'Form3_Weekly'); }
  catch(err) { Logger.log('onForm3Submit error: ' + err.message); }
}

// ============================================================
// WEB APP ENDPOINT
// ============================================================
// Deploy as Web App: Execute as Me, Anyone can access.
// The dashboard fetches:
//   ?tab=all                   → all operational tabs as one JSON object
//   ?tab=Form1_DailyRounds     → single tab {headers, rows}
//
// Financial_Records is never included in any response.
// ============================================================

const ALLOWED_TABS = [
  'Form1_DailyRounds',
  'Form2_DailyCheck',
  'Form3_Weekly',
  'Environmental_Data',
  'Water_Quality',
  'Siphons_Drain_Cycle',
  'Fish_Records',
  'Plant_Records',
  'System_Maintenance',
];

function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const ssId = getSsId();
    if (!ssId) throw new Error('Spreadsheet not configured.  Run setup() in the Apps Script editor.');

    const ss = SpreadsheetApp.openById(ssId);
    const tab = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : 'all';

    let result;

    if (tab === 'all') {
      result = {};
      ALLOWED_TABS.forEach(name => {
        const sheet = ss.getSheetByName(name);
        result[name] = sheet ? getSheetJson_(sheet) : { headers: [], rows: [] };
      });
    } else {
      if (!ALLOWED_TABS.includes(tab)) {
        output.setContent(JSON.stringify({ error: 'Tab not found or not accessible: ' + tab }));
        return output;
      }
      const sheet = ss.getSheetByName(tab);
      if (!sheet) {
        output.setContent(JSON.stringify({ error: 'Tab does not exist: ' + tab }));
        return output;
      }
      result = getSheetJson_(sheet);
    }

    output.setContent(JSON.stringify(result));
  } catch(err) {
    output.setContent(JSON.stringify({ error: err.message }));
  }

  return output;
}

// Returns { headers: [...], rows: [[...], ...] } for a sheet.
// Dates and times are converted to ISO strings so JSON.parse
// on the dashboard produces consistent string values.
function getSheetJson_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return { headers: [], rows: [] };

  const headers = data[0].map(h => String(h || ''));
  const rows = data.slice(1)
    .filter(row => row.some(c => c !== '' && c !== null && c !== undefined))
    .map(row => row.map(cell => {
      if (cell instanceof Date) return cell.toISOString();
      if (cell === null || cell === undefined) return '';
      return cell;
    }));

  return { headers, rows };
}

// ============================================================
// SEED DEMO DATA
// Run this once after setup() to populate the historical tabs
// with realistic demo data so the dashboard looks complete.
// Only writes to tabs that are empty — safe to run after setup.
// ============================================================

function seedDemoData() {
  const ssId = getSsId();
  if (!ssId) { Logger.log('ERROR: Run setup() first.'); return; }
  const ss = SpreadsheetApp.openById(ssId);

  // ── Plant_Records ─────────────────────────────────────────
  // Date | Crop / Bed | Activity | Growth notes | Pests | Expected harvest date | Notes
  const plantSheet = ss.getSheetByName('Plant_Records');
  if (plantSheet && plantSheet.getLastRow() <= 1) {
    const today = new Date();
    const d = (y,m,day) => new Date(y,m-1,day);
    plantSheet.getRange(1,1,1,7).setValues([
      ['Date','Crop / Bed','Activity','Growth notes','Pests observed','Expected harvest date','Notes']
    ]);
    plantSheet.getRange(1,1,1,7).setFontWeight('bold');
    plantSheet.setFrozenRows(1);
    const plantData = [
      [d(2026,4,28), 'Lettuce (Lollo Rossa)',         'Transplanted', 'Strong germination, 6 trays transplanted into Row 1', 'None',     d(2026,6,25), ''],
      [d(2026,5,3),  'Lettuce (Butterhead)',           'Transplanted', 'Good root development, uniform canopy',                'None',     d(2026,6,30), ''],
      [d(2026,5,10), 'Spinach (Picino)',               'Transplanted', 'Slower than expected, some yellowing on lower leaves', 'Possible', d(2026,7,5),  'Monitor closely — possible nutrient deficiency'],
      [d(2026,5,5),  'Lettuce (Oak Leaf)',             'Transplanted', 'Healthy and growing well',                             'None',     d(2026,6,28), ''],
      [d(2026,5,15), 'Basil (Genovese)',               'Transplanted', 'Fast growth, strong aroma, pinched tops',              'None',     d(2026,7,10), ''],
      [d(2026,5,20), 'Swiss Chard (Bright Lights)',    'Transplanted', 'Good colour, stems developing well',                   'None',     d(2026,7,15), ''],
      [d(2026,5,1),  'Lettuce (Baby Leaf) — Tank 1',  'Transplanted', 'Excellent growth, canopy nearly full coverage',         'None',     d(2026,6,20), 'DWC performing well'],
      [d(2026,5,8),  'Lettuce (Romaine) — Tank 2',    'Transplanted', 'Upright growth, heads forming nicely',                  'None',     d(2026,6,24), 'DWC Tank 2'],
    ];
    plantSheet.getRange(2,1,plantData.length,7).setValues(plantData);
    Logger.log('Plant_Records seeded with ' + plantData.length + ' rows.');
  } else {
    Logger.log('Plant_Records already has data — skipped.');
  }

  // ── Environmental_Data ────────────────────────────────────
  // Date | Time | Air temp inside | Air temp outside | Weather
  const envSheet = ss.getSheetByName('Environmental_Data');
  if (envSheet && envSheet.getLastRow() <= 1) {
    envSheet.getRange(1,1,1,5).setValues([['Date','Time','Air temp inside (°C)','Air temp outside (°C)','Weather']]);
    envSheet.getRange(1,1,1,5).setFontWeight('bold');
    envSheet.setFrozenRows(1);
    const envData = [];
    const times = ['Morning','Midday','Evening'];
    const insideTemps = [[24,31,27],[25,33,28],[23,30,26],[26,34,29],[24,32,27]];
    const outsideTemps = [[20,35,28],[22,37,30],[19,33,25],[23,38,31],[21,36,29]];
    const weathers = ['Sunny','Hot','Partly Sunny','Cloudy','Sunny'];
    for (let w = 4; w >= 0; w--) {
      const dt = new Date(); dt.setDate(dt.getDate() - w);
      times.forEach((t, ti) => {
        envData.push([dt, t, insideTemps[4-w][ti], outsideTemps[4-w][ti], weathers[4-w]]);
      });
    }
    envSheet.getRange(2,1,envData.length,5).setValues(envData);
    Logger.log('Environmental_Data seeded with ' + envData.length + ' rows.');
  } else {
    Logger.log('Environmental_Data already has data — skipped.');
  }

  // ── Water_Quality ─────────────────────────────────────────
  // Date | Time | Water temp (°C) | pH | Notes
  const wqSheet = ss.getSheetByName('Water_Quality');
  if (wqSheet && wqSheet.getLastRow() <= 1) {
    wqSheet.getRange(1,1,1,5).setValues([['Date','Time','Water temp (°C)','pH','Notes']]);
    wqSheet.getRange(1,1,1,5).setFontWeight('bold');
    wqSheet.setFrozenRows(1);
    const wqData = [];
    const pHs = [7.2, 7.1, 7.3, 7.0, 7.2];
    const wTemps = [26.5, 27.0, 26.0, 27.5, 26.5];
    for (let w = 4; w >= 0; w--) {
      const dt = new Date(); dt.setDate(dt.getDate() - w);
      wqData.push([dt, 'Morning', wTemps[4-w], pHs[4-w], '']);
      wqData.push([dt, 'Midday',  wTemps[4-w]+0.5, pHs[4-w]+0.1, '']);
      wqData.push([dt, 'Evening', wTemps[4-w]+0.3, pHs[4-w], '']);
    }
    wqSheet.getRange(2,1,wqData.length,5).setValues(wqData);
    Logger.log('Water_Quality seeded with ' + wqData.length + ' rows.');
  } else {
    Logger.log('Water_Quality already has data — skipped.');
  }

  // ── Siphons_Drain_Cycle ───────────────────────────────────
  // Date | Time | Row1 | Row2 | Row3 | Row4 | Row5 | Row6
  const siphSheet = ss.getSheetByName('Siphons_Drain_Cycle');
  if (siphSheet && siphSheet.getLastRow() <= 1) {
    siphSheet.getRange(1,1,1,8).setValues([['Date','Time','Row 1 (mins)','Row 2 (mins)','Row 3 (mins)','Row 4 (mins)','Row 5 (mins)','Row 6 (mins)']]);
    siphSheet.getRange(1,1,1,8).setFontWeight('bold');
    siphSheet.setFrozenRows(1);
    const siphData = [];
    const base = [16, 17, 15, 18, 16, 17]; // benchmark Row 6 = 17
    const times = ['Morning','Midday','Evening'];
    for (let w = 6; w >= 0; w--) {
      const dt = new Date(); dt.setDate(dt.getDate() - w);
      times.forEach(t => {
        siphData.push([dt, t, ...base.map(v => v + Math.round((Math.random()-0.5)*2))]);
      });
    }
    siphSheet.getRange(2,1,siphData.length,8).setValues(siphData);
    Logger.log('Siphons_Drain_Cycle seeded with ' + siphData.length + ' rows.');
  } else {
    Logger.log('Siphons_Drain_Cycle already has data — skipped.');
  }

  // ── Fish_Records ──────────────────────────────────────────
  // Date | Species | Initial stock | Deaths | Cause | Health notes | Running total
  const fishSheet = ss.getSheetByName('Fish_Records');
  if (fishSheet && fishSheet.getLastRow() <= 1) {
    fishSheet.getRange(1,1,1,7).setValues([['Date','Species','Initial stock','Deaths','Cause','Health notes','Running total']]);
    fishSheet.getRange(1,1,1,7).setFontWeight('bold');
    fishSheet.setFrozenRows(1);
    const fishData = [
      [new Date(2024,9,1),  'Three-spotted tilapia', 1295, 0,  '',                    'Stocked. All fish healthy and active.',         1295],
      [new Date(2024,11,15),'Three-spotted tilapia', 1295, 12, 'Unknown',              'Minor losses. Fish otherwise behaving normally.', 1283],
      [new Date(2025,0,15), 'Three-spotted tilapia', 1295, 247,'Ventilation failure',  'Mass die-off during overnight ventilation fault. Corrected.', 1036],
      [new Date(2025,1,20), 'Three-spotted tilapia', 1295, 8,  'Unknown',              'Healthy overall. Small losses noted.',           1028],
      [new Date(2025,3,10), 'Three-spotted tilapia', 1295, 15, 'Unknown',              'Fish active and feeding well.',                  1013],
      [new Date(2025,5,1),  'Three-spotted tilapia', 1295, 45, 'Unknown',              'Batch losses — cause unclear.',                  968],
      [new Date(2025,7,20), 'Three-spotted tilapia', 1295, 22, 'Unknown',              'Healthy. Feeding well.',                          946],
      [new Date(2025,10,5), 'Three-spotted tilapia', 1295, 38, 'Unknown',              'Some listless behaviour observed, passed.',       908],
      [new Date(2026,0,15), 'Three-spotted tilapia', 1295, 15, 'Unknown',              'Healthy. Feeding well.',                          893],
    ];
    fishSheet.getRange(2,1,fishData.length,7).setValues(fishData);
    Logger.log('Fish_Records seeded with ' + fishData.length + ' rows.');
  } else {
    Logger.log('Fish_Records already has data — skipped.');
  }

  Logger.log('=== seedDemoData complete ===');
  Logger.log('Refresh the dashboard and re-sync to see all data.');
}
