// ============================================================
// DELTA AQUAPONICS — FULL DATA PIPELINE SETUP
// Google Apps Script  ·  Version 3.0
// ============================================================
//
// FIRST-TIME SETUP:
//   1. Create a Google Apps Script project at script.google.com
//   2. Paste this entire script (replace any existing code)
//   3. Paste your Google Sheet ID into CONFIG.SPREADSHEET_ID below,
//      or leave blank and setup() will create a new spreadsheet.
//   4. Click Run → setup() — approve permissions when prompted.
//   5. Check View → Logs to copy form URLs and share with staff.
//   6. Deploy as a Web App:
//        Deploy → New deployment → Type: Web App
//        Execute as: Me  ·  Who has access: Anyone
//      Copy the Web App URL into the dashboard Settings modal.
//
// UPDATING EXISTING FORMS (after pasting a new version):
//   Run updateForms() — do NOT run setup() again.
//   • Existing form URLs stay the same — no resharing needed.
//   • The Google Sheet is kept; historical tabs are untouched.
//   • Old rows in Form1/2/3 tabs will have columns in the old order.
//     This is expected — only new submissions use the new layout.
//
// IMPORTANT:
//   • Run setup() only once (first install).
//   • Financial_Records is never read or referenced here.
// ============================================================

const CONFIG = {
  SPREADSHEET_ID: '',  // ← paste existing Sheet ID, or leave blank
};

// ============================================================
// COLUMN MAPS
// ============================================================

// ── Form1_DailyRounds (19 cols, 0–18) ────────────────────────
//  Col  0: Timestamp (auto)
//  Col  1: Staff name
//  Col  2: Temperature inside greenhouse (°C)
//  Col  3: Temperature outside greenhouse (°C)
//  Col  4: Water temperature — fish tank (°C)
//  Col  5: Weather conditions
//  Col  6: Greenhouse fan
//  Col  7: Did you feed the fish this round?
//  Col  8: How much feed? (grams) [optional]
//  Col  9: What time did you feed the fish? [optional]
//  Col 10: Row 1 — drain cycle time (minutes)
//  Col 11: Row 2 — drain cycle time (minutes)
//  Col 12: Row 3 — drain cycle time (minutes)
//  Col 13: Row 4 — drain cycle time (minutes)
//  Col 14: Row 5 — drain cycle time (minutes)
//  Col 15: Row 6 — drain cycle time (minutes)
//  Col 16: Is top layer of gravel dry on all beds?
//  Col 17: Is algae visible on gravel surface?
//  Col 18: Any issues or observations [optional]

// ── Form2_DailyCheck (73 cols, 0–72) ─────────────────────────
//  Col  0: Timestamp (auto)
//  Col  1: Staff name
//  Col  2: Date
//  Col  3: pH reading
//  Col  4: Nitrate reading (ppm) [NO₃]
//  Col  5: Nitrite reading (ppm) [NO₂]
//  Col  6– 14: Row 1 inspection (9 fields)
//  Col 15– 23: Row 2 inspection
//  Col 24– 32: Row 3 inspection
//  Col 33– 41: Row 4 inspection
//  Col 42– 50: Row 5 inspection
//  Col 51– 59: Row 6 inspection
//  [9-field block starting at base b:]
//    b+0: overall health
//    b+1: yellowing or discolouration
//    b+2: drooping or wilting
//    b+3: pests observed
//    b+4: canopy management
//    b+5: ready to harvest
//    b+6: harvested today
//    b+7: harvest weight (kg) [optional]
//    b+8: notes [optional]
//  Col 60: Fish — active and feeding normally
//  Col 61: Fish — listing, gasping or sitting
//  Col 62: Fish — visible disease signs
//  Col 63: Fish — dead count
//  Col 64: Fish — dead fish removed and logged
//  Col 65: Equip — circulation pumps running
//  Col 66: Equip — sump water level normal
//  Col 67: Equip — no leaks or overflows
//  Col 68: Equip — system clean
//  Col 69: Equip — biowaste bin empty
//  Col 70: Equip — nutrient bins full
//  Col 71: Equip — water clear, no bad smell
//  Col 72: Any issues or observations [optional]

// ── Form3_Weekly (37 cols, 0–36) ─────────────────────────────
//  Col  0: Timestamp (auto)
//  Col  1: Staff name
//  Col  2: Week commencing date
//  Col  3: Ammonia reading (ppm) [NH₃]
//  Col  4: Calcium reading (ppm) [Ca]
//  Col  5: Magnesium reading (ppm) [Mg]
//  Col  6: Potassium reading (ppm) [K]
//  Col  7: Manganese reading (ppm) [Mn]
//  Col  8: Iron reading (ppm) [Fe]
//  Col  9: Number of fish sampled
//  Col 10: Average fish weight (g)
//  Col 11: Feed type
//  Col 12: Daily feed quantity (g)
//  Col 13: Fish visual health
//  Col 14: Health observations [optional]
//  Col 15: Row 1 — current crop
//  Col 16: Row 1 — date planted [optional]
//  Col 17: Row 1 — expected harvest date [optional]
//  Col 18: Row 2 — current crop
//  Col 19: Row 2 — date planted [optional]
//  Col 20: Row 2 — expected harvest date [optional]
//  Col 21: Row 3 — current crop
//  Col 22: Row 3 — date planted [optional]
//  Col 23: Row 3 — expected harvest date [optional]
//  Col 24: Row 4 — current crop
//  Col 25: Row 4 — date planted [optional]
//  Col 26: Row 4 — expected harvest date [optional]
//  Col 27: Row 5 — current crop
//  Col 28: Row 5 — date planted [optional]
//  Col 29: Row 5 — expected harvest date [optional]
//  Col 30: Row 6 — current crop
//  Col 31: Row 6 — date planted [optional]
//  Col 32: Row 6 — expected harvest date [optional]
//  Col 33: Total harvest this week (kg)
//  Col 34: Any crop losses or beds replanted
//  Col 35: Crop loss or replanting notes [optional]
//  Col 36: Any issues or observations [optional]

