const fs = require('fs');
let audits = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');

// 1. Add state
audits = audits.replace(
  `  const [activeTab, setActiveTab] = useState('overview');`,
  `  const [activeTab, setActiveTab] = useState('overview');\n  const [balanceDesignation, setBalanceDesignation] = useState('');`
);

// 2. Update logic
const oldBalancesLogic = `  const filteredBalances = balances.filter(b => {
    if (department !== 'All' && b.department !== department) return false;
    return true;
  });`;

const newBalancesLogic = `  const uniqueBalanceDesignations = [...new Set(balances.map(b => b.designation).filter(Boolean))].sort();
  const filteredBalances = balances.filter(b => {
    if (department !== 'All' && b.department !== department) return false;
    if (balanceDesignation && b.designation !== balanceDesignation) return false;
    return true;
  });`;

audits = audits.replace(oldBalancesLogic, newBalancesLogic);

// 3. Update header
const oldHeader = `<div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-blue-200">Employee Audit Balances</h2>
            <p className="text-sm text-gray-400 mt-1">Track monthly audit completion progress (Target: 40/month)</p>
          </div>`;

const newHeader = `<div className="p-6 border-b border-gray-800 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-blue-200">Employee Audit Balances</h2>
              <p className="text-sm text-gray-400 mt-1">Track monthly audit completion progress (Target: 40/month)</p>
            </div>
            <select 
              value={balanceDesignation} 
              onChange={(e) => setBalanceDesignation(e.target.value)}
              className="bg-[#181818] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-blue-200 focus:border-brand-primary outline-none"
            >
              <option value="">All Designations</option>
              {uniqueBalanceDesignations.map(desig => (
                <option key={desig} value={desig}>{desig}</option>
              ))}
            </select>
          </div>`;

audits = audits.replace(oldHeader, newHeader);

fs.writeFileSync('frontend/src/pages/Audits.jsx', audits, 'utf8');
console.log('Successfully added designation filter to Audits.jsx');
