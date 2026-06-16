/**
 * DELTA AQUAPONICS — ADD MONDAY REPORT FORM
 *
 * This script adds the Monday Report form to your EXISTING spreadsheet.
 * Run this ONCE — it will create the form and link it to your sheet.
 *
 * HOW TO RUN:
 * 1. Go to https://script.google.com
 * 2. Click "New project"
 * 3. Delete everything in the editor and paste this entire script
 * 4. Press Cmd+S to save
 * 5. Make sure the dropdown next to ▶ says "addMondayReportForm"
 * 6. Click ▶ Run
 * 7. Click "Review permissions" → choose your Google account → "Allow"
 * 8. Wait ~20 seconds, then click "Execution log" at the bottom
 * 9. Copy the Monday Report form link from the log and share it with the team
 */

function addMondayReportForm() {

  const SPREADSHEET_ID = '1N0Qr-p_qUGaNVEesDqeSB28zGq6rj2A2U9gNOhohihY';

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ── 1. ADD THE MONDAY REPORT SHEET (if it doesn't exist) ──────────────────
  let mondaySheet = ss.getSheetByName('Monday Report (Forms)');
  if (!mondaySheet) {
    mondaySheet = ss.insertSheet('Monday Report (Forms)');
    mondaySheet.appendRow([
      'Timestamp', 'Week Starting', 'Report Date',
      'Bed 1 (Smile) — Appearance', 'Bed 2 (Multigreen) — Appearance',
      'Bed 3 (Elise Prime) — Appearance', 'Bed 4 (Commander) — Appearance',
      'Lettuce Taste Test', 'Beds Near Harvest / Bolting',
      'Tomatoes — Appearance & Suckers', 'Tomatoes — Fruit Status',
      'Other Crop Observations',
      'Fish Alive Now', 'Fish Deaths This Week', 'Fish Deaths — Days & Causes',
      'Fish Feeding & Behaviour',
      'Siphon Cycle Times (Row 1–6)', 'Siphon Issues',
      'Water Readings (pH / Temp / Air)',
      'What Team Did Last Week', 'How It Went / Challenges', 'Any Surprises',
      'Priorities This Week', 'Requests From Management'
    ]);
    // Style the header row
    const header = mondaySheet.getRange(1, 1, 1, mondaySheet.getLastColumn());
    header.setBackground('#1B5E20');
    header.setFontColor('#FFFFFF');
    header.setFontWeight('bold');
    mondaySheet.setFrozenRows(1);
    mondaySheet.setColumnWidth(1, 160);
    mondaySheet.setColumnWidth(2, 110);
    console.log('✅ Monday Report sheet created.');
  } else {
    console.log('ℹ️ Monday Report sheet already exists — skipping sheet creation.');
  }

  // ── 2. CREATE THE MONDAY REPORT FORM ──────────────────────────────────────
  const form = FormApp.create('📋 Monday Report — Delta Aquaponics');
  form.setDescription(
    'Weekly farm update — fill in every Monday morning after the farm walk.\n' +
    'Short and honest is all we need. Write what is real, including problems.\n\n' +
    '⏱ Takes about 10 minutes. Walk the farm first, then write.'
  );
  form.setConfirmationMessage('Monday Report sent. Management will review it shortly. Thank you 🌿');
  form.setCollectEmail(false);

  // ── OPENING QUESTIONS ─────────────────────────────────────────────────────
  form.addDateItem()
    .setTitle('Report Date')
    .setHelpText("Today's date — the Monday morning you are writing this.")
    .setRequired(true);

  form.addDateItem()
    .setTitle('Week Starting')
    .setHelpText('The Monday at the start of the week you are reporting on.')
    .setRequired(true);

  // ── SECTION 1: LETTUCE ────────────────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('🥬 Section 1 — Lettuce Beds')
    .setHelpText('Walk each bed before filling this in. Check leaf colour, size, and any unusual signs.');

  form.addParagraphTextItem()
    .setTitle('Bed 1 (Smile) — How does it look this week?')
    .setHelpText('Leaf colour, growth rate, anything unusual? e.g. "Dark green, growing well, no issues."')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Bed 2 (Multigreen) — How does it look this week?')
    .setHelpText('Leaf colour, growth rate, anything unusual?')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Bed 3 (Elise Prime) — How does it look this week?')
    .setHelpText('Leaf colour, growth rate, anything unusual?')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Bed 4 (Commander) — How does it look this week?')
    .setHelpText('Leaf colour, growth rate, anything unusual?')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('How does the lettuce taste?')
    .setHelpText('Pick a leaf from each bed and taste it. Mild and slightly sweet = good. Any bitterness at all = harvest now.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Is any bed close to bolting or ready to harvest?')
    .setHelpText('Centre stalk growing tall and thin? Leaves elongating? Which beds will you harvest this week, and when?');

  // ── SECTION 2: TOMATOES ───────────────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('🍅 Section 2 — Tomatoes');

  form.addParagraphTextItem()
    .setTitle('How are the tomato plants looking?')
    .setHelpText('Suckers pinched daily? Leader straight and tied? Any unusual leaf colour, wilting, or pests?')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('How much fruit is on the plants right now?')
    .setHelpText('How many clusters forming or ripening? Any fruit ready to pick this week?')
    .setRequired(true);

  // ── SECTION 3: OTHER CROPS ────────────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('🌿 Section 3 — Other Crop Observations');

  form.addParagraphTextItem()
    .setTitle('Did you notice anything unusual about any plants this week?')
    .setHelpText('New pest? Unusual smell? Leaves that looked different from normal? Write it down even if you are not sure what it means.');

  // ── SECTION 4: FISH ───────────────────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('🐟 Section 4 — Fish')
    .setHelpText('Walk the tank and observe carefully before filling this in.');

  form.addTextItem()
    .setTitle('How many fish are alive right now?')
    .setHelpText('Count or estimate. e.g. 893')
    .setRequired(true);

  form.addTextItem()
    .setTitle('How many fish died this week?')
    .setHelpText('Total deaths this week. Enter 0 if none.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Fish deaths — which days, and what was the cause?')
    .setHelpText('e.g. "1 on Tuesday (heat stress), 1 on Thursday (cause unclear)." Leave blank if no deaths this week.');

  form.addParagraphTextItem()
    .setTitle('How are the fish feeding and behaving?')
    .setHelpText('Feeding actively at the surface? Swimming normally? Any sitting at the bottom, gasping, spots, or wounds?')
    .setRequired(true);

  // ── SECTION 5: SYSTEM STATUS ──────────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('⚙️ Section 5 — System Status')
    .setHelpText('Time at least one full siphon cycle per row before filling this in. Target: 15–18 minutes.');

  form.addParagraphTextItem()
    .setTitle('How are the 6 siphon rows cycling this week?')
    .setHelpText('Give a time for each row. e.g. "Rows 1–4 and 6 at 16–17 min. Row 5 at 21 min — adjusted inflow valve."')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Any siphon issues this week?')
    .setHelpText('Water too high, algae on surface, siphon not triggering, dry zone too small? What did you find and what did you do?');

  form.addParagraphTextItem()
    .setTitle('Water readings this week — pH, water temp, air temp')
    .setHelpText('e.g. "pH: 7.0 | Water temp: 26°C | Air temp: 31°C | All normal." If any reading was out of range, describe what you did.')
    .setRequired(true);

  // ── SECTION 6: LAST WEEK ──────────────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('📅 Section 6 — Last Week');

  form.addParagraphTextItem()
    .setTitle('What did the team do this week?')
    .setHelpText('Beyond the daily routine — harvests, replanting, repairs, adjustments, cleaning. What took time and attention?')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('How did it go? Was anything difficult?')
    .setHelpText('What worked well? What was harder or took longer than expected? We need the honest version, not just the good news.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Did anything surprise you or behave differently from expected?')
    .setHelpText("You don't need to know why — just write what you noticed. We will figure it out together.");

  // ── SECTION 7: THIS WEEK ──────────────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('🎯 Section 7 — This Week');

  form.addParagraphTextItem()
    .setTitle('What are your priorities for this week?')
    .setHelpText('Most important tasks in order of urgency. e.g. "1. Harvest Bed 2 — tasting bitter. 2. Check Row 5 cycle again. 3. Replant Bed 1 by Thursday."')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Is there anything you need from management this week?')
    .setHelpText('Questions, materials needed, or developing situations we should know about? There are no wrong questions.');

  // ── 3. LINK FORM TO THE EXISTING SPREADSHEET ─────────────────────────────
  form.setDestination(FormApp.DestinationType.SPREADSHEET, SPREADSHEET_ID);
  Utilities.sleep(3000);

  // Rename the auto-created "Form Responses X" sheet to "Monday Report (Forms)"
  const sheets = ss.getSheets();
  for (let i = sheets.length - 1; i >= 0; i--) {
    if (sheets[i].getName().startsWith('Form Responses')) {
      sheets[i].setName('Monday Report (Forms)');
      console.log('✅ Response sheet renamed to "Monday Report (Forms)"');
      break;
    }
  }

  // ── 4. PRINT THE FORM LINK ────────────────────────────────────────────────
  console.log('');
  console.log('============================================');
  console.log('  MONDAY REPORT FORM CREATED ✅');
  console.log('============================================');
  console.log('');
  console.log('Share this link with the team (fill every Monday morning):');
  console.log(form.getPublishedUrl());
  console.log('');
  console.log('Form editor link (for you to edit the form later):');
  console.log(form.getEditUrl());
  console.log('');
  console.log('Responses will appear in your existing spreadsheet:');
  console.log('https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID);
  console.log('');
  console.log('============================================');
}
