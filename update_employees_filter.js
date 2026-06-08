const fs = require('fs');
let emp = fs.readFileSync('frontend/src/pages/Employees.jsx', 'utf8');

const oldHeaderControls = `          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-brand-card border border-gray-800 rounded-lg text-blue-200 px-4 py-2 focus:outline-none focus:border-brand-primary"
          >
            <option value="All">All Departments</option>
            <option value="Rooms">Rooms</option>
            <option value="Public Area">Public Area</option>
            <option value="Laundry">Laundry</option>
            <option value="Flower">Flower</option>
            <option value="Stores">Stores</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Hotel School">Hotel School</option>
            <option value="Cinnamon Hotel Academy">Cinnamon Hotel Academy</option>
            <option value="General">General</option>
            </select>`;

const newHeaderControls = `          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-brand-card border border-gray-800 rounded-lg text-blue-200 px-4 py-2 focus:outline-none focus:border-brand-primary"
          >
            <option value="All">All Departments</option>
            <option value="Rooms">Rooms</option>
            <option value="Public Area">Public Area</option>
            <option value="Laundry">Laundry</option>
            <option value="Flower">Flower</option>
            <option value="Stores">Stores</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Hotel School">Hotel School</option>
            <option value="Cinnamon Hotel Academy">Cinnamon Hotel Academy</option>
            <option value="General">General</option>
          </select>
          
          <select 
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="bg-brand-card border border-gray-800 rounded-lg text-blue-200 px-4 py-2 focus:outline-none focus:border-brand-primary max-w-[200px] truncate"
          >
            <option value="All">All Positions</option>
            {uniquePositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>`;

emp = emp.replace(oldHeaderControls, newHeaderControls);

const oldFilterLogic = `                  const filteredEmployees = employees.filter(emp => {
                    const matchesSearch = (emp.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                                          (emp.emp_no?.toLowerCase() || '').includes(searchQuery.toLowerCase());
                    const deptVal = emp.department || emp.department_id || '';
                    const matchesDept = selectedDept === 'All' || deptVal === selectedDept;
                    return matchesSearch && matchesDept;
                  });`;

const newFilterLogic = `                  const filteredEmployees = employees.filter(emp => {
                    const matchesSearch = (emp.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                                          (emp.emp_no?.toLowerCase() || '').includes(searchQuery.toLowerCase());
                    const deptVal = emp.department || emp.department_id || '';
                    const matchesDept = selectedDept === 'All' || deptVal === selectedDept;
                    const matchesPosition = selectedPosition === 'All' || emp.designation === selectedPosition;
                    return matchesSearch && matchesDept && matchesPosition;
                  });`;

emp = emp.replace(oldFilterLogic, newFilterLogic);

fs.writeFileSync('frontend/src/pages/Employees.jsx', emp, 'utf8');
console.log("Successfully replaced Employees filter logic");
