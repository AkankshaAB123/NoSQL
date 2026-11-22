import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  User,
  CreditCard,
  ArrowRightLeft,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ShieldAlert,
  ShieldCheck,
  Search,
} from 'lucide-react';

const NODE_COLORS = {
  User: '#3b82f6', // blue
  Account: '#06b6d4', // cyan
  TransactionCompleted: '#10b981', // emerald
  TransactionFlagged: '#f43f5e', // rose
  Device: '#f59e0b', // amber
  IPAddress: '#a855f7', // purple
};

export default function GraphCanvas({
  graphData,
  loading,
  selectedUserId,
  onSelectUser,
  usersList = [],
  onToggleBlacklist,
  expandedMode,
  setExpandedMode,
}) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Keep track of container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Center/Fit graph on data change
  useEffect(() => {
    if (fgRef.current && graphData?.nodes?.length > 0) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 40);
      }, 500);
    }
  }, [graphData]);

  // Archetypes for quick selection
  const archetypes = [
    { id: 'U-201', label: 'U-201: Circular Ring', desc: 'Money Laundering Cycle', badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-500/10' },
    { id: 'U-301', label: 'U-301: VPN Hopper', desc: 'DEV-SPOOF-999 Hub', badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
    { id: 'U-400', label: 'U-400: Money Mule', desc: 'Smurfing Fan-In (5 accounts)', badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-500/10' },
    { id: 'U-101', label: 'U-101: Clean Baseline', desc: 'Legitimate Customer', badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' },
  ];

  // Node Color Resolver
  const getNodeColor = useCallback((node) => {
    if (node.type === 'User') return NODE_COLORS.User;
    if (node.type === 'Account') return NODE_COLORS.Account;
    if (node.type === 'Transaction') {
      return node.status === 'FLAGGED' ? NODE_COLORS.TransactionFlagged : NODE_COLORS.TransactionCompleted;
    }
    if (node.type === 'Device') return NODE_COLORS.Device;
    if (node.type === 'IPAddress') return NODE_COLORS.IPAddress;
    return '#94a3b8';
  }, []);

  // Node counts for active legend
  const nodeCounts = useMemo(() => {
    const counts = { User: 0, Account: 0, Transaction: 0, Device: 0, IPAddress: 0 };
    (graphData?.nodes || []).forEach((n) => {
      if (counts[n.type] !== undefined) counts[n.type]++;
    });
    return counts;
  }, [graphData]);

  // Filtered users for search dropdown
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return usersList;
    const term = searchTerm.toLowerCase();
    return usersList.filter(
      (u) =>
        u.userId.toLowerCase().includes(term) ||
        u.name.toLowerCase().includes(term) ||
        u.accountId.toLowerCase().includes(term)
    );
  }, [usersList, searchTerm]);

  // Custom Canvas Node Renderer
  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const color = getNodeColor(node);

      // Node Radius
      let radius = 7;
      if (node.type === 'User') radius = 10;
      else if (node.type === 'Account') radius = 8;
      else if (node.type === 'Transaction') radius = 7;
      else if (node.type === 'Device') radius = 8;
      else if (node.type === 'IPAddress') radius = 8;

      // Glow / Selection ring
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#ffffff';
        ctx.stroke();
      }

      // Base Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0a0f1d';
      ctx.stroke();

      // Flagged / Alert badge overlay
      if ((node.type === 'Transaction' && node.status === 'FLAGGED') || (node.type === 'User' && node.isBlacklisted)) {
        ctx.beginPath();
        ctx.arc(node.x + radius * 0.7, node.y - radius * 0.7, 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#f43f5e';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      // Label below node
      const label = node.name || node.id;
      const fontSize = Math.max(9 / globalScale, 2.5);
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Label background for readability
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(7, 11, 18, 0.85)';
      ctx.fillRect(node.x - textWidth / 2 - 2, node.y + radius + 2, textWidth + 4, fontSize + 3);

      ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
      ctx.fillText(label, node.x, node.y + radius + 3);
    },
    [hoveredNode, selectedNode, getNodeColor]
  );

  return (
    <div className="flex flex-col h-full bg-[#080d19] rounded-xl border border-slate-800 overflow-hidden relative">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-sm gap-3">
        {/* Archetype Quick-Select Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Archetypes:
          </span>
          {archetypes.map((arch) => (
            <button
              key={arch.id}
              onClick={() => onSelectUser(arch.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition whitespace-nowrap ${
                selectedUserId === arch.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-cyber-cyan font-semibold'
                  : `${arch.badgeColor} hover:brightness-125`
              }`}
              title={arch.desc}
            >
              {arch.label}
            </button>
          ))}
        </div>

        {/* User Search & Network Expand Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60 hover:bg-slate-800 transition">
            <input
              type="checkbox"
              checked={expandedMode}
              onChange={(e) => setExpandedMode(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Multi-Hop Ring View</span>
          </label>

          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(e) => onSelectUser(e.target.value)}
              className="bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 pr-8 focus:outline-none focus:border-cyan-500 transition"
            >
              {usersList.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.userId} — {u.name} ({u.accountId}) {u.isBlacklisted ? '⛔' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 relative w-full h-[520px] bg-[#070b14] overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-cyan-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-mono">Traversing AuraDB Subgraph...</span>
            </div>
          </div>
        )}

        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData || { nodes: [], links: [] }}
          nodeCanvasObject={paintNode}
          nodeRelSize={8}
          linkDirectionalArrowLength={4.5}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.15}
          linkColor={(link) => {
            if (link.type === 'OWNS') return '#3b82f6';
            if (link.type === 'INITIATED') return '#06b6d4';
            if (link.type === 'CREDITED_TO') return '#10b981';
            if (link.type === 'EXECUTED_ON') return '#f59e0b';
            if (link.type === 'ORIGINATED_FROM') return '#a855f7';
            return '#64748b';
          }}
          linkWidth={1.5}
          linkLabel={(link) => link.label || link.type}
          onNodeClick={(node) => setSelectedNode(node)}
          onNodeHover={(node) => setHoveredNode(node || null)}
          cooldownTicks={120}
          d3AlphaDecay={0.03}
          d3VelocityDecay={0.3}
        />

        {/* Floating Zoom & Fit Controls */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 backdrop-blur-md shadow-lg">
          <button
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 300)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 300)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => fgRef.current?.zoomToFit(400, 30)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Reset / Fit Graph"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Graph Legend */}
        <div className="absolute top-4 right-4 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 text-xs shadow-xl min-w-[190px]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>Graph Legend</span>
            <span className="font-mono text-cyan-400">{graphData?.nodes?.length || 0} nodes</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
                User
              </span>
              <span className="font-mono text-[11px] text-slate-400">{nodeCounts.User}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span>
                Account
              </span>
              <span className="font-mono text-[11px] text-slate-400">{nodeCounts.Account}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                Completed Tx
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {(graphData?.nodes || []).filter((n) => n.type === 'Transaction' && n.status !== 'FLAGGED').length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-rose-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] ring-1 ring-rose-400"></span>
                Flagged Tx
              </span>
              <span className="font-mono text-[11px] text-rose-400">
                {(graphData?.nodes || []).filter((n) => n.type === 'Transaction' && n.status === 'FLAGGED').length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                Device
              </span>
              <span className="font-mono text-[11px] text-slate-400">{nodeCounts.Device}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></span>
                IP Address
              </span>
              <span className="font-mono text-[11px] text-slate-400">{nodeCounts.IPAddress}</span>
            </div>
          </div>
        </div>

        {/* Click-to-Inspect Node Details Slide-Out Drawer */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-20 w-80 max-h-[85%] bg-slate-900/95 border border-cyan-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-lg overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getNodeColor(selectedNode) }}
                ></span>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                  {selectedNode.type} Details
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="font-mono text-cyan-300 font-bold break-all text-sm">
                {selectedNode.name || selectedNode.id}
              </div>

              {/* Node-specific attributes */}
              {selectedNode.type === 'User' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono">{selectedNode.userId}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Country:</span>
                    <span className="font-mono">{selectedNode.country}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-mono font-bold text-amber-400">{selectedNode.riskScore}/100</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Blacklisted:</span>
                    <span
                      className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                        selectedNode.isBlacklisted
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {selectedNode.isBlacklisted ? 'BLACKLISTED' : 'CLEAN'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onToggleBlacklist(selectedNode.userId, !selectedNode.isBlacklisted);
                        setSelectedNode((prev) => ({
                          ...prev,
                          isBlacklisted: !prev.isBlacklisted,
                          riskScore: !prev.isBlacklisted ? 100 : 10,
                        }));
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        selectedNode.isBlacklisted
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-cyber-rose'
                      }`}
                    >
                      {selectedNode.isBlacklisted ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" /> Remove from Blacklist
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" /> Blacklist User (Risk 100)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedNode.type === 'Account' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Account ID:</span>
                    <span className="font-mono">{selectedNode.accountId}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Current Balance:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ₹{Number(selectedNode.balance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {selectedNode.type === 'Transaction' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Amount:</span>
                    <span className="font-mono font-bold text-white">
                      ₹{Number(selectedNode.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        selectedNode.status === 'FLAGGED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {selectedNode.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {selectedNode.riskScore ?? 0}
                    </span>
                  </div>
                </div>
              )}

              {selectedNode.type === 'Device' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Fingerprint:</span>
                    <span className="font-mono text-amber-300">{selectedNode.fingerprintHash}</span>
                  </div>
                  {selectedNode.os && (
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">OS:</span>
                      <span className="font-mono">{selectedNode.os}</span>
                    </div>
                  )}
                  {selectedNode.browser && (
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Browser:</span>
                      <span className="font-mono">{selectedNode.browser}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedNode.type === 'IPAddress' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">IP:</span>
                    <span className="font-mono text-purple-300">{selectedNode.ip}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">VPN Active:</span>
                    <span
                      className={`font-mono px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        selectedNode.isVpn ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {selectedNode.isVpn ? 'YES (VPN)' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Country:</span>
                    <span className="font-mono">{selectedNode.country}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
