const fs = require('fs');
let settings = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');
const oldImport = "import { Upload, Settings as SettingsIcon, Save, Image as ImageIcon, MousePointer2, CheckCircle2, FormInput, Plus, X, ExternalLink, ClipboardList, Users, ChevronDown, ChevronUp, BookOpen, CheckCircle, Copy, Info , ScanLine, Award, MessageSquare} from 'lucide-react';";
const newImport = "import { Upload, Settings as SettingsIcon, Save, Image as ImageIcon, MousePointer2, CheckCircle2, FormInput, Plus, X, ExternalLink, ClipboardList, Users, ChevronDown, ChevronUp, BookOpen, CheckCircle, Copy, Info , ScanLine, Award, MessageSquare, Trophy} from 'lucide-react';";
settings = settings.replace(oldImport, newImport);
fs.writeFileSync('frontend/src/pages/Settings.jsx', settings, 'utf8');
console.log('Fixed Trophy import');