// ── Historical tabs (tabs 4–9) — unchanged ────────────────────
//  Environmental_Data:   Date | Time | Air temp inside | Air temp outside | Weather
//  Water_Quality:        Date | Time | Water temp (°C) | pH | Notes
//  Siphons_Drain_Cycle:  Date | Time | Row1 | Row2 | Row3 | Row4 | Row5 | Row6 (mins)
//  Fish_Records:         Date | Species | Initial stock | Deaths | Cause | Health notes | Running total
//  Plant_Records:        Date | Crop / Bed | Activity | Growth notes | Pests | Expected harvest date | Notes
//  System_Maintenance:   Date | Component | Type | Details | Performed by | Notes

// ============================================================
// SHEET HEADERS
// ============================================================

const HEADERS = {
  Form1_DailyRounds: [
    'Timestamp', 'Staff name',
    'Inside greenhouse temp (°C)', 'Outside greenhouse temp (°C)', 'Fish tank water temp (°C)',
    'Weather', 'Greenhouse fan', 'Fish fed this round', 'Feed amount (g)', 'Feeding time',
    'Row 1 — drain cycle (mins)', 'Row 2 — drain cycle (mins)', 'Row 3 — drain cycle (mins)',
    'Row 4 — drain cycle (mins)', 'Row 5 — drain cycle (mins)', 'Row 6 — drain cycle (mins)',
    'Gravel top layer dry?', 'Algae visible?',
    'Notes'
  ],
  Form2_DailyCheck: [
    'Timestamp', 'Staff name', 'Date', 'pH', 'Nitrate (ppm)', 'Nitrite (ppm)',
    'Row 1 — health', 'Row 1 — yellowing', 'Row 1 — wilting', 'Row 1 — pests',
    'Row 1 — canopy mgmt', 'Row 1 — ready to harvest', 'Row 1 — harvested',
    'Row 1 — harvest weight (kg)', 'Row 1 — notes',
    'Row 2 — health', 'Row 2 — yellowing', 'Row 2 — wilting', 'Row 2 — pests',
    'Row 2 — canopy mgmt', 'Row 2 — ready to harvest', 'Row 2 — harvested',
    'Row 2 — harvest weight (kg)', 'Row 2 — notes',
    'Row 3 — health', 'Row 3 — yellowing', 'Row 3 — wilting', 'Row 3 — pests',
    'Row 3 — canopy mgmt', 'Row 3 — ready to harvest', 'Row 3 — harvested',
    'Row 3 — harvest weight (kg)', 'Row 3 — notes',
    'Row 4 — health', 'Row 4 — yellowing', 'Row 4 — wilting', 'Row 4 — pests',
    'Row 4 — canopy mgmt', 'Row 4 — ready to harvest', 'Row 4 — harvested',
    'Row 4 — harvest weight (kg)', 'Row 4 — notes',
    'Row 5 — health', 'Row 5 — yellowing', 'Row 5 — wilting', 'Row 5 — pests',
    'Row 5 — canopy mgmt', 'Row 5 — ready to harvest', 'Row 5 — harvested',
    'Row 5 — harvest weight (kg)', 'Row 5 — notes',
    'Row 6 — health', 'Row 6 — yellowing', 'Row 6 — wilting', 'Row 6 — pests',
    'Row 6 — canopy mgmt', 'Row 6 — ready to harvest', 'Row 6 — harvested',
    'Row 6 — harvest weight (kg)', 'Row 6 — notes',
    'Fish — active and feeding', 'Fish — listing or gasping', 'Fish — disease signs',
    'Fish — dead count', 'Fish — dead removed',
    'Equip — pumps running', 'Equip — sump level', 'Equip — no leaks',
    'Equip — system clean', 'Equip — biowaste bin', 'Equip — nutrient bins', 'Equip — water clarity',
    'Notes'
  ],
  Form3_Weekly: [
    'Timestamp', 'Staff name', 'Week commencing date',
    'Ammonia NH₃ (ppm)', 'Calcium Ca (ppm)', 'Magnesium Mg (ppm)',
    'Potassium K (ppm)', 'Manganese Mn (ppm)', 'Iron Fe (ppm)',
    'Fish sampled (count)', 'Avg fish weight (g)', 'Feed type', 'Daily feed (g)',
    'Fish visual health', 'Health observations',
    'Row 1 — current crop', 'Row 1 — date planted', 'Row 1 — harvest date',
    'Row 2 — current crop', 'Row 2 — date planted', 'Row 2 — harvest date',
    'Row 3 — current crop', 'Row 3 — date planted', 'Row 3 — harvest date',
    'Row 4 — current crop', 'Row 4 — date planted', 'Row 4 — harvest date',
    'Row 5 — current crop', 'Row 5 — date planted', 'Row 5 — harvest date',
    'Row 6 — current crop', 'Row 6 — date planted', 'Row 6 — harvest date',
    'Total harvest this week (kg)', 'Any crop losses or beds replanted',
    'Crop loss or replanting notes', 'Notes'
  ]
};

