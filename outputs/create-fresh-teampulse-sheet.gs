/** Paste into a NEW script file in the existing TeamPulse Apps Script project.
 * Set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD in Script Properties first.
 * Run createFreshTeamPulseSheet_ ONCE from the editor. Do not deploy this as an API action.
 */
function createFreshTeamPulseSheet_() {
  const props = PropertiesService.getScriptProperties();
  // Validate before creating a file or switching the backend.
  email_(props.getProperty('ADMIN_EMAIL'));
  password_(props.getProperty('ADMIN_INITIAL_PASSWORD'));
  const previousId = props.getProperty('SPREADSHEET_ID');
  const previousBook = requestBook_;
  const previousPassword = props.getProperty('ADMIN_INITIAL_PASSWORD');
  const stamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd-HHmmss');
  const book = SpreadsheetApp.create('TeamPulse Fresh ' + stamp);
  try {
    // Build all headers before changing the backend pointer.
    Object.keys(SCHEMA).forEach(name => {
      const sheet = book.insertSheet(name);
      sheet.appendRow(SCHEMA[name]);
      sheet.setFrozenRows(1);
    });
    SpreadsheetApp.flush();
    props.setProperty('SPREADSHEET_ID', book.getId());
    requestBook_ = null;
    setup();
    const adminEmail = email_(props.getProperty('ADMIN_EMAIL'));
    const admin = rows_('employees').find(row => row.email === adminEmail && row.role === 'Admin' && row.status === 'Active');
    const credential = rows_('credentials').find(row => admin && row.employeeId === admin.id && row.email === adminEmail);
    require_(admin && credential, 'Fresh Admin verification failed.');
    console.log('Fresh TeamPulse Sheet ready: ' + book.getUrl());
    console.log('Admin account created. Old Sheet unchanged. Refresh the portal and sign in with your new TeamPulse password.');
  } catch (error) {
    if (previousId) props.setProperty('SPREADSHEET_ID', previousId);
    else props.deleteProperty('SPREADSHEET_ID');
    props.setProperty('ADMIN_INITIAL_PASSWORD', previousPassword);
    console.log('Setup failed; previous Sheet setting restored. New incomplete Sheet: ' + book.getUrl());
    throw error;
  } finally {
    requestBook_ = previousBook;
  }
}
