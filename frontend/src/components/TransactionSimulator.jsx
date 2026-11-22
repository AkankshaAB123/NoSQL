import React, { useState } from 'react';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Globe,
  Smartphone,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Users,
  Info,
} from 'lucide-react';

export default function TransactionSimulator({
  usersList = [],
  onSimulate,
  onToggleBlacklist,
  onSelectUser,
}) {
  const [senderAccId, setSenderAccId] = useState('ACC-101');
  const [receiverAccId, setReceiverAccId] = useState('ACC-301');
  const [amount, setAmount] = useState('7500');
  const [deviceHash, setDeviceHash] = useState('DEV-CLEAN-01');
  const [ip, setIp] = useState('185.220.101.4');
  const [isVpn, setIsVpn] = useState(true);
  const [ipCountry, setIpCountry] = useState('NL');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Find sender and receiver user info
  const sender = usersList.find((u) => u.accountId === senderAccId);
  const receiver = usersList.find((u) => u.accountId === receiverAccId);

  // Projected Risk Calculation Preview
  const projectedBlacklistRisk = receiver?.isBlacklisted ? 50 : 0;
  const projectedVpnRisk = isVpn && ipCountry !== sender?.country ? 30 : 0;
  const projectedTotalRisk = projectedBlacklistRisk + projectedVpnRisk;
  const projectedStatus = projectedTotalRisk >= 50 ? 'FLAGGED' : 'COMPLETED';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await onSimulate({
        senderAccId,
        receiverAccId,
        amount: parseFloat(amount),
        deviceHash,
        ip,
        isVpn,
        ipCountry,
      });
      setResult(res.transaction);
    } catch (err) {
      setError(err.message || 'Transaction simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080d19] rounded-xl border border-slate-800 overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs uppercase font-bold tracking-wider text-slate-200">
              Live Transaction Simulator & Risk Engine
            </h2>
            <p className="text-[11px] text-slate-400">Dynamic Cypher MERGE & real-time risk scorer</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Simulation Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Sender Account */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Sender Account
              </label>
              <select
                value={senderAccId}
                onChange={(e) => setSenderAccId(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {usersList.map((u) => (
                  <option key={u.accountId} value={u.accountId}>
                    {u.accountId} — {u.name} (₹{Number(u.balance || 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
              {sender && (
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Country: <strong className="text-slate-200">{sender.country}</strong></span>
                  <span>ID: <strong className="text-cyan-400 font-mono">{sender.userId}</strong></span>
                </div>
              )}
            </div>

            {/* Receiver Account */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Receiver Account
              </label>
              <select
                value={receiverAccId}
                onChange={(e) => setReceiverAccId(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {usersList.map((u) => (
                  <option key={u.accountId} value={u.accountId}>
                    {u.accountId} — {u.name} {u.isBlacklisted ? '⛔ (BLACKLISTED)' : ''}
                  </option>
                ))}
              </select>
              {receiver && (
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Status: <strong className={receiver.isBlacklisted ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {receiver.isBlacklisted ? 'BLACKLISTED (+50 Risk)' : 'Clean'}
                  </strong></span>
                  <span>ID: <strong className="text-cyan-400 font-mono">{receiver.userId}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Amount & Currency */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Transfer Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-mono">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                step="any"
                className="w-full bg-slate-950/90 border border-slate-700 text-slate-100 text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="7500"
              />
            </div>
          </div>

          {/* Device & Quick Picks */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Device Fingerprint Hash
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDeviceHash('DEV-CLEAN-01')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                >
                  DEV-CLEAN-01
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceHash('DEV-SPOOF-999')}
                  className="px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
                >
                  DEV-SPOOF-999
                </button>
              </div>
            </div>
            <input
              type="text"
              value={deviceHash}
              onChange={(e) => setDeviceHash(e.target.value)}
              required
              className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* IP, VPN Toggle, and IP Country */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* IP Address */}
            <div className="md:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                IP Address
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                required
                className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* VPN Toggle */}
            <div className="md:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                VPN Active
              </label>
              <button
                type="button"
                onClick={() => setIsVpn(!isVpn)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                  isVpn
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isVpn ? 'VPN ENABLED (+30)' : 'VPN DISABLED'}</span>
              </button>
            </div>

            {/* IP Country */}
            <div className="md:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                IP Origin Country
              </label>
              <select
                value={ipCountry}
                onChange={(e) => setIpCountry(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="IN">IN — India (Domestic)</option>
                <option value="NL">NL — Netherlands (VPN Exit)</option>
                <option value="DE">DE — Germany (VPN Exit)</option>
                <option value="US">US — United States (VPN Exit)</option>
                <option value="GB">GB — United Kingdom</option>
                <option value="SG">SG — Singapore</option>
              </select>
            </div>
          </div>

          {/* Risk Prediction Preview Banner */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info className="w-3 h-3 text-cyan-400" /> Real-Time Scoring Projection:
              </div>
              <div className="text-slate-300 text-[11px]">
                Blacklist ({projectedBlacklistRisk}) + VPN Geo Mismatch ({projectedVpnRisk})
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Projected Score</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {projectedTotalRisk} / 100
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider font-mono ${
                  projectedStatus === 'FLAGGED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-cyber-rose'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {projectedStatus}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyber-cyan transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Cypher MERGE on AuraDB...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Simulate & Execute Graph Transfer</span>
              </>
            )}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Execution Result Card */}
        {result && (
          <div
            className={`p-4 rounded-xl border transition animate-fade-in ${
              result.status === 'FLAGGED'
                ? 'bg-rose-950/40 border-rose-500/50 shadow-cyber-rose'
                : 'bg-emerald-950/40 border-emerald-500/50 shadow-cyber-emerald'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {result.status === 'FLAGGED' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                )}
                <span className="font-bold text-sm text-white">
                  Transfer Created: {result.txId}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                  result.status === 'FLAGGED'
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {result.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Sender</span>
                <span className="font-semibold text-slate-200">{result.senderName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Receiver</span>
                <span className="font-semibold text-slate-200">{result.receiverName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Risk Score</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {result.riskScore}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Graph Edge</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  (:Account)-[:INITIATED]-&gt;(:Transaction)
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => onSelectUser(sender?.userId || 'U-101')}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Inspect updated sender subgraph →
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Investigator Blacklist Quick-Controls */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Investigator Blacklist Controls
            </h3>
            <span className="text-[10px] text-slate-500">Instant AuraDB mutation</span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3">
            Toggling blacklist immediately alters user risk score (100 vs 10). Any subsequent transfers received by a blacklisted account incur an automatic +50 risk score penalty!
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {usersList.slice(0, 8).map((u) => (
              <div
                key={u.userId}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400">{u.userId}</span>
                  <span className="text-slate-300">{u.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({u.accountId})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      u.isBlacklisted
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {u.isBlacklisted ? 'BLACKLISTED' : 'CLEAN'}
                  </span>
                  <button
                    onClick={() => onToggleBlacklist(u.userId, !u.isBlacklisted)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      u.isBlacklisted
                        ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                        : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {u.isBlacklisted ? 'Clear' : 'Blacklist'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
