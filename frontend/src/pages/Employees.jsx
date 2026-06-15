import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { Search, Plus, MoreVertical, Mail, Upload, FileSpreadsheet, AlertCircle, X, Edit, Trash2, Lock } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showEncryptedModal, setShowEncryptedModal] = useState(false);
  const [excelPassword, setExcelPassword] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [formData, setFormData] = useState({
    emp_no: '', full_name: '', department: '', designation: '', join_date: '', date_of_birth: '', photo: null
  });
  const fileInputRef = useRef(null);

  
  
  const uniquePositions = [...new Set(employees.map(e => e.designation).filter(Boolean))].sort();
  
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

  const handleDelete = async (emp) => {
    if (window.confirm(`Are you sure you want to delete ${emp.full_name} (${emp.emp_no})? This will also remove their training and attendance records.`)) {
      try {
        await axios.delete(`/api/employees/${emp.emp_no}`);
        fetchEmployees();
      } catch (err) {
        alert('Error deleting employee: ' + (err.response?.data?.error || err.message));
      }
    }
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

  const handleEncryptedUpload = async (e) => {
    e.preventDefault();
    if (!excelFile || !excelPassword) {
      alert('Please select a file and enter the password.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('password', excelPassword);
      
      const res = await axios.post('/api/employees/bulk-encrypted-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message + '. Processed: ' + res.data.processed + ' Success: ' + res.data.success);
      setShowEncryptedModal(false);
      setExcelFile(null);
      setExcelPassword('');
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error decrypting or uploading file.');
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
        await axios.put(`/api/employees/${formData.original_emp_no || formData.emp_no}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/employees', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      setIsEditing(false);
      setFormData({ original_emp_no: '', emp_no: '', full_name: '', department: '', designation: '', join_date: '', date_of_birth: '', photo: null });
      fetchEmployees();
    } catch (err) {
      alert('Error adding employee: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight">Staff Directory</h1>
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
              className="pl-10 pr-4 py-2 bg-brand-card border border-gray-800 rounded-lg text-blue-200 placeholder-gray-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary w-full md:w-48 lg:w-64 transition-all"
            />
          </div>
          
          <select 
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
          
          
          
          <button 
            onClick={() => setShowModal(true)}
            className="bg-brand-primary hover:bg-brand-primaryHover text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>
      </header>

      <div className="bg-brand-card rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
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
                  <th className="p-4 text-[11px] text-gray-400 font-bold tracking-wider text-center">TRAINING HOURS</th>
                  <th className="p-4 text-[11px] text-gray-400 font-bold tracking-wider text-right">ACTIONS</th>
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
                    return <tr><td colSpan="7" className="p-8 text-center text-gray-500">No employees found.</td></tr>;
                  }

                  return filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <p className="font-mono font-bold text-brand-primary">{emp.emp_no || '—'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {emp.photo_url ? (
                          <img src={`/${emp.photo_url}`} alt={emp.full_name} className="w-9 h-9 rounded-full object-cover border border-gray-700" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 text-brand-primary flex items-center justify-center font-bold text-sm">
                            {emp.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-blue-200">{emp.full_name}</p>
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
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center bg-gray-800 border border-gray-700 text-brand-primary font-bold px-3 py-1 rounded-lg shadow-inner">
                        {Number(emp.total_training_hours || 0).toFixed(1)} <span className="text-gray-500 text-xs ml-1 font-normal">hrs</span>
                      </div>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(emp)} className="text-gray-500 hover:text-brand-primary p-1.5 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(emp)} className="text-gray-500 hover:text-red-500 p-1.5 rounded bg-gray-800/50 hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
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
          <div className="bg-brand-card border border-gray-800 rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => {setShowModal(false); setIsEditing(false); setFormData({ emp_no: '', full_name: '', department: '', designation: '', join_date: '', date_of_birth: '', photo: null });}} className="absolute top-4 right-4 text-gray-400 hover:text-blue-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-blue-200 mb-6">{isEditing ? 'Edit Staff' : 'Add New Staff'}</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Employee No</label>
                <input required type="text" value={formData.emp_no || ''} onChange={(e) => setFormData({...formData, emp_no: e.target.value})} className={`w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none`} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                <input required type="text" value={formData.full_name || ''} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Designation</label>
                <input required type="text" value={formData.designation || ''} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <select required value={formData.department || ''} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none">
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
                <input required type="date" value={formData.join_date} onChange={(e) => setFormData({...formData, join_date: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
                <input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Employee Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, photo: e.target.files[0]})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none text-sm" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primaryHover text-black py-2.5 rounded-lg font-bold transition-colors">
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
