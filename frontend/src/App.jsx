import React, { useState, useEffect, useCallback } from 'react';
import HeaderKpis from './components/HeaderKpis';
import GraphCanvas from './components/GraphCanvas';
import FraudAlertsPanel from './components/FraudAlertsPanel';
import TransactionSimulator from './components/TransactionSimulator';
import {
  fetchStats,
  fetchFraudRings,
  fetchSharedDevices,
  fetchMoneyMules,
  fetchUserGraph,
  fetchUsers,
  simulateTransaction,
  toggleBlacklist,
} from './api';
import { CheckCircle2, AlertTriangle, ShieldCheck, Database, Layers } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState(null);
  const [rings, setRings] = useState([]);
  const [sharedDevices, setSharedDevices] = useState([]);
  const [mules, setMules] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Selected user for graph visualization (default: U-201 Circular Ring)
  const [selectedUserId, setSelectedUserId] = useState('U-201');
  const [expandedMode, setExpandedMode] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Load Users List
  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsersList(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, []);

  // Load Fraud Feeds (Rings, Shared Devices, Mules)
  const loadAlerts = useCallback(async () => {
    try {
      setLoadingAlerts(true);
      const [ringsData, devicesData, mulesData] = await Promise.all([
        fetchFraudRings(),
        fetchSharedDevices(),
        fetchMoneyMules(),
      ]);
      setRings(ringsData);
      setSharedDevices(devicesData);
      setMules(mulesData);
    } catch (err) {
      console.error('Failed to load fraud alerts:', err);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  // Load User Subgraph
  const loadGraph = useCallback(async (userId, expand) => {
    if (!userId) return;
    try {
      setLoadingGraph(true);
      const data = await fetchUserGraph(userId, expand);
      setGraphData(data);
    } catch (err) {
      console.error(`Failed to load graph for ${userId}:`, err);
      showToast(`Error loading graph for ${userId}`, 'error');
    } finally {
      setLoadingGraph(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadStats();
    loadUsers();
    loadAlerts();
  }, [loadStats, loadUsers, loadAlerts]);

  // Load Graph whenever selected user or expandedMode changes
  useEffect(() => {
    loadGraph(selectedUserId, expandedMode);
  }, [selectedUserId, expandedMode, loadGraph]);

  // Refresh All Data
  const handleRefreshAll = async () => {
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadAlerts(),
      loadGraph(selectedUserId, expandedMode),
    ]);
    showToast('Graph & Intelligence Feeds Synced with AuraDB');
  };

  // Select User
  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
  };

  // Handle Blacklist Toggle
  const handleToggleBlacklist = async (userId, newStatus) => {
    try {
      const updated = await toggleBlacklist(userId, newStatus);
      showToast(
        `User ${updated.name} (${userId}) ${newStatus ? 'BLACKLISTED' : 'CLEARED'} in AuraDB`,
        newStatus ? 'warning' : 'success'
      );
      // Refresh users list & KPIs & graph
      await loadUsers();
      await loadStats();
      await loadGraph(selectedUserId, expandedMode);
    } catch (err) {
      console.error('Blacklist toggle failed:', err);
      showToast(err.message || 'Failed to toggle blacklist', 'error');
    }
  };

  // Handle Transaction Simulation
  const handleSimulateTransaction = async (formData) => {
    const res = await simulateTransaction(formData);
    showToast(
      `Transaction ${res.transaction.txId} executed (${res.transaction.status})`,
      res.transaction.status === 'FLAGGED' ? 'warning' : 'success'
    );
    // Refresh KPIs and currently visualized graph
    await loadStats();
    await loadUsers();
    await loadAlerts();
    await loadGraph(selectedUserId, expandedMode);
    return res;
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border backdrop-blur-md text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-cyber-rose'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-cyber-emerald'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top KPI Header Bar */}
      <HeaderKpis stats={stats} loading={loadingStats} onRefresh={handleRefreshAll} />

      {/* Main Grid Workspace */}
      <main className="flex-1 p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 max-w-[1920px] mx-auto w-full">
        {/* Left Column: Interactive Graph Explorer (7 cols on large screens) */}
        <section className="xl:col-span-7 flex flex-col min-h-[620px]">
          <GraphCanvas
            graphData={graphData}
            loading={loadingGraph}
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
            usersList={usersList}
            onToggleBlacklist={handleToggleBlacklist}
            expandedMode={expandedMode}
            setExpandedMode={setExpandedMode}
          />
        </section>

        {/* Right Column: Fraud Alerts & Simulator (5 cols on large screens) */}
        <section className="xl:col-span-5 flex flex-col gap-5">
          {/* Top Half: Fraud Intelligence Feeds */}
          <div className="h-[360px]">
            <FraudAlertsPanel
              rings={rings}
              sharedDevices={sharedDevices}
              mules={mules}
              onSelectUser={handleSelectUser}
              loading={loadingAlerts}
            />
          </div>

          {/* Bottom Half: Live Transaction Simulator & Blacklist Controls */}
          <div className="flex-1 min-h-[460px]">
            <TransactionSimulator
              usersList={usersList}
              onSimulate={handleSimulateTransaction}
              onToggleBlacklist={handleToggleBlacklist}
              onSelectUser={handleSelectUser}
            />
          </div>
        </section>
      </main>

      {/* Bottom Footer Info Bar */}
      <footer className="border-t border-slate-900 bg-[#060910] px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>FinFraud Graph Security Engine v1.0</span>
          <span>•</span>
          <span>NoSQL Mini Project — Neo4j AuraDB Cloud Graph Engine</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Parameterized Cypher Contract Active • Port 3000 (UI) ↔ 5000 (API)
        </div>
      </footer>
    </div>
  );
}
