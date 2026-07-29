import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, BookOpen, Clock, CheckCircle2, TrendingUp, Award, Printer, Gift, Filter, Briefcase } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, Sector } from 'recharts';

const COLORS = ['#D4AF37', '#FDE047', '#B8860B', '#FEF08A', '#CD853F', '#8B6508'];

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff" className="text-sm font-bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#shadow3d)"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff">{`${value.toFixed(1)}h`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [ojtRecords, setOjtRecords] = useState([]);
  const [timelineRaw, setTimelineRaw] = useState({ ojt: [], standard: [] });
  const [birthdays, setBirthdays] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [timelineFilter, setTimelineFilter] = useState('Month'); // Date, Week, Month
  const [deptSummary, setDeptSummary] = useState([]);
  const [dashboardFilter, setDashboardFilter] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  const fetchData = async () => {
    try {
      let queryParams = '';
      if (dashboardFilter) {
        const [y, mStr] = dashboardFilter.split('-');
        const m = parseInt(mStr, 10) - 1;
        queryParams = `?month=${m}&year=${y}`;
      }
      const [empRes, trainRes, ojtRes, timelineRes, deptSummaryRes] = await Promise.all([
        axios.get(`/api/employees${queryParams}?t=${Date.now()}`),
        axios.get(`/api/trainings${queryParams}?t=${Date.now()}`),
        axios.get(`/api/ojt${queryParams}?t=${Date.now()}`),
        axios.get(`/api/reports/timeline?t=${Date.now()}&t=${Date.now()}`),
        axios.get(`/api/reports/department-summary${queryParams ? queryParams + '&' : '?'}t=${Date.now()}`)
      ]);
      setDeptSummary(deptSummaryRes.data || []);
      setEmployees(empRes.data || []);
      setTrainings(trainRes.data || []);
      setOjtRecords(ojtRes.data || []);
      setTimelineRaw(timelineRes.data || { ojt: [], standard: [] });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    
    // Live update every 5 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [dashboardFilter]);

  const currentMonth = new Date().getMonth();
  const upcomingBirthdays = employees.filter(emp => {
    if (!emp.date_of_birth) return false;
    let monthIndex;
    if (typeof emp.date_of_birth === 'string' && emp.date_of_birth.includes('-')) {
        monthIndex = parseInt(emp.date_of_birth.split('T')[0].split('-')[1], 10) - 1;
    } else {
        monthIndex = new Date(emp.date_of_birth).getMonth();
    }
    return monthIndex === selectedMonth;
  }).sort((a, b) => new Date(a.date_of_birth).getDate() - new Date(b.date_of_birth).getDate());
  const upcomingAnniversaries = employees.filter(emp => {
    if (!emp.join_date) return false;
    let monthIndex;
    if (typeof emp.join_date === 'string' && emp.join_date.includes('-')) {
        monthIndex = parseInt(emp.join_date.split('T')[0].split('-')[1], 10) - 1;
    } else {
        monthIndex = new Date(emp.join_date).getMonth();
    }
    return monthIndex === selectedMonth;
  }).sort((a, b) => new Date(a.join_date).getDate() - new Date(b.join_date).getDate());

  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Calculate dynamic data
  const totalEmployees = employees.filter(e => e.status !== 'Inactive').length;
  
  // Calculate total training hours from employees
  let totalHours = 0;
  let ojtTotalHours = 0;
  let standardTotalHours = 0;
  
  const deptHoursMap = {};
  const housekeepingHoursMap = {};

  employees.filter(e => e.status === 'Active').forEach(emp => {
    const total = Number(emp.total_training_hours) || 0;
    const ojt = Number(emp.ojt_hours) || 0;
    const standard = Number(emp.standard_training_hours) || 0;
    
    totalHours += total;
    ojtTotalHours += ojt;
    standardTotalHours += standard;
    
    const dept = emp.department || 'Other';
    deptHoursMap[dept] = (deptHoursMap[dept] || 0) + total;

    if (dept === 'Rooms' || dept === 'Housekeeping') {
      const desig = emp.designation || 'Staff';
      housekeepingHoursMap[desig] = (housekeepingHoursMap[desig] || 0) + total;
    }
  });

  const departmentData = Object.keys(deptHoursMap).map(key => ({
    name: key,
    hours: deptHoursMap[key]
  })).filter(d => d.hours > 0);

  const deptPercentageData = departmentData.map(d => ({
    name: d.name,
    percentage: totalHours > 0 ? Number(((d.hours / totalHours) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.percentage - a.percentage);

  const housekeepingData = Object.keys(housekeepingHoursMap).map(key => ({
    name: key,
    hours: housekeepingHoursMap[key]
  })).filter(d => d.hours > 0).sort((a, b) => b.hours - a.hours);

  // OJT Performance Data
  const ojtPassed = ojtRecords.filter(r => r.pass_fail).length;
  const ojtFailed = ojtRecords.length > 0 ? ojtRecords.length - ojtPassed : 0;
  const ojtChartData = ojtRecords.length > 0 ? [
    { name: 'Passed', value: ojtPassed },
    { name: 'Failed', value: ojtFailed }
  ] : [];
  const OJT_COLORS = ['#10B981', '#EF4444']; 

  // Calculate active trainings this month
  const activeTrainings = trainings.filter(t => {
    if (!t.training_date) return false;
    if (!dashboardFilter) {
      return new Date(t.training_date).getMonth() === new Date().getMonth() && new Date(t.training_date).getFullYear() === new Date().getFullYear();
    }
    return true; // If filtered by API, just count all of them
  });

  const completionRate = totalHours > 0 ? Math.min(100, Math.round((totalHours / (totalEmployees * 2)) * 100)) : 0;

  // Process Timeline Data
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return `W${weekNo} ${d.getUTCFullYear()}`;
  };

  const processTimeline = () => {
    const groups = {};
    const allRecords = [...(timelineRaw.ojt || []), ...(timelineRaw.standard || [])];
    
    allRecords.forEach(rec => {
      if (!rec.date) return;
      const d = new Date(rec.date);
      let key = '';
      if (timelineFilter === 'Date') {
        key = d.toISOString().split('T')[0];
      } else if (timelineFilter === 'Week') {
        key = getWeekNumber(d);
      } else {
        key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }
      
      if (!groups[key]) groups[key] = { name: key, OJT: 0, Standard: 0 };
      
      const hrs = Number(rec.duration) / 60.0;
      if (rec.type === 'ojt') {
        groups[key].OJT += hrs;
      } else {
        groups[key].Standard += hrs;
      }
    });

    const sortedData = Object.values(groups).sort((a,b) => {
      if (timelineFilter === 'Date') return new Date(a.name) - new Date(b.name);
      return 0; // simple sort for now
    });
    
    if (sortedData.length === 0) {
      return [{ name: 'No Data', OJT: 0, Standard: 0 }];
    }
    
    return sortedData.map(d => ({
      name: d.name,
      OJT: Number(d.OJT.toFixed(1)),
      Standard: Number(d.Standard.toFixed(1))
    }));
  };

  const trainingData = processTimeline();

  const stats = [
    { title: 'Total Employees', value: totalEmployees.toString(), icon: Users, trend: 'Updated dynamically' },
    { title: 'Active Trainings', value: activeTrainings.length.toString(), icon: BookOpen, trend: !dashboardFilter ? 'This month' : 'Selected month' },
    { title: 'Total Training Hours', value: totalHours.toFixed(1), icon: Clock, trend: `${ojtTotalHours.toFixed(1)} OJT / ${standardTotalHours.toFixed(1)} Std` },
    { title: 'Est. Completion', value: `${completionRate}%`, icon: CheckCircle2, trend: 'Based on targets' }
  ];

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-400">Overview of hotel-wide training metrics and compliance.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 print:hidden bg-brand-card border border-gray-700 px-4 py-2 rounded-lg font-medium focus-within:border-brand-primary">
            <span className="text-gray-400 text-sm">Month:</span>
            <input 
              type="month" 
              value={dashboardFilter} 
              onChange={(e) => setDashboardFilter(e.target.value)}
              className="bg-transparent text-blue-200 outline-none w-[130px] cursor-pointer"
              style={{ colorScheme: 'dark' }}
            />
            {dashboardFilter && (
              <button 
                onClick={() => setDashboardFilter('')} 
                className="text-gray-500 hover:text-red-400 text-xs ml-2 px-2 py-1 rounded bg-gray-800"
              >
                Clear
              </button>
            )}
            {!dashboardFilter && (
              <span className="text-brand-primary text-xs ml-2 px-2 py-1 bg-brand-primary/10 rounded">All Time</span>
            )}
          </div>
          <button onClick={() => window.print()} className="print:hidden flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-blue-200 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700">
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <div className="hidden md:flex items-center gap-2 bg-brand-card border border-gray-800 px-4 py-2 rounded-lg print:hidden">
            <Award className="w-5 h-5 text-brand-primary" />
            
          </div>
        </div>
      </header>

      
      {/* AI Today's Birthdays Widget */}
      {birthdays && birthdays.length > 0 && (
        <div className="bg-gradient-to-r from-brand-card to-[#2a1b00] border border-brand-primary/40 rounded-2xl p-6 mb-10 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-brand-primary mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
            Today's Birthdays
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
            {birthdays.map((emp, i) => (
              <div key={i} className="bg-black/40 border border-brand-primary/20 rounded-xl p-5 hover:border-brand-primary/50 transition-colors flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 shrink-0">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-brand-primary font-bold text-lg">{emp.full_name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-100 text-lg">{emp.full_name}</h3>
                    <p className="text-xs text-brand-primary font-semibold uppercase tracking-wider">Happy Birthday!</p>
                  </div>
                </div>
                {emp.wish && (
                  <div className="text-sm text-gray-300 italic bg-brand-primary/5 p-4 rounded-lg border-l-2 border-brand-primary">
                    "{emp.wish}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-brand-card rounded-2xl p-6 border border-gray-800 relative overflow-hidden group hover:border-brand-primary/30 transition-colors duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-24 h-24 text-brand-primary" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-brand-primaryLight text-brand-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-blue-200 mb-1">{stat.value}</h3>
                  <p className="text-sm font-medium text-gray-400 mb-4">{stat.title}</p>
                  <p className="text-xs text-brand-primary flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Wise KPI Tiles */}
      <div className="mb-10 print:hidden">
        <h2 className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-brand-primary" /> Department Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {deptSummary.length > 0 ? deptSummary.map(d => {
            if (d.totalEmployees === 0 && d.totalHours === 0 && d.activeTopicCount === 0) return null;
            
            return (
              <div key={d.dept} className="bg-[#181818] border border-gray-800 rounded-2xl p-5 hover:border-brand-primary/30 transition-colors shadow-lg group">
                <h3 className="text-lg font-bold text-blue-200 mb-4 pb-2 border-b border-gray-800 group-hover:border-brand-primary/30 transition-colors">{d.dept}</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-900 rounded-xl py-2">
                    <p className="text-xl font-bold text-gray-200">{d.totalEmployees}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Staff</p>
                  </div>
                  <div className="bg-brand-primary/10 rounded-xl py-2 border border-brand-primary/20">
                    <p className="text-xl font-bold text-brand-primary">{d.activeTopicCount}</p>
                    <p className="text-[10px] text-brand-primary/70 font-bold uppercase tracking-wider mt-1">Active</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-xl py-2 border border-yellow-500/20">
                    <p className="text-xl font-bold text-yellow-500">{d.totalHours.toFixed(1)}</p>
                    <p className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-wider mt-1">Hours</p>
                  </div>
                </div>
              </div>
            );
          }) : <div className="text-gray-500 p-4 col-span-4 text-center border border-dashed border-gray-700 rounded-xl">Loading department statistics...</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Main Chart */}
        <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-blue-200">Training Completion Overview</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={timelineFilter} 
                onChange={e => setTimelineFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg text-blue-200 px-3 py-1.5 focus:outline-none focus:border-brand-primary text-sm"
              >
                <option value="Date">By Date</option>
                <option value="Week">By Week</option>
                <option value="Month">By Month</option>
              </select>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} axisLine={false} />
                <YAxis stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#ccc', fontSize: '12px' }} />
                <Bar dataKey="Standard" stackId="a" fill="#D4AF37" radius={[0, 0, 0, 0]} />
                <Bar dataKey="OJT" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart */}
        <div className="bg-brand-card rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold text-blue-200 mb-6">Training Hours by Department</h2>
          <div className="h-72">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="4" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.8"/>
                      <feDropShadow dx="-1" dy="-1" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.2"/>
                    </filter>
                    <filter id="shadowBase" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.6"/>
                      <feDropShadow dx="-1" dy="-1" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.1"/>
                    </filter>
                  </defs>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="hours"
                    stroke="none"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    filter="url(#shadowBase)"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">No training data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Secondary Bar Chart */}
        <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 lg:col-span-1">
          <h2 className="text-lg font-bold text-blue-200 mb-6">Rooms Division Training Breakdown</h2>
          <div className="h-80">
            {housekeepingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={housekeepingData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <filter id="shadowBar1" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="4" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.7"/>
                      <feDropShadow dx="-1" dy="-1" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.15"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#666" tick={{fill: '#888'}} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#666" tick={{fill: '#ccc'}} axisLine={false} tickLine={false} width={100} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff' }}
                  />
                  <Bar dataKey="hours" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={24} filter="url(#shadowBar1)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">No Rooms division data available</div>
            )}
          </div>
        </div>

        {/* Third Chart: Training % by Department */}
        <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 lg:col-span-1">
          <h2 className="text-lg font-bold text-blue-200 mb-6">Training % by Department</h2>
          <div className="h-80">
            {deptPercentageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptPercentageData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <filter id="shadowBar2" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="4" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.7"/>
                      <feDropShadow dx="-1" dy="-1" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.15"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#666" tick={{fill: '#888'}} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#666" tick={{fill: '#ccc'}} axisLine={false} tickLine={false} width={100} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff' }}
                    formatter={(value) => `${value}%`}
                  />
                  <Bar dataKey="percentage" fill="#CD853F" radius={[0, 4, 4, 0]} barSize={24} filter="url(#shadowBar2)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Fourth Chart: OJT Performance */}
        <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 lg:col-span-1">
          <h2 className="text-lg font-bold text-blue-200 mb-6">OJT Assessment Results</h2>
          <div className="h-80">
            {ojtChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="shadowOJT" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.6"/>
                    </filter>
                  </defs>
                  <Pie
                    data={ojtChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    filter="url(#shadowOJT)"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {ojtChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={OJT_COLORS[index % OJT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#ccc', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">No OJT data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Birthday Widget */}
      <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 mb-10 border-t-4 border-t-pink-500 shadow-[0_10px_30px_rgba(236,72,153,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-500">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-200">Team Birthdays</h2>
              <p className="text-sm text-gray-400">Celebrate with your team!</p>
            </div>
          </div>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-[#181818] border border-gray-800 rounded-lg text-blue-200 px-4 py-2 focus:outline-none focus:border-pink-500 max-w-xs"
          >
            {monthNames.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
        
        {upcomingBirthdays.length === 0 ? (
          <div className="text-center p-6 text-gray-500 border border-dashed border-gray-700 rounded-xl">
            No birthdays this month.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingBirthdays.map(emp => (
              <div key={emp.id} className="flex items-center gap-4 bg-[#181818] p-4 rounded-xl border border-gray-800 hover:border-pink-500/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-pink-500/10 text-pink-500 font-bold flex items-center justify-center border border-pink-500/20">
                  {new Date(emp.date_of_birth).getDate()}
                </div>
                <div>
                  <h4 className="text-blue-200 font-bold text-sm truncate w-32">{emp.full_name}</h4>
                  <p className="text-xs text-gray-400">{emp.department || 'Staff'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work Anniversary Widget */}
      <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 mb-10 border-t-4 border-t-cyan-500 shadow-[0_10px_30px_rgba(6,182,212,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-200">Work Anniversaries</h2>
              <p className="text-sm text-gray-400">Celebrate loyalty and milestones!</p>
            </div>
          </div>
        </div>
        
        {upcomingAnniversaries.length === 0 ? (
          <div className="text-center p-6 text-gray-500 border border-dashed border-gray-700 rounded-xl">
            No work anniversaries this month.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingAnniversaries.map(emp => {
              let yearJoined = new Date().getFullYear();
              if (typeof emp.join_date === 'string' && emp.join_date.includes('-')) {
                  yearJoined = parseInt(emp.join_date.split('T')[0].split('-')[0], 10);
              } else {
                  yearJoined = new Date(emp.join_date).getFullYear();
              }
              const yearsOfService = new Date().getFullYear() - yearJoined;
              
              return (
              <div key={emp.id + '-anniv'} className="flex items-center gap-4 bg-[#181818] p-4 rounded-xl border border-gray-800 hover:border-cyan-500/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-500 font-bold flex items-center justify-center border border-cyan-500/20 text-sm text-center leading-tight">
                  {yearsOfService > 0 ? yearsOfService + ' Yr' : 'New'}
                </div>
                <div>
                  <h4 className="text-blue-200 font-bold text-sm truncate w-32">{emp.full_name}</h4>
                  <p className="text-xs text-gray-400">{new Date(emp.join_date).getDate()} {monthNames[selectedMonth]}</p>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

    </div>
  );
}
