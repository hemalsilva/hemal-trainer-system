const fs = require('fs');
let dashCode = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

const targetStr = `      </div>\n\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">\n        {/* Main Chart */}`;

const insertStr = `      </div>

      {/* Department Wise KPI Tiles */}
      <div className="mb-10 print:hidden">
        <h2 className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-brand-primary" /> Department Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'].map(dept => {
            const deptEmps = employees.filter(e => e.department === dept);
            const deptTotalHrs = deptEmps.reduce((sum, e) => sum + (Number(e.total_training_hours) || 0), 0);
            const deptActive = trainings.filter(t => t.department === dept && t.training_date && new Date(t.training_date).getMonth() === currentMonth).length;
            
            if (deptEmps.length === 0 && deptTotalHrs === 0 && deptActive === 0) return null;
            
            return (
              <div key={dept} className="bg-[#181818] border border-gray-800 rounded-2xl p-5 hover:border-brand-primary/30 transition-colors shadow-lg group">
                <h3 className="text-lg font-bold text-blue-200 mb-4 pb-2 border-b border-gray-800 group-hover:border-brand-primary/30 transition-colors">{dept}</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-900 rounded-xl py-2">
                    <p className="text-xl font-bold text-gray-200">{deptEmps.length}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Staff</p>
                  </div>
                  <div className="bg-brand-primary/10 rounded-xl py-2 border border-brand-primary/20">
                    <p className="text-xl font-bold text-brand-primary">{deptActive}</p>
                    <p className="text-[10px] text-brand-primary/70 font-bold uppercase tracking-wider mt-1">Active</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-xl py-2 border border-yellow-500/20">
                    <p className="text-xl font-bold text-yellow-500">{deptTotalHrs.toFixed(1)}</p>
                    <p className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-wider mt-1">Hours</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Main Chart */}`;

if (!dashCode.includes("Department Summary")) {
  dashCode = dashCode.replace(targetStr, insertStr);
  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', dashCode, 'utf8');
  console.log('Added department tiles');
}
