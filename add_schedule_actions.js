const fs = require('fs');
let schedule = fs.readFileSync('frontend/src/pages/Schedule.jsx', 'utf8');

// Insert handleEditClick and handleDeleteSession
const oldFunctions = `  const handleUpdateSession = async () => {`;
const newFunctions = `  const handleEditClick = async (session) => {
    try {
      const res = await axios.get(\`/api/trainings/\${session.id}/allocations\`);
      setViewSessionModal({ show: true, session, allocations: res.data });
      setEditSessionData(session);
      setIsEditingSession(true);
    } catch (err) { alert('Failed to load session'); }
  };

  const handleDeleteSession = async (id) => {
    if (window.confirm('Are you sure you want to delete this training session? This will also remove any staff allocations to this session.')) {
      try {
        await axios.delete(\`/api/trainings/\${id}\`);
        fetchSchedules();
      } catch (err) {
        alert('Error deleting session: ' + err.message);
      }
    }
  };

  const handleUpdateSession = async () => {`;
schedule = schedule.replace(oldFunctions, newFunctions);

// Update table header
const oldHeader = `<th className="p-4 font-semibold text-right">Venue</th>
              </tr>`;
const newHeader = `<th className="p-4 font-semibold">Venue</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>`;
schedule = schedule.replace(oldHeader, newHeader);

// Update table colSpan
const oldEmpty = `<td colSpan="5" className="p-8 text-center text-gray-500">`;
const newEmpty = `<td colSpan="6" className="p-8 text-center text-gray-500">`;
schedule = schedule.replace(oldEmpty, newEmpty);

// Update table row
const oldRow = `<td className="p-4 text-right text-gray-400">{session.venue || 'N/A'}</td>
                  </tr>`;
const newRow = `<td className="p-4 text-gray-400">{session.venue || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(session); }} className="text-gray-500 hover:text-brand-primary p-1.5 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="text-gray-500 hover:text-red-500 p-1.5 rounded bg-gray-800/50 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>`;
schedule = schedule.replace(oldRow, newRow);

fs.writeFileSync('frontend/src/pages/Schedule.jsx', schedule, 'utf8');
console.log('Successfully added actions to Detailed Schedule table');
