const fs = require('fs');
let audits = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');

const oldSubText = `<p className="text-sm text-gray-400 mt-1">Track monthly audit completion progress (Target: 60/month)</p>`;
const newSubText = `<p className="text-sm text-gray-400 mt-1">Track monthly audit completion progress (Target: 40/month)</p>`;
audits = audits.replace(oldSubText, newSubText);

const oldStayover = `<td className="p-4 text-center">
                        <div className="text-blue-200 font-bold">{b.stayoverCompleted} <span className="text-gray-500 font-normal">/ {b.stayoverTarget}</span></div>
                        <div className=\`text-xs font-bold mt-1 \${b.stayoverPending > 0 ? 'text-red-400' : 'text-emerald-400'}\`>
                          {b.stayoverPending > 0 ? \`\${b.stayoverPending} Pending\` : 'Completed'}
                        </div>
                      </td>`;

const newStayover = `<td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-blue-200 font-bold">{b.stayoverCompleted} <span className="text-gray-500 font-normal">/ {b.stayoverTarget}</span></div>
                          <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={\`h-full \${b.stayoverPending > 0 ? 'bg-red-500' : 'bg-emerald-500'}\`} style={{ width: \`\${Math.min(100, (b.stayoverCompleted / b.stayoverTarget) * 100)}%\` }}></div>
                          </div>
                          <div className={\`text-[10px] font-bold uppercase \${b.stayoverPending > 0 ? 'text-red-400' : 'text-emerald-400'}\`}>
                            {b.stayoverPending > 0 ? \`\${b.stayoverPending} Pending\` : 'Target Covered'}
                          </div>
                        </div>
                      </td>`;
audits = audits.replace(oldStayover, newStayover);

const oldDeparture = `<td className="p-4 text-center">
                        <div className="text-blue-200 font-bold">{b.departureCompleted} <span className="text-gray-500 font-normal">/ {b.departureTarget}</span></div>
                        <div className=\`text-xs font-bold mt-1 \${b.departurePending > 0 ? 'text-red-400' : 'text-emerald-400'}\`>
                          {b.departurePending > 0 ? \`\${b.departurePending} Pending\` : 'Completed'}
                        </div>
                      </td>`;

const newDeparture = `<td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-blue-200 font-bold">{b.departureCompleted} <span className="text-gray-500 font-normal">/ {b.departureTarget}</span></div>
                          <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={\`h-full \${b.departurePending > 0 ? 'bg-red-500' : 'bg-emerald-500'}\`} style={{ width: \`\${Math.min(100, (b.departureCompleted / b.departureTarget) * 100)}%\` }}></div>
                          </div>
                          <div className={\`text-[10px] font-bold uppercase \${b.departurePending > 0 ? 'text-red-400' : 'text-emerald-400'}\`}>
                            {b.departurePending > 0 ? \`\${b.departurePending} Pending\` : 'Target Covered'}
                          </div>
                        </div>
                      </td>`;
audits = audits.replace(oldDeparture, newDeparture);

fs.writeFileSync('frontend/src/pages/Audits.jsx', audits, 'utf8');
console.log('Successfully updated audit balance visuals');
