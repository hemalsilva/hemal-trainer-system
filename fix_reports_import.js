const fs = require('fs');
let reports = fs.readFileSync('frontend/src/pages/Reports.jsx', 'utf8');
const oldImport = "import { Printer, Calendar, AlertCircle, FileText, Search, UserX, BarChart, PieChart, Sparkles, Send, Loader2, Gift, Eye, Award } from 'lucide-react';";
const newImport = "import { Printer, Calendar, AlertCircle, FileText, Search, UserX, BarChart, PieChart, Sparkles, Send, Loader2, Gift, Eye, Award, Trophy } from 'lucide-react';";
reports = reports.replace(oldImport, newImport);
fs.writeFileSync('frontend/src/pages/Reports.jsx', reports, 'utf8');
console.log('Fixed Trophy import in Reports');
