const fs = require('fs');

let settings = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');
let reports = fs.readFileSync('frontend/src/pages/Reports.jsx', 'utf8');

// 1. Extract GeneralPreferences
const startIdx = settings.indexOf('function GeneralPreferences() {');
const endIdx = settings.indexOf('export default function Settings() {');
const componentCode = settings.substring(startIdx, endIdx);

// Rename component
const renamedComponentCode = componentCode.replace('function GeneralPreferences() {', 'function AuditReportTab() {');

// Remove from Settings.jsx
settings = settings.substring(0, startIdx) + settings.substring(endIdx);

// Fix settings tabs mapping
settings = settings.replace(
  `{['photos', 'attendance-scan', 'integrations', 'whatsapp', 'backups', 'general'].map((tab) => (`,
  `{['photos', 'attendance-scan', 'integrations', 'whatsapp', 'backups'].map((tab) => (`
);
settings = settings.replace(
  `{tab === 'photos' ? 'Bulk Staff Photos' : tab === 'attendance-scan' ? 'Scan Attendance Sheets' : tab === 'integrations' ? 'Form Integrations' : tab === 'whatsapp' ? 'WhatsApp Setup' : tab === 'backups' ? 'Backups & Storage' : 'Audit Report'}`,
  `{tab === 'photos' ? 'Bulk Staff Photos' : tab === 'attendance-scan' ? 'Scan Attendance Sheets' : tab === 'integrations' ? 'Form Integrations' : tab === 'whatsapp' ? 'WhatsApp Setup' : tab === 'backups' ? 'Backups & Storage' : ''}`
);
settings = settings.replace(`{activeTab === 'general' && <GeneralPreferences />}`, ``);

// 2. Insert into Reports.jsx
reports = reports.replace('export default function Reports() {', renamedComponentCode + '\nexport default function Reports() {');

// 3. Add to Reports Tabs array
const oldTabsArray = `['overview', 'attendance', 'ojt-performance', 'detailed-summary', 'birthday-calendar', 'service-years', 'ai-report']`;
const newTabsArray = `['overview', 'audit-report', 'attendance', 'ojt-performance', 'detailed-summary', 'birthday-calendar', 'service-years', 'ai-report']`;
reports = reports.replace(oldTabsArray, newTabsArray);

// 4. Add Tab Label
const oldTabLabels = `tab === 'overview' ? 'Training Overview' : tab === 'attendance' ? 'Attendance & Coverage' : tab === 'ojt-performance' ? 'OJT Employee Details' : tab === 'detailed-summary' ? 'Detailed Summary (Printable)' : tab === 'birthday-calendar' ? 'Birthday Calendar' : tab === 'service-years' ? 'Service Years' : 'AI Custom Report'`;
const newTabLabels = `tab === 'overview' ? 'Training Overview' : tab === 'audit-report' ? 'Audit Report' : tab === 'attendance' ? 'Attendance & Coverage' : tab === 'ojt-performance' ? 'OJT Employee Details' : tab === 'detailed-summary' ? 'Detailed Summary (Printable)' : tab === 'birthday-calendar' ? 'Birthday Calendar' : tab === 'service-years' ? 'Service Years' : 'AI Custom Report'`;
reports = reports.replace(oldTabLabels, newTabLabels);

// 5. Add Tab Rendering
const renderingBlock = `
      {/* AUDIT REPORT TAB */}
      {selectedReportTab === 'audit-report' && <AuditReportTab />}
`;
reports = reports.replace(`{/* AI CUSTOM REPORT TAB */}`, renderingBlock + '\n      {/* AI CUSTOM REPORT TAB */}');

// 6. Ensure Trophy is imported in Reports.jsx
if (!reports.includes('Trophy')) {
  reports = reports.replace("import { Printer, Calendar, ", "import { Printer, Calendar, Trophy, ");
}

fs.writeFileSync('frontend/src/pages/Settings.jsx', settings, 'utf8');
fs.writeFileSync('frontend/src/pages/Reports.jsx', reports, 'utf8');
console.log('Migration successful');
