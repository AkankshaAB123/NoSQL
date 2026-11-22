import React, { useState } from 'react';
import {
  RefreshCw,
  Repeat,
  Smartphone,
  Share2,
  AlertTriangle,
  ArrowRight,
  Eye,
  ShieldAlert,
  Globe,
  IndianRupee,
  Users,
} from 'lucide-react';

export default function FraudAlertsPanel({
  rings = [],
  sharedDevices = [],
  mules = [],
  onSelectUser,
  loading,
}) {
  const [activeTab, setActiveTab] = useState('rings');

  return (
    <div className="flex flex-col h-full bg-[#080d19] rounded-xl border border-slate-800 overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs uppercase font-bold tracking-wider text-slate-200">
              Fraud Intelligence Feeds
            </h2>
            <p className="text-[11px] text-slate-400">Live graph topology pattern matchers</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
        <button
          onClick={() => setActiveTab('rings')}
          className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'rings'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-cyber-rose font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Circular Rings</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-200 font-mono">
            {rings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'devices'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Device Hubs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-200 font-mono">
            {sharedDevices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mules')}
          className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'mules'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Money Mules</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/30 text-purple-200 font-mono">
            {mules.length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading && (
          <div className="flex items-center justify-center h-32 text-xs text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 mr-2" />
            Evaluating Cypher patterns in Neo4j...
          </div>
        )}

        {/* Tab 1: Circular Money Laundering Rings */}
        {activeTab === 'rings' && (
          <div className="space-y-3">
            {rings.length === 0 && !loading && (
              <div className="text-center py-8 text-xs text-slate-500">
                No active 3-hop circular rings detected in AuraDB.
              </div>
            )}
            {rings.map((ring, idx) => {
              const retained = ring.initialAmount > 0
                ? ((ring.returnedAmount / ring.initialAmount) * 100).toFixed(1)
                : 0;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-rose-500/30 hover:border-rose-500/60 transition group space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                      <Repeat className="w-3 h-3" /> 3-Hop Closed Cycle
                    </span>
                    <button
                      onClick={() => onSelectUser(ring.originUserId || 'U-201')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white transition flex items-center gap-1 border border-rose-500/40"
                    >
                      <Eye className="w-3 h-3" /> Inspect Ring
                    </button>
                  </div>

                  {/* Ring Members Flow */}
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 mb-1 font-medium">Flow Topology:</div>
                    <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                        {ring.ringMembers[0]} (U-201)
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {ring.ringMembers[1]}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {ring.ringMembers[2]}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                        Cycle Return (U-201)
                      </span>
                    </div>
                  </div>

                  {/* Amounts & Retention */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Initial Outflow</span>
                      <span className="font-mono font-bold text-white">
                        ₹{Number(ring.initialAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Returned</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{Number(ring.returnedAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Retained</span>
                      <span className="font-mono font-bold text-amber-400">{retained}%</span>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <span>TX Chain:</span>
                    <span className="text-slate-300">{(ring.transactionIds || []).join(' → ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Shared Device Hubs (VPN-Hopping) */}
        {activeTab === 'devices' && (
          <div className="space-y-3">
            {sharedDevices.length === 0 && !loading && (
              <div className="text-center py-8 text-xs text-slate-500">
                No shared devices with ≥3 users found.
              </div>
            )}
            {sharedDevices.map((dev, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-500/30 hover:border-amber-500/60 transition group space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> {dev.deviceHash}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-rose-400">
                      {dev.userCount} Linked Users
                    </span>
                  </div>

                  {dev.userIds?.length > 0 && (
                    <button
                      onClick={() => onSelectUser(dev.userIds[0])}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-white transition flex items-center gap-1 border border-amber-500/40"
                    >
                      <Eye className="w-3 h-3" /> Inspect {dev.userIds[0]}
                    </button>
                  )}
                </div>

                {/* Users on this device */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 mb-1 font-medium">Shared Across Accounts:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(dev.userNames || []).map((name, i) => (
                      <span
                        key={i}
                        onClick={() => dev.userIds && onSelectUser(dev.userIds[i])}
                        className="px-2 py-0.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono cursor-pointer transition flex items-center gap-1"
                        title="Click to view subgraph"
                      >
                        <Users className="w-3 h-3 text-cyan-400" />
                        {name} ({dev.userIds?.[i]})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rotating VPN Exit Nodes */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1 font-medium">
                    <Globe className="w-3 h-3 text-purple-400" /> Rotating VPN Exit IPs:
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                    {(dev.ipsUsed || []).map((ip, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30"
                      >
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Money Mules (Smurfing Fan-In) */}
        {activeTab === 'mules' && (
          <div className="space-y-3">
            {mules.length === 0 && !loading && (
              <div className="text-center py-8 text-xs text-slate-500">
                No money mule accounts with ≥5 senders detected.
              </div>
            )}
            {mules.map((mule, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-purple-500/30 hover:border-purple-500/60 transition group space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> Fan-In Smurfing Node
                  </span>
                  <button
                    onClick={() => onSelectUser(mule.userId)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 hover:bg-purple-500 text-purple-200 hover:text-white transition flex items-center gap-1 border border-purple-500/40"
                  >
                    <Eye className="w-3 h-3" /> Inspect Mule
                  </button>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Mule Holder:</span>
                    <span className="font-semibold text-white">{mule.muleName} ({mule.userId})</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Target Account:</span>
                    <span className="font-mono text-cyan-400 font-bold">{mule.accountId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Unique Senders</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      {mule.uniqueSenders} Accounts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Aggregated</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₹{Number(mule.totalReceived).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
