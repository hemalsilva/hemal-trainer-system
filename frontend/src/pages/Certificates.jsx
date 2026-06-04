import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Download, Upload, Trash2, Edit, CheckCircle, Smartphone } from 'lucide-react';

export default function Certificates() {
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // WhatsApp connection state
  const [waConnected, setWaConnected] = useState(false);

  useEffect(() => {
    fetchCertificates();
    checkWaStatus();
  }, [month, year]);

  const fetchCertificates = async () => {
    try {
      const res = await axios.get(`/api/certificates?month=${month}&year=${year}`);
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkWaStatus = async () => {
    try {
      const res = await axios.get('/api/whatsapp/status');
      setWaConnected(res.data.connected);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (id) => {
    window.open(`/api/certificates/generate/${id}`, '_blank');
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this certificate?')) {
      await axios.delete(`/api/certificates/${id}`);
      fetchCertificates();
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }
    try {
      await axios.post('/api/employees/photos/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Photos uploaded successfully!');
    } catch (err) {
      alert('Error uploading photos');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 flex items-center gap-3">
            <Award className="w-8 h-8 text-brand-primary" />
            Certificate Center
          </h1>
          <p className="text-gray-400">Manage and track employee training certificates.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* WhatsApp Status */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${waConnected ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            <Smartphone className="w-5 h-5" />
            <span className="font-semibold text-sm">WhatsApp: {waConnected ? 'Connected' : 'Disconnected'}</span>
          </div>

          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="bg-gray-800 border border-gray-700 text-blue-200 rounded-lg px-4 py-2">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="bg-gray-800 border border-gray-700 text-blue-200 rounded-lg px-4 py-2">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Training Topic</th>
                <th className="p-4 font-semibold">Issue Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {loading ? (
                <tr><td colSpan="5" className="text-center p-8">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-8 text-gray-500">No certificates found for this period.</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 overflow-hidden">
                          {record.photo_url ? <img src={`${record.photo_url}`} alt="Avatar" className="w-full h-full object-cover" /> : <Award className="w-5 h-5 text-gray-500" />}
                        </div>
                        <div>
                          <div className="font-semibold text-blue-200">{record.employee_name}</div>
                          <div className="text-sm text-gray-500">Emp #{record.emp_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-blue-200">{record.topic}</td>
                    <td className="p-4">{new Date(record.issue_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        <CheckCircle className="w-4 h-4" />
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDownload(record.id)} className="p-2 text-gray-400 hover:text-brand-primary hover:bg-gray-800 rounded-lg transition-colors" title="Download PDF">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(record.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Photo Upload UI */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-xl text-center">
        <Upload className="w-12 h-12 text-brand-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-blue-200 mb-2">Bulk Upload Employee Photos</h2>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          Select multiple image files named by their Employee Number (e.g., <code className="bg-gray-800 px-2 py-1 rounded text-gray-300">10245.jpg</code>). The system will automatically link them.
        </p>
        <label className="bg-brand-primary hover:bg-brand-primaryHover text-black font-bold py-3 px-8 rounded-xl cursor-pointer inline-flex items-center gap-2 transition-all shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-0.5">
          <Upload className="w-5 h-5" />
          Choose Photos
          <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </label>
      </div>

    </div>
  );
}
