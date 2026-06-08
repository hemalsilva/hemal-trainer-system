const fs = require('fs');

let ta = fs.readFileSync('frontend/src/pages/TrainingAttendance.jsx', 'utf8');

const oldImport = "import { Calendar, Search, FileText, CheckCircle, XCircle, Link as LinkIcon, Upload, Users, Save , Plus } from 'lucide-react';";
const newImport = "import { Calendar, Search, FileText, CheckCircle, XCircle, Link as LinkIcon, Upload, Users, Save, Plus, X } from 'lucide-react';";

ta = ta.replace(oldImport, newImport);

fs.writeFileSync('frontend/src/pages/TrainingAttendance.jsx', ta, 'utf8');
console.log('Fixed X import in TrainingAttendance.jsx');