// ============================================================
// SCRIPT PROPERTIES
// ============================================================

function getProps()      { return PropertiesService.getScriptProperties(); }
function getSsId()       { return getProps().getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID; }
function getFormId(n)    { return getProps().getProperty('FORM' + n + '_ID') || ''; }

// ============================================================
// SETUP — run once on first install
// ============================================================

function setup() {
  const props = getProps();

  // 1. Spreadsheet
  let ss, ssId = getSsId();
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

  // 2. Sheet tabs 1–3 (create if missing; never touch historical tabs 4–9)
  setupFormTabs(ss);

  // 3. Create forms
  Logger.log('Creating Form 1 (3× daily round)…');
  const form1 = createForm1();
  props.setProperty('FORM1_ID', form1.getId());

  Logger.log('Creating Form 2 (daily full inspection)…');
  const form2 = createForm2();
  props.setProperty('FORM2_ID', form2.getId());

  Logger.log('Creating Form 3 (weekly summary)…');
  const form3 = createForm3();
  props.setProperty('FORM3_ID', form3.getId());

  // 4. Triggers
  setupTriggers(form1.getId(), form2.getId(), form3.getId());

  // 5. Summary
  Logger.log('=== SETUP COMPLETE ===');
  Logger.log('Spreadsheet ID : ' + ssId);
  Logger.log('Form 1 URL     : ' + form1.getPublishedUrl());
  Logger.log('Form 2 URL     : ' + form2.getPublishedUrl());
  Logger.log('Form 3 URL     : ' + form3.getPublishedUrl());
  Logger.log('Next step: Deploy → New deployment → Web App (Execute as Me, Anyone can access)');
}

// Convenience — log URLs after setup
function listFormUrls() {
  [1, 2, 3].forEach(n => {
    const id = getFormId(n);
    if (!id) { Logger.log('Form ' + n + ': not created — run setup() first'); return; }
    const form = FormApp.openById(id);
    Logger.log('Form ' + n + ' — ' + form.getTitle());
    Logger.log('  Respondents: ' + form.getPublishedUrl());
    Logger.log('  Edit:        ' + form.getEditUrl());
  });
}

// ============================================================
// UPDATE EXISTING FORMS — run instead of setup() when updating
// ============================================================

function updateForms() {
  const id1 = getFormId(1), id2 = getFormId(2), id3 = getFormId(3);
  if (!id1 || !id2 || !id3) {
    Logger.log('ERROR: Form IDs not found. If this is a new installation, run setup() instead.');
    return;
  }

  Logger.log('Rebuilding Form 1 (3× daily round)…');
  const f1 = FormApp.openById(id1);
  clearForm(f1);
  buildForm1(f1);

  Logger.log('Rebuilding Form 2 (daily full inspection)…');
  const f2 = FormApp.openById(id2);
  clearForm(f2);
  buildForm2(f2);

  Logger.log('Rebuilding Form 3 (weekly summary)…');
  const f3 = FormApp.openById(id3);
  clearForm(f3);
  buildForm3(f3);

  // Update sheet headers
  const ssId = getSsId();
  if (ssId) {
    updateSheetHeaders(SpreadsheetApp.openById(ssId));
    Logger.log('Sheet headers updated.');
  } else {
    Logger.log('WARNING: No spreadsheet ID found — sheet headers not updated.');
  }

  Logger.log('=== UPDATE COMPLETE ===');
  Logger.log('Form URLs are unchanged. Staff can continue using their existing links.');
  Logger.log('Old rows in Form1/2/3 tabs have columns in the old order — this is normal.');
  Logger.log('Historical tabs (Environmental_Data etc.) are untouched.');
  Logger.log('Form 1: ' + f1.getPublishedUrl());
  Logger.log('Form 2: ' + f2.getPublishedUrl());
  Logger.log('Form 3: ' + f3.getPublishedUrl());
  Logger.log('Next step: Redeploy the Web App (Deploy → Manage deployments → Edit → New version).');
}

function clearForm(form) {
  form.getItems().forEach(item => { try { form.deleteItem(item); } catch(e) {} });
}

function updateSheetHeaders(ss) {
  ['Form1_DailyRounds', 'Form2_DailyCheck', 'Form3_Weekly'].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const hdrs = HEADERS[name];
    sheet.getRange(1, 1, 1, hdrs.length).setValues([hdrs]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });
}

// ============================================================
// SHEET SETUP
// ============================================================

