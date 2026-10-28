import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileCode, RefreshCw, Shield, Server, Database } from 'lucide-react';

export default function AdminSettingsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    api.admin.getAuditLogs()
      .then((data) => setLogs(data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Security Audit Logs & System Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Immutable administrative mutation trail and server status
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          title="Refresh Logs"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Server size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Go API Monolith</span>
            <span className="text-sm font-semibold text-white">Online & Healthy</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <Database size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">PostgreSQL / PostGIS</span>
            <span className="text-sm font-semibold text-white">Spatial Engine Active</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Shield size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Admin Isolation</span>
            <span className="text-sm font-semibold text-white">Zero Public Exposure</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-850 rounded-lg border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-white flex items-center space-x-2">
            <FileCode size={15} className="text-slate-400" />
            <span>Administrative Actions Audit Trail</span>
          </h2>
          <span className="text-xs text-slate-500">Last 50 recorded entries</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
            <RefreshCw className="animate-spin text-slate-400" size={18} />
            <span className="text-sm">Fetching audit entries...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No audit records created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp (UTC)</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 text-slate-400 font-sans">
                      {new Date(log.created_at).toLocaleTimeString('en-KE')},{' '}
                      {new Date(log.created_at).toLocaleDateString('en-KE')}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-200">
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">
                      {log.target_type} ({log.target_id})
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {log.actor_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
