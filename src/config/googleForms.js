// ─────────────────────────────────────────────────────────────────────────────
// Google Forms + Sheets configuration for the Player Availability feature
//
// SETUP STEPS (admin, one-time):
//
//  1. Go to https://forms.google.com and create a new form with these fields:
//       - Fixture ID        → Short answer  (hidden/pre-filled via URL param)
//       - Player Name       → Short answer
//       - Team              → Dropdown  (Raising Bulls | Royal Bulls)
//       - Availability      → Multiple choice  (Available | Unavailable | Maybe)
//       - Notes             → Paragraph  (optional)
//
//  2. To find entry IDs open the published form in a browser, right-click the
//     page and "View Page Source". Search for "entry." to locate each field's
//     entry ID (format: entry.1234567890).
//     Alternatively submit a test response and check the POST body in DevTools
//     (Network tab → the formResponse request → Payload).
//
//  3. Replace the placeholder values below with your real IDs.
//
//  4. The Google Sheet linked to the form gets auto-created in Drive.
//     Open it → File → Share → Publish to web → select "Entire Document"
//     and "Comma-separated values (.csv)" → Publish.
//     Copy the spreadsheet ID from the URL bar (the long alphanumeric string
//     between /spreadsheets/d/ and /edit) and paste it into SHEET_ID below.
//     Then set the sheet tab name in SHEET_GID (default "0" for the first tab).
// ─────────────────────────────────────────────────────────────────────────────

// The ID portion of your Google Form published URL:
//   https://docs.google.com/forms/d/e/<FORM_ID>/viewform
export const FORM_ID = '1FAIpQLSe6VFPFK7FIh7IWowljKwbv_5vB-JftV2byWw7AL5MoZW3HMg'

// entry.XXXXXXXXXX IDs extracted from the form's POST payload.
// The fixture field is a date-picker, so it submits as three sub-keys:
//   entry.1166974658_year, entry.1166974658_month, entry.1166974658_day
export const FORM_ENTRIES = {
  playerName:   'entry.2005620554',  // Player Name
  notes:        'entry.839337160',   // Notes (optional)
  fixtureDate:  'entry.1166974658',  // Fixture Date (date picker — use _year/_month/_day suffixes)
  team:         'entry.1045781291',  // Team (Raising Bulls / Royal Bulls)
  availability: 'entry.1065046570',  // Availability (In / Out / Maybe)
}

// The ID portion of the linked Google Sheet URL:
//   https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
export const SHEET_ID = '1jjc2OVJdEFDGB3EOCJmKcrnldzseRmgyAdL_SmEl-eo'

// gid of the sheet tab (from the URL: #gid=177101743)
export const SHEET_GID = '177101743'

// Derived URLs — no need to edit these.
// Note: published Google Forms use the /d/e/ path prefix.
export const FORM_SUBMIT_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`
export const SHEET_JSON_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`
