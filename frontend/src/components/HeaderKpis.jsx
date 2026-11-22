import React from 'react';
import { Users, ArrowLeftRight, ShieldAlert, IndianRupee, RefreshCw, Database } from 'lucide-react';

export default function HeaderKpis({ stats, loading, onRefresh }) {
  const {
    totalUsers = 0,
    totalTransactions = 0,
    flaggedCount = 0,
    totalVolume = 0,
  } = stats || {};

  const flaggedPercentage = totalTransactions > 0 
    ? ((flaggedCount / totalTransactions) * 100).toFixed(1)
    : 0;

  return (
    <header className="border-b border-slate-800 bg-[#090e1a]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 shadow-cyber-cyan">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FinFraud
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AuraDB Graph
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Live Cluster:</span>
              <span className="font-mono text-slate-300">neo4j+s://08891cc5.databases.neo4j.io</span>
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Refresh All KPI and Alert Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Sync AuraDB'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Total Users */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium tracking-wide uppercase">Total Users</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {totalUsers.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">accounts</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Active identities tracked</div>
        </div>

        {/* Total Transactions */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium tracking-wide uppercase">Total Transactions</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {totalTransactions.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">events</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Reified graph transfer edges</div>
        </div>

        {/* Flagged Alerts */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-950/40 to-slate-900/80 border border-rose-500/30 hover:border-rose-500/50 shadow-cyber-rose transition relative overflow-hidden group">
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-xs font-medium tracking-wide uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Flagged Alerts
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-400 font-mono">
              {flaggedCount.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-rose-400/80 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              {flaggedPercentage}% rate
            </span>
          </div>
          <div className="mt-1 text-[11px] text-rose-300/60">Risk score ≥ 50 triggered</div>
        </div>

        {/* Total Volume */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium tracking-wide uppercase">Total Volume</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
              ₹{Number(totalVolume || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Transferred across graph</div>
        </div>
      </div>
    </header>
  );
}
