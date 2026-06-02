import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Search, Plus, MoreVertical, Mail, Upload, FileSpreadsheet, AlertCircle, X, Edit } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  const [formData, setFormData] = useState({
    emp_no: '', full_name: '', department: '', designation: '', join_date: '', date_of_birth: '', photo: null
  });
  const fileInputRef = useRef(null);

  
  const handleEdit = (emp) => {
    setFormData({
      ...emp,
      join_date: emp.join_date ? new Date(emp.join_date).toISOString().split('T')[0] : '',
      date_of_birth: emp.date_of_birth ? new Date(emp.date_of_birth).toISOString().split('T')[0] : '',
      photo: null
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      await axios.post('/api/employees/upload', data);
      alert('Excel file processed successfully');
      fetchEmployees();
    } catch (err) {
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });

      if (isEditing) {
        await axios.put(`/api/employees/${formData.emp_no}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/employees', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      setIsEditing(false);
      setFormData({ emp_no: '', full_name: '', department: '', designation: '', join_date: '', date_of_birth: '', photo: null });
      fetchEmployees();
    } catch (err) {
      alert('Error adding employee');
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Staff Directory</h1>
          <p className="text-gray-400">Manage your luxury hotel staff, roles, and training records.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff..." 
              className="pl-10 pr-4 py-2 bg-brand-card border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold w-full md:w-48 lg:w-64 transition-all"
            />
          </div>
          
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-brand-card border border-gray-800 rounded-lg text-white px-4 py-2 focus:outline-none focus:border-brand-gold"
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
            </select>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 border border-gray-700 transition-colors"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
                Import Excel
              </>
            )}
          </button>
          
          <button 
            onClick={() => setShowModal(true)}
            className="bg-brand-gold hover:bg-brand-goldHover text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>
      </header>

      {/* Info Banner */}
      <div className="mb-6 bg-brand-goldLight border border-brand-gold/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-brand-gold font-medium">Excel Bulk Import Available</h4>
          <p className="text-sm text-gray-300 mt-1">You can now import massive staff directories via Excel. Ensure columns are named: Emp No, Name, Designation, Email.</p>
        </div>
      </div>

      <div className="bg-brand-card rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-gold"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#181818] border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  <th className="p-4 pl-6 text-[11px] text-gray-400 font-bold tracking-wider">EMP NO</th>
                  <th className="p-4 text-[11px] text-gray-400 font-bold tracking-wider">NAME</th>
                  <th className="p-4 text-[11px] text-gray-400 font-bold tracking-wider">POSITION</th>
                  <th className="p-4 text-[11px] text-gray-400 font-bold tracking-wider">DATE OF JOINED</th>
                  <th className="p-4 text-[11px] text-gray-400 font-bold tracking-wider">DATE OF BIRTH</th>
<th className="p-4 text-[11px] text-gray-400 font-bold tracking-wider text-right"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-800/50">
                {(() => {
                  const filteredEmployees = employees.filter(emp => {
                    const matchesSearch = (emp.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                                          (emp.emp_no?.toLowerCase() || '').includes(searchQuery.toLowerCase());
                    const deptVal = emp.department || emp.department_id || '';
                    const matchesDept = selectedDept === 'All' || deptVal === selectedDept;
                    return matchesSearch && matchesDept;
                  });

                  if (filteredEmployees.length === 0) {
                    return <tr><td colSpan="5" className="p-8 text-center text-gray-500">No employees found.</td></tr>;
                  }

                  return filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <p className="font-mono font-bold text-brand-gold">{emp.emp_no || '—'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {emp.photo_url ? (
                          <img src={`/${emp.photo_url}`} alt={emp.full_name} className="w-9 h-9 rounded-full object-cover border border-gray-700" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 text-brand-gold flex items-center justify-center font-bold text-sm">
                            {emp.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">{emp.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-300 text-sm font-medium">{emp.designation || 'Staff'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-300 text-sm">{emp.join_date ? new Date(emp.join_date).toLocaleDateString() : '—'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-300 text-sm">{emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString() : '—'}</p>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(emp)} className="text-gray-500 hover:text-brand-gold p-1.5 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-gray-800 rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => {setShowModal(false); setIsEditing(false); setFormData({ emp_no: '', full_name: '', department: '', designation: '', join_date: '', date_of_birth: '', photo: null });}} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">{isEditing ? 'Edit Staff' : 'Add New Staff'}</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Employee No</label>
                <input required type="text" disabled={isEditing} value={formData.emp_no || ''} onChange={(e) => setFormData({...formData, emp_no: e.target.value})} className={`w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                <input required type="text" value={formData.full_name || ''} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Designation</label>
                <input required type="text" value={formData.designation || ''} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <select required value={formData.department || ''} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none">
                  <option value="">Select Department</option>
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
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date of Join</label>
                <input required type="date" value={formData.join_date} onChange={(e) => setFormData({...formData, join_date: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
                <input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Employee Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, photo: e.target.files[0]})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none text-sm" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-brand-gold hover:bg-brand-goldHover text-black py-2.5 rounded-lg font-bold transition-colors">
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}