function setupFormTabs(ss) {
  ['Form1_DailyRounds', 'Form2_DailyCheck', 'Form3_Weekly'].forEach((name, i) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name, i);
    const firstCell = sheet.getRange(1, 1).getValue();
    if (!firstCell) {
      const hdrs = HEADERS[name];
      sheet.getRange(1, 1, 1, hdrs.length).setValues([hdrs]).setFontWeight('bold');
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
  const form = FormApp.create('Delta Aquaponics — 3× Daily Check');
  form.setDescription(
    'Fill this in THREE TIMES per day:\n' +
    '  • Morning (before 8 am)\n' +
    '  • Midday (around 12 pm)\n' +
    '  • Evening (after 5 pm)\n\n' +
    'Takes about 5 minutes each time.'
  );
  form.setCollectEmail(false);
  form.setProgressBar(false);
  buildForm1(form);
  return form;
}

function buildForm1(form) {
  form.addTextItem().setTitle('Staff name').setRequired(true);

  // Temperatures
  const tempHeader = form.addSectionHeaderItem().setTitle('Temperatures');
  if (tempHeader.setHelpText) tempHeader.setHelpText('Read the thermometers and write down the numbers you see.');

  numItem(form, 'Temperature inside the greenhouse (°C)', true,
    'Read the thermometer hanging inside the greenhouse.');
  numItem(form, 'Temperature outside the greenhouse (°C)', true,
    'Read the thermometer outside the greenhouse.');
  numItem(form, 'Water temperature — fish tank (°C)', true,
    'Use the thermometer in the fish tank water.');

  form.addListItem()
    .setTitle('Weather conditions outside today')
    .setChoiceValues(['Sunny', 'Partly sunny', 'Cloudy', 'Light rain', 'Heavy rain', 'Very hot', 'Cold', 'Windy'])
    .setRequired(true);

  form.addListItem()
    .setTitle('Is the greenhouse fan running?')
    .setChoiceValues(['On', 'Off'])
    .setRequired(true);

  // Fish feeding
  const feedHeader = form.addSectionHeaderItem().setTitle('Fish feeding');
  if (feedHeader.setHelpText) feedHeader.setHelpText('Record the fish feeding for this round.');

  yesNo(form, 'Did you feed the fish this round?', true);
  numItem(form, 'How much feed did you give? (grams)', false,
    'Leave blank if you did not feed this round.');
  form.addTimeItem()
    .setTitle('What time did you feed the fish?')
    .setRequired(false);

  // Gravel beds — drain cycle
  const drainHeader = form.addSectionHeaderItem().setTitle('Gravel beds — drain cycle time');
  if (drainHeader.setHelpText) drainHeader.setHelpText(
    'For each gravel bed, time how long the water takes to fully drain and then refill.\n' +
    'Write the number of minutes.\n' +
    'Normal range: 15–18 minutes. Alert the manager if above 20 minutes or below 12 minutes.'
  );

  for (let i = 1; i <= 6; i++) {
    numItem(form, 'Row ' + i + ' — drain cycle time (minutes)', true,
      'Start timing when the water begins to drain. Stop when it has fully refilled.');
  }

  form.addMultipleChoiceItem()
    .setTitle('Is the top layer of gravel dry on all beds? (the top 5–7 cm should be dry between floods)')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Is green algae (slime) visible on the gravel surface?')
    .setChoiceValues(['Yes — on most beds', 'Yes — on some beds', 'No'])
    .setRequired(true);

  // Notes
  form.addSectionHeaderItem().setTitle('Notes');
  form.addParagraphTextItem()
    .setTitle('Any issues or observations this round? (optional)')
    .setRequired(false);
}

// ============================================================
// FORM 2 — DAILY FULL INSPECTION (with page breaks per section)
// ============================================================

function createForm2() {
  const form = FormApp.create('Delta Aquaponics — Daily Full Inspection');
  form.setDescription(
    'Fill this in ONCE per day — best done in the morning or before midday.\n\n' +
    'This form checks each growing row, the fish, and the equipment.\n' +
    'Take your time and check carefully. Takes about 15–20 minutes.\n\n' +
    'Use the Next button at the bottom to move through each section.'
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);
  buildForm2(form);
  return form;
}

function buildForm2(form) {
  form.addTextItem().setTitle('Staff name').setRequired(true);
  form.addDateItem().setTitle('Date').setRequired(true);

  // Water chemistry (first page — no page break before it)
  form.addSectionHeaderItem().setTitle('Water chemistry')
    .setHelpText(
      'Use your water test kit and write the results below.\n' +
      'If you are unsure how to use the test kit, ask the manager to show you.'
    );

  numItem(form, 'pH reading', true);
  numItem(form, 'Nitrate reading (ppm) — NO₃', true);
  numItem(form, 'Nitrite reading (ppm) — NO₂', true);

  // Gravel rows — one page break per row
  for (let row = 1; row <= 6; row++) {
    form.addPageBreakItem()
      .setTitle('ROW ' + row + ' — Plant Inspection')
      .setHelpText('Walk to Row ' + row + '. Look at the plants carefully before answering.');
    addBedInspectionBlock(form, 'Row ' + row, false);
  }

  // Fish check
  form.addPageBreakItem()
    .setTitle('Fish Check')
    .setHelpText(
      'Look into the fish tank carefully. Watch the fish for a minute before answering.\n' +
      'Healthy fish swim actively and come to the surface when you approach.'
    );

  yesNo(form, 'Are the fish active and feeding normally?', true,
    'If most fish are hiding, not moving, or not interested in food — choose No.');
  yesNo(form, 'Are any fish listing (leaning to one side), gasping at the surface, or sitting on the bottom?', true,
    'Any of these signs can mean low oxygen or illness. If yes — alert the manager immediately.');
  yesNo(form, 'Can you see any signs of disease? (white spots, unusual marks, pale patches, frayed fins)', true,
    'If yes — alert the manager and do not add any chemicals without instruction.');
  numItem(form, 'How many dead fish did you count today?', true,
    'Write 0 (zero) if there are none. Count carefully — check corners and under equipment.');

  form.addMultipleChoiceItem()
    .setTitle('Were dead fish removed from the tank and recorded in the log book?')
    .setChoiceValues(['Yes', 'No — there were none to remove', 'No — I found dead fish but did not remove them'])
    .setRequired(true);

  // Equipment checklist
  form.addPageBreakItem()
    .setTitle('Equipment Checklist')
    .setHelpText(
      'Walk through the system and check each item carefully.\n' +
      'Choose OK if everything is working, Issue if there is a problem, or Not checked if you could not check it.'
    );

  form.addSectionHeaderItem().setTitle('General system checks');

  const sysItems = [
    ['Are all circulation pumps running?',
     'Listen and look — you should hear the pumps and see water moving through the pipes.'],
    ['Is the sump water level normal? (not very low or overflowing)',
     'The sump is the large collection tank. It should be roughly at the normal water line.'],
    ['Are there any leaks or overflows anywhere?',
     'Check pipes, joints, filter boxes, and the edges of all tanks.'],
    ['Is the system clean? (no dead leaves, debris, or algae build-up)',
     'Remove any dead plant material or rubbish you find.'],
    ['Is the fish waste (biowaste) bin empty or has it been emptied today?', ''],
    ['Are the nutrient solution bins full enough?',
     'Check both Nutrient A and Nutrient B containers.'],
    ['Is the water clear with no bad smell?',
     'Healthy system water is slightly green-tinted. Cloudy water or a bad smell is a sign of problems — alert the manager.'],
  ];
  sysItems.forEach(([title, help]) => {
    const item = form.addMultipleChoiceItem()
      .setTitle(title)
      .setChoiceValues(['OK', 'Issue', 'Not checked'])
      .setRequired(true);
    if (help) item.setHelpText(help);
  });

  form.addSectionHeaderItem().setTitle('Notes');
  form.addParagraphTextItem()
    .setTitle('Any other issues or observations today? (optional)')
    .setRequired(false);
}

// Adds 9 inspection questions for one growing row or DWC tank.
// isDWC = true → field 5 is bitterness instead of canopy management
function addBedInspectionBlock(form, bedLabel, isDWC) {
  const zone = isDWC ? 'this tank' : 'this row';

  form.addMultipleChoiceItem()
    .setTitle('Overall plant health in ' + zone + '?')
    .setChoiceValues(['Good', 'Some concerns', 'Serious problem'])
    .setRequired(true);

  yesNo(form, 'Are any leaves turning yellow or discoloured?', true);
  yesNo(form, 'Are any plants drooping or wilting?', true);

  form.addMultipleChoiceItem()
    .setTitle('Can you see any insects, bugs, or pests on the plants?')
    .setChoiceValues(['Yes', 'No', 'Possible — not sure'])
    .setRequired(true);

  if (isDWC) {
    form.addMultipleChoiceItem()
      .setTitle('Taste test: does the lettuce in this tank taste bitter?')
      .setHelpText('Pick one small outer leaf and taste it. Bitterness usually means the plants are stressed or ready to harvest.')
      .setChoiceValues(['Yes', 'No', 'Not checked'])
      .setRequired(true);

    form.addMultipleChoiceItem()
      .setTitle('Are the trays in this tank ready to harvest?')
      .setChoiceValues(['Yes — fully ready', 'No', 'Some trays are ready'])
      .setRequired(true);
  } else {
    form.addMultipleChoiceItem()
      .setTitle('Did you trim or thin out overgrown leaves today? (canopy management)')
      .setHelpText('Remove any leaves that are blocking light or overlapping heavily with other plants.')
      .setChoiceValues(['Yes', 'No', 'Not needed today'])
      .setRequired(true);

    form.addMultipleChoiceItem()
      .setTitle('Is this row ready to harvest?')
      .setChoiceValues(['Yes — ready now', 'No', 'Some plants are ready'])
      .setRequired(true);
  }

  yesNo(form, 'Did you harvest from here today?', true);
  numItem(form, 'If you harvested: how much? (kg)', false,
    'Leave blank if you did not harvest today.');
  form.addTextItem()
    .setTitle('Any other observations for ' + zone + '? (optional)')
    .setRequired(false);
}

// ============================================================
// FORM 3 — WEEKLY SUMMARY
// ============================================================

function createForm3() {
  const form = FormApp.create('Delta Aquaponics — Weekly Summary');
  form.setDescription(
    'Fill this in ONCE per week, on the same day each week.\n\n' +
    'This form records water chemistry, fish health, what crops are planted, ' +
    'and the weekly harvest summary.\n\n' +
    'Take your time — this information is used for planning. Takes about 15–20 minutes.'
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);
  buildForm3(form);
  return form;
}

const CROP_LIST = [
  'Butterhead Lettuce', 'Lollo Rossa Lettuce', 'Romaine Lettuce', 'Baby Leaf Lettuce', 'Oak Leaf Lettuce',
  'Spinach', 'Basil', 'Swiss Chard', 'Kale', 'Pak Choi / Bok Choy',
  'Coriander (Cilantro)', 'Parsley', 'Celery', 'Spring Onion', 'Mint',
  'Tomato — Cherry (Samantha)', 'Tomato — Trinity F1', 'Tomato — Other',
  'Sweet Pepper — Yolo Wonder', 'Sweet Pepper — Other',
  'Chilli Pepper — Star', 'Chilli Pepper — Other',
  'Empty — nothing planted', 'Other'
];

function buildForm3(form) {
  form.addTextItem().setTitle('Staff name').setRequired(true);
  form.addDateItem()
    .setTitle('Week commencing date')
    .setRequired(true)
    .setHelpText('Enter the date of Monday this week.');

  // Water chemistry
  form.addPageBreakItem()
    .setTitle('Water Chemistry Test')
    .setHelpText(
      'Use the full water test kit for these measurements.\n' +
      'Write the number from each test result. If a test kit is missing or broken, write 0 and report it.'
    );

  numItem(form, 'Ammonia reading (ppm) — NH₃', true);
  numItem(form, 'Calcium reading (ppm) — Ca', true);
  numItem(form, 'Magnesium reading (ppm) — Mg', true);
  numItem(form, 'Potassium reading (ppm) — K', true);
  numItem(form, 'Manganese reading (ppm) — Mn', true);
  numItem(form, 'Iron reading (ppm) — Fe', true);

  // Fish weighing and feeding
  form.addPageBreakItem()
    .setTitle('Fish: Weighing and Feeding')
    .setHelpText(
      'Net out 10 to 20 fish and weigh them all together.\n' +
      'Divide the total weight by the number of fish to get the average weight per fish.\n' +
      'Then record the current feeding information.'
    );

  numItem(form, 'How many fish did you weigh this week?', true,
    'Usually 10 to 20 fish. Always use the same number each week if possible.');
  numItem(form, 'What is the average fish weight? (grams)', true,
    'Total weight (grams) ÷ number of fish weighed.');

  form.addListItem()
    .setTitle('What type of feed are you currently using?')
    .setChoiceValues(['Starter pellets (small)', 'Grower pellets (large)'])
    .setRequired(true);

  numItem(form, 'How much feed are you giving per day in total? (grams)', true,
    'Add up all feed given across the day.');

  form.addListItem()
    .setTitle('How do the fish look overall this week?')
    .setChoiceValues(['Good — active and healthy', 'Some concerns', 'Serious problem'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Any observations about the fish this week? (optional)')
    .setRequired(false);

  // Crop status — gravel rows
  form.addPageBreakItem()
    .setTitle('Crop Status — Gravel Beds (Rows 1–6)')
    .setHelpText(
      'For each gravel row, select what is currently planted.\n' +
      'If you replanted a row this week, fill in the date you put it in the ground.\n' +
      'If nothing changed, leave the date planted blank.'
    );

  for (let i = 1; i <= 6; i++) {
    form.addListItem()
      .setTitle('Row ' + i + ' — what crop is currently planted?')
      .setChoiceValues(CROP_LIST)
      .setRequired(false);
    form.addDateItem()
      .setTitle('Row ' + i + ' — date planted (fill in only if replanted this week)')
      .setRequired(false);
    form.addDateItem()
      .setTitle('Row ' + i + ' — expected harvest date (leave blank if unsure)')
      .setRequired(false);
  }

  // Weekly harvest summary
  form.addPageBreakItem()
    .setTitle('Weekly Harvest Summary')
    .setHelpText('Record the total amount harvested this week and any crop losses.');

  numItem(form, 'Total harvest weight this week across all rows and tanks (kg)', true,
    'Add up all harvests from every row and tank this week.');

  form.addMultipleChoiceItem()
    .setTitle('Were any crops lost or any beds replanted this week?')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('If yes — what was lost or replanted? Describe what happened. (optional)')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any other observations or issues this week? (optional)')
    .setRequired(false);
}

// ============================================================
// FORM ITEM HELPERS
// ============================================================

// Number field with optional help text
function numItem(form, title, required, helpText) {
  const item = form.addTextItem().setTitle(title).setRequired(required);
  if (helpText) item.setHelpText(helpText);
  try {
    item.setValidation(FormApp.createTextValidation().requireNumber().build());
  } catch(e) {
    // Validation may not be available in all environments
  }
  return item;
}

// Yes / No radio button with optional help text
function yesNo(form, title, required, helpText) {
  const item = form.addMultipleChoiceItem()
    .setTitle(title)
    .setChoiceValues(['Yes', 'No'])
    .setRequired(required);
  if (helpText) item.setHelpText(helpText);
  return item;
}

// ============================================================
// TRIGGERS
// ============================================================

function setupTriggers(form1Id, form2Id, form3Id) {
  // Remove existing triggers first to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(t => {
    if (['onForm1Submit', 'onForm2Submit', 'onForm3Submit'].includes(t.getHandlerFunction())) {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('onForm1Submit').forForm(form1Id).onFormSubmit().create();
  ScriptApp.newTrigger('onForm2Submit').forForm(form2Id).onFormSubmit().create();
  ScriptApp.newTrigger('onForm3Submit').forForm(form3Id).onFormSubmit().create();

  Logger.log('Triggers created for all 3 forms.');
}

// Generic handler — maps responses by item ID so optional fields
// always land in the correct column even if left blank.
function handleFormSubmit_(e, formId, sheetName) {
  const ssId = getSsId();
  if (!ssId) { Logger.log('ERROR: No spreadsheet ID. Run setup() first.'); return; }

  const form = FormApp.openById(formId);
  const ss   = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) { Logger.log('ERROR: Sheet not found: ' + sheetName); return; }

  // Question types that produce a response column
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

  // Build row: timestamp + one cell per question item, in form order
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
//   ?tab=all               → all operational tabs as one JSON object
//   ?tab=Form1_DailyRounds → single tab {headers, rows}
//
// Financial_Records is NEVER included in any response.
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
    if (!ssId) throw new Error('Spreadsheet not configured. Run setup() in the Apps Script editor.');

    const ss  = SpreadsheetApp.openById(ssId);
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
// Dates and times are converted to ISO strings for consistent JSON parsing.
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
// Run once after setup() to populate historical tabs with
// realistic data so the dashboard looks complete.
// Safe to run — only writes to tabs that are empty.
// ============================================================

function seedDemoData() {
  const ssId = getSsId();
  if (!ssId) { Logger.log('ERROR: Run setup() first.'); return; }
  const ss = SpreadsheetApp.openById(ssId);

  // ── Plant_Records ─────────────────────────────────────────
  const plantSheet = ss.getSheetByName('Plant_Records');
  if (plantSheet && plantSheet.getLastRow() <= 1) {
    const d = (y,m,day) => new Date(y,m-1,day);
    plantSheet.getRange(1,1,1,7).setValues([
      ['Date','Crop / Bed','Activity','Growth notes','Pests observed','Expected harvest date','Notes']
    ]).setFontWeight('bold');
    plantSheet.setFrozenRows(1);
    const plantData = [
      [d(2026,4,28), 'Lettuce (Lollo Rossa)',         'Transplanted', 'Strong germination, 6 trays transplanted into Row 1', 'None',     d(2026,6,25), ''],
      [d(2026,5,3),  'Lettuce (Butterhead)',           'Transplanted', 'Good root development, uniform canopy',                'None',     d(2026,6,30), ''],
      [d(2026,5,10), 'Spinach (Picino)',               'Transplanted', 'Slower than expected, some yellowing on lower leaves', 'Possible', d(2026,7,5),  'Monitor closely — possible nutrient deficiency'],
      [d(2026,5,5),  'Lettuce (Oak Leaf)',             'Transplanted', 'Healthy and growing well',                             'None',     d(2026,6,28), ''],
      [d(2026,5,15), 'Basil (Genovese)',               'Transplanted', 'Fast growth, strong aroma, pinched tops',              'None',     d(2026,7,10), ''],
      [d(2026,5,20), 'Swiss Chard (Bright Lights)',    'Transplanted', 'Good colour, stems developing well',                   'None',     d(2026,7,15), ''],
      [d(2026,5,1),  'Lettuce (Baby Leaf) — Tank 1',  'Transplanted', 'Excellent growth, canopy nearly full coverage',         'None',     d(2026,6,20), 'DWC Tank 1'],
      [d(2026,5,8),  'Lettuce (Romaine) — Tank 2',    'Transplanted', 'Upright growth, heads forming nicely',                  'None',     d(2026,6,24), 'DWC Tank 2'],
    ];
    plantSheet.getRange(2,1,plantData.length,7).setValues(plantData);
    Logger.log('Plant_Records seeded with ' + plantData.length + ' rows.');
  } else {
    Logger.log('Plant_Records already has data — skipped.');
  }

  // ── Environmental_Data ────────────────────────────────────
  const envSheet = ss.getSheetByName('Environmental_Data');
  if (envSheet && envSheet.getLastRow() <= 1) {
    envSheet.getRange(1,1,1,5).setValues([['Date','Time','Air temp inside (°C)','Air temp outside (°C)','Weather']]).setFontWeight('bold');
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
  const wqSheet = ss.getSheetByName('Water_Quality');
  if (wqSheet && wqSheet.getLastRow() <= 1) {
    wqSheet.getRange(1,1,1,5).setValues([['Date','Time','Water temp (°C)','pH','Notes']]).setFontWeight('bold');
    wqSheet.setFrozenRows(1);
    const wqData = [];
    const pHs = [7.2, 7.1, 7.3, 7.0, 7.2];
    const wTemps = [26.5, 27.0, 26.0, 27.5, 26.5];
    for (let w = 4; w >= 0; w--) {
      const dt = new Date(); dt.setDate(dt.getDate() - w);
      ['Morning','Midday','Evening'].forEach((t, ti) => {
        wqData.push([dt, t, wTemps[4-w] + ti*0.3, pHs[4-w] + (ti===1?0.1:0), '']);
      });
    }
    wqSheet.getRange(2,1,wqData.length,5).setValues(wqData);
    Logger.log('Water_Quality seeded with ' + wqData.length + ' rows.');
  } else {
    Logger.log('Water_Quality already has data — skipped.');
  }

  // ── Siphons_Drain_Cycle ───────────────────────────────────
  const siphSheet = ss.getSheetByName('Siphons_Drain_Cycle');
  if (siphSheet && siphSheet.getLastRow() <= 1) {
    siphSheet.getRange(1,1,1,8).setValues([['Date','Time','Row 1 (mins)','Row 2 (mins)','Row 3 (mins)','Row 4 (mins)','Row 5 (mins)','Row 6 (mins)']]).setFontWeight('bold');
    siphSheet.setFrozenRows(1);
    const siphData = [];
    const base = [16, 17, 15, 18, 16, 17];
    for (let w = 6; w >= 0; w--) {
      const dt = new Date(); dt.setDate(dt.getDate() - w);
      ['Morning','Midday','Evening'].forEach(t => {
        siphData.push([dt, t, ...base.map(v => v + Math.round((Math.random()-0.5)*2))]);
      });
    }
    siphSheet.getRange(2,1,siphData.length,8).setValues(siphData);
    Logger.log('Siphons_Drain_Cycle seeded with ' + siphData.length + ' rows.');
  } else {
    Logger.log('Siphons_Drain_Cycle already has data — skipped.');
  }

  // ── Fish_Records ──────────────────────────────────────────
  const fishSheet = ss.getSheetByName('Fish_Records');
  if (fishSheet && fishSheet.getLastRow() <= 1) {
    fishSheet.getRange(1,1,1,7).setValues([['Date','Species','Initial stock','Deaths','Cause','Health notes','Running total']]).setFontWeight('bold');
    fishSheet.setFrozenRows(1);
    const fishData = [
      [new Date(2024,9,1),  'Three-spotted tilapia', 1295, 0,  '',                    'Stocked. All fish healthy and active.',            1295],
      [new Date(2024,11,15),'Three-spotted tilapia', 1295, 12, 'Unknown',              'Minor losses. Fish otherwise behaving normally.',  1283],
      [new Date(2025,0,15), 'Three-spotted tilapia', 1295, 247,'Ventilation failure',  'Mass die-off during overnight ventilation fault. Corrected.', 1036],
      [new Date(2025,1,20), 'Three-spotted tilapia', 1295, 8,  'Unknown',              'Healthy overall. Small losses noted.',              1028],
      [new Date(2025,3,10), 'Three-spotted tilapia', 1295, 15, 'Unknown',              'Fish active and feeding well.',                    1013],
      [new Date(2025,5,1),  'Three-spotted tilapia', 1295, 45, 'Unknown',              'Batch losses — cause unclear.',                     968],
      [new Date(2025,8,1),  'Three-spotted tilapia', 1295, 22, 'Unknown',              'Small losses, fish otherwise healthy.',              946],
      [new Date(2025,11,1), 'Three-spotted tilapia', 1295, 18, 'Unknown',              'Year-end stock count. Fish healthy.',                928],
      [new Date(2026,2,15), 'Three-spotted tilapia', 1295, 31, 'Unknown',              'Losses over winter period.',                        897],
      [new Date(2026,4,1),  'Three-spotted tilapia', 1733, 0,  'Restock',              'Restocked to 1,733 fish (6 cages × ~289). All healthy on arrival.', 1733],
    ];
    fishSheet.getRange(2,1,fishData.length,7).setValues(fishData);
    Logger.log('Fish_Records seeded with ' + fishData.length + ' rows.');
  } else {
    Logger.log('Fish_Records already has data — skipped.');
  }

  // ── System_Maintenance ────────────────────────────────────
  const maintSheet = ss.getSheetByName('System_Maintenance');
  if (maintSheet && maintSheet.getLastRow() <= 1) {
    maintSheet.getRange(1,1,1,6).setValues([['Date','Component','Type','Details','Performed by','Notes']]).setFontWeight('bold');
    maintSheet.setFrozenRows(1);
    const maintData = [
      [new Date(2026,2,1),  'Air blower',     'Repair',     'Replaced diaphragm on DWC Tank 1 blower', 'James', 'Sourced from local supplier'],
      [new Date(2026,3,15), 'Sump pump',      'Inspection', 'Cleaned impeller and housing',            'James', ''],
      [new Date(2026,4,1),  'Greenhouse fan', 'Repair',     'Replaced fan belt',                       'James', 'Fan running quietly after repair'],
      [new Date(2026,5,1),  'Water lines',    'Inspection', 'Checked all pipe joints for leaks',       'James', 'No leaks found'],
    ];
    maintSheet.getRange(2,1,maintData.length,6).setValues(maintData);
    Logger.log('System_Maintenance seeded with ' + maintData.length + ' rows.');
  } else {
    Logger.log('System_Maintenance already has data — skipped.');
  }

  Logger.log('=== SEED DEMO DATA COMPLETE ===');
}
