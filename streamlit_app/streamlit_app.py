import os
import streamlit as st
import pandas as pd
import networkx as nx
from pyvis.network import Network
from neo4j import GraphDatabase
from dotenv import load_dotenv
import streamlit.components.v1 as components

# Load environment variables
load_dotenv()

URI = os.getenv("NEO4J_URI", "neo4j+s://08891cc5.databases.neo4j.io")
DATABASE = os.getenv("NEO4J_DATABASE", "08891cc5")
USER = os.getenv("NEO4J_USER", "08891cc5")
PASSWORD = os.getenv("NEO4J_PASSWORD", "SWpV0WUBFpLVcIVQfnlsquhQ3uv9GCLhRVo54b3DfYY")

# Streamlit Page Config
st.set_page_config(
    page_title="FinFraud — Cyber-Investigation Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Custom Cyber-Investigation CSS to match FinFraud aesthetic
st.markdown("""
<style>
    /* Global Background & Reset */
    .stApp {
        background-color: #060b19;
        color: #f8fafc;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Reduce top padding for command center layout */
    .block-container {
        padding-top: 1rem !important;
        padding-bottom: 2rem !important;
        padding-left: 2rem !important;
        padding-right: 2rem !important;
        max-width: 100% !important;
    }
    
    /* Hide Streamlit default header/footer */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header[data-testid="stHeader"] {background: transparent; height: 0;}
    
    /* Custom KPI Cards */
    .kpi-container {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-top: 12px;
        margin-bottom: 16px;
    }
    
    .kpi-card {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 16, 30, 0.95) 100%);
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 14px 18px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        position: relative;
        overflow: hidden;
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    
    .kpi-card:hover {
        border-color: #38bdf8;
        transform: translateY(-2px);
    }
    
    .kpi-card-flagged {
        background: linear-gradient(135deg, rgba(76, 5, 25, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(244, 63, 94, 0.45);
        box-shadow: 0 0 20px -3px rgba(244, 63, 94, 0.3);
    }
    
    .kpi-card-flagged:hover {
        border-color: #f43f5e;
    }
    
    .kpi-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .kpi-value {
        font-size: 1.75rem;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        color: #ffffff;
        margin: 6px 0 2px 0;
        display: flex;
        align-items: baseline;
        gap: 8px;
    }
    
    .kpi-sub {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;
    }
    
    .flagged-badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 6px;
        background: rgba(244, 63, 94, 0.2);
        color: #fb7185;
        border: 1px solid rgba(244, 63, 94, 0.4);
    }
    
    .kpi-desc {
        font-size: 0.72rem;
        color: #64748b;
    }

    /* Tabs Styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 6px;
        background-color: #0b1120;
        border-radius: 10px;
        padding: 4px;
        border: 1px solid #1e293b;
    }
    
    .stTabs [data-baseweb="tab"] {
        padding: 8px 14px;
        border-radius: 8px;
        background-color: transparent;
        color: #94a3b8;
        font-weight: 600;
        font-size: 0.8rem;
        border: none;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: #1e293b !important;
        color: #38bdf8 !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    /* Cyber Card Panels */
    .cyber-panel {
        background: linear-gradient(135deg, rgba(13, 21, 36, 0.9) 0%, rgba(9, 14, 26, 0.98) 100%);
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    }
    
    /* Buttons */
    div.stButton > button {
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.8rem;
        transition: all 0.2s ease;
    }
    
    /* Dataframe styling */
    div[data-testid="stDataFrame"] {
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #1e293b;
    }
</style>
""", unsafe_allow_html=True)

# Neo4j Driver Connection Management
@st.cache_resource
def get_driver():
    try:
        drv = GraphDatabase.driver(URI, auth=(USER, PASSWORD), max_connection_pool_size=50)
        with drv.session(database=DATABASE) as session:
            session.run("RETURN 1").consume()
        return drv
    except Exception:
        fallback_uri = URI.replace("neo4j+s://", "neo4j+ssc://")
        return GraphDatabase.driver(fallback_uri, auth=(USER, PASSWORD), max_connection_pool_size=50)

def run_query(query, params=None):
    driver = get_driver()
    with driver.session(database=DATABASE) as session:
        result = session.run(query, params or {})
        return [record.data() for record in result]

# Initialize Session State
if "selected_user" not in st.session_state:
    st.session_state.selected_user = "U-201"
if "device_hash_val" not in st.session_state:
    st.session_state.device_hash_val = "DEV-CLEAN-01"

# ==============================================================================
# ZONE A: TOP HEADER & 4-COLUMN KPI BAR
# ==============================================================================

header_col1, header_col2 = st.columns([4, 1])

with header_col1:
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(56, 189, 248, 0.4); display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 0 15px -2px rgba(56, 189, 248, 0.3);">
            🛡️
        </div>
        <div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">FinFraud</span>
                <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 5px;">
                    AURADB GRAPH
                </span>
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">
                <span style="color: #10b981;">●</span> Live Cluster: neo4j+s://08891cc5.databases.neo4j.io
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

with header_col2:
    st.markdown("<div style='height: 8px;'></div>", unsafe_allow_html=True)
    if st.button("🔄 Sync AuraDB", use_container_width=True):
        st.cache_data.clear()
        st.rerun()

# KPI Metrics Query
kpi_query = """
MATCH (u:User) WITH count(u) AS totalUsers
MATCH (a:Account) WITH totalUsers, count(a) AS totalAccounts
MATCH (t:Transaction) WITH totalUsers, totalAccounts, count(t) AS totalTransactions, sum(t.amount) AS totalVolume
MATCH (flagged:Transaction {status: 'FLAGGED'}) WITH totalUsers, totalAccounts, totalTransactions, totalVolume, count(flagged) AS flaggedCount
MATCH (sus:User) WHERE sus.isBlacklisted = true OR sus.riskScore >= 50
RETURN totalUsers, totalAccounts, totalTransactions, flaggedCount, count(sus) AS suspiciousAccounts, totalVolume
"""
kpi_data = run_query(kpi_query)
kpi = kpi_data[0] if kpi_data else {}
total_users = kpi.get("totalUsers", 0)
total_accounts = kpi.get("totalAccounts", 0)
total_txs = kpi.get("totalTransactions", 0)
flagged_count = kpi.get("flaggedCount", 0)
total_volume = kpi.get("totalVolume", 0) or 0
flagged_pct = (flagged_count / total_txs * 100) if total_txs > 0 else 0

# Render 4 KPI Cards
st.markdown(f"""
<div class="kpi-container">
    <div class="kpi-card">
        <div class="kpi-label">TOTAL USERS / ACCOUNTS <span>👥</span></div>
        <div class="kpi-value">{total_users:,} <span class="kpi-sub">/ {total_accounts} accounts</span></div>
        <div class="kpi-desc">Active identities tracked</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-label">TOTAL TRANSACTIONS <span>⚡</span></div>
        <div class="kpi-value">{total_txs:,} <span class="kpi-sub">events</span></div>
        <div class="kpi-desc">Reified graph transfer edges</div>
    </div>
    <div class="kpi-card kpi-card-flagged">
        <div class="kpi-label" style="color: #fda4af;">FLAGGED ALERTS <span>🚨</span></div>
        <div class="kpi-value" style="color: #f43f5e;">
            {flagged_count:,}
            <span class="flagged-badge">{flagged_pct:.1f}% rate</span>
        </div>
        <div class="kpi-desc" style="color: rgba(253, 164, 175, 0.8);">Risk score ≥ 50 triggered</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-label">TOTAL VOLUME <span>₹</span></div>
        <div class="kpi-value" style="color: #10b981;">₹{total_volume:,.0f}</div>
        <div class="kpi-desc">Transferred across graph</div>
    </div>
</div>
""", unsafe_allow_html=True)

# Fetch All Users for Selectors
users_query = """
MATCH (u:User)-[:OWNS]->(a:Account)
RETURN u.userId AS userId, u.name AS name, u.country AS country, u.isBlacklisted AS isBlacklisted, u.riskScore AS riskScore, a.accountId AS accountId, a.balance AS balance
ORDER BY u.userId
"""
all_users = run_query(users_query)
user_options = {f"{u['userId']} — {u['name']} ({u['accountId']}){' ⛔' if u['isBlacklisted'] else ''}": u['userId'] for u in all_users}
account_options = {f"{u['accountId']} — {u['name']} (₹{u['balance']:,.0f})": u['accountId'] for u in all_users}

# ==============================================================================
# ZONE B: MAIN 2-COLUMN SPLIT ([1.35, 1])
# ==============================================================================

main_col_left, main_col_right = st.columns([1.35, 1], gap="medium")

# ------------------------------------------------------------------------------
# LEFT COLUMN: INTERACTIVE GRAPH EXPLORER (NetworkX + Pyvis)
# ------------------------------------------------------------------------------
with main_col_left:
    st.markdown("""
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #e2e8f0;">
            🕸️ Interactive Graph Explorer
        </span>
    </div>
    """, unsafe_allow_html=True)

    # Top Archetype Quick-Select Pills
    p1, p2, p3, p4 = st.columns(4)
    with p1:
        if st.button("U-201 Circular Ring", use_container_width=True, type="primary" if st.session_state.selected_user == "U-201" else "secondary"):
            st.session_state.selected_user = "U-201"
            st.rerun()
    with p2:
        if st.button("U-301 VPN Hopper", use_container_width=True, type="primary" if st.session_state.selected_user == "U-301" else "secondary"):
            st.session_state.selected_user = "U-301"
            st.rerun()
    with p3:
        if st.button("U-400 Money Mule", use_container_width=True, type="primary" if st.session_state.selected_user == "U-400" else "secondary"):
            st.session_state.selected_user = "U-400"
            st.rerun()
    with p4:
        if st.button("U-101 Clean Baseline", use_container_width=True, type="primary" if st.session_state.selected_user == "U-101" else "secondary"):
            st.session_state.selected_user = "U-101"
            st.rerun()

    # User Dropdown and Multi-Hop View Toggle Row
    sel_col1, sel_col2 = st.columns([1.5, 1])
    with sel_col1:
        # Determine current dropdown index
        current_idx = 0
        for idx, (label, uid) in enumerate(user_options.items()):
            if uid == st.session_state.selected_user:
                current_idx = idx
                break
        
        selected_dropdown_label = st.selectbox(
            "Select User to Investigate:",
            options=list(user_options.keys()),
            index=current_idx,
            label_visibility="collapsed"
        )
        new_sel_user = user_options[selected_dropdown_label]
        if new_sel_user != st.session_state.selected_user:
            st.session_state.selected_user = new_sel_user
            st.rerun()

    with sel_col2:
        multi_hop_view = st.checkbox("Multi-Hop Ring View", value=True, help="Traverse counterparties to display full rings and smurfing fan-in loops.")

    # Fetch Subgraph Data from Neo4j
    if multi_hop_view:
        cypher_graph = """
        MATCH (u:User {userId: $userId})-[:OWNS]->(a:Account)
        OPTIONAL MATCH (a)-[r1:INITIATED|CREDITED_TO]-(tx:Transaction)
        OPTIONAL MATCH (tx)-[r2:EXECUTED_ON|ORIGINATED_FROM]->(meta)
        OPTIONAL MATCH (tx)-[r3:INITIATED|CREDITED_TO]-(otherAcc:Account)<-[:OWNS]-(otherUser:User)
        WHERE otherAcc <> a
        RETURN u, a, tx, meta, r1, r2, otherAcc, otherUser, r3
        """
    else:
        cypher_graph = """
        MATCH (u:User {userId: $userId})-[:OWNS]->(a:Account)
        OPTIONAL MATCH (a)-[r1:INITIATED|CREDITED_TO]-(tx:Transaction)
        OPTIONAL MATCH (tx)-[r2:EXECUTED_ON|ORIGINATED_FROM]->(meta)
        RETURN u, a, tx, meta, r1, r2
        """

    graph_records = run_query(cypher_graph, {"userId": st.session_state.selected_user})

    # Construct NetworkX DiGraph
    G = nx.DiGraph()

    for rec in graph_records:
        u = rec.get("u")
        a = rec.get("a")
        tx = rec.get("tx")
        meta = rec.get("meta")
        r1 = rec.get("r1")
        r2 = rec.get("r2")
        other_acc = rec.get("otherAcc")
        other_user = rec.get("otherUser")
        r3 = rec.get("r3")

        if u:
            uid = u.get("userId")
            is_bl = u.get("isBlacklisted", False)
            color = "#f43f5e" if is_bl else "#3b82f6"
            tooltip = f"<b>USER</b><br>ID: {uid}<br>Name: {u.get('name')}<br>Country: {u.get('country')}<br>Risk Score: {u.get('riskScore')}<br>Blacklisted: {'YES (⛔)' if is_bl else 'NO'}"
            G.add_node(uid, label=f"{u.get('name')}\n({uid})", title=tooltip, color=color, shape="dot", size=24)

        if a:
            aid = a.get("accountId")
            bal = a.get("balance", 0)
            tooltip = f"<b>ACCOUNT</b><br>ID: {aid}<br>Balance: ₹{bal:,.2f}"
            G.add_node(aid, label=aid, title=tooltip, color="#06b6d4", shape="dot", size=18)
            if u:
                G.add_edge(u.get("userId"), aid, label="OWNS", color="#3b82f6", width=2)

        if tx:
            txid = tx.get("txId")
            amt = tx.get("amount", 0)
            status = tx.get("status", "COMPLETED")
            tx_color = "#f43f5e" if status == "FLAGGED" else "#10b981"
            tooltip = f"<b>TRANSACTION</b><br>ID: {txid}<br>Amount: ₹{amt:,.2f}<br>Status: {status}<br>Risk Score: {tx.get('riskScore')}"
            G.add_node(txid, label=f"{txid}\n(₹{amt:,.0f})", title=tooltip, color=tx_color, shape="diamond", size=16)

            if a:
                G.add_edge(a.get("accountId"), txid, label="INITIATED", color="#06b6d4", width=1.5)

        if meta and tx:
            if "fingerprintHash" in meta:
                devid = meta["fingerprintHash"]
                tooltip = f"<b>DEVICE</b><br>Hash: {devid}<br>OS: {meta.get('os')}<br>Browser: {meta.get('browser')}"
                G.add_node(devid, label=devid, title=tooltip, color="#f59e0b", shape="triangle", size=16)
                G.add_edge(tx.get("txId"), devid, label="EXECUTED_ON", color="#f59e0b", width=1.5)
            elif "ip" in meta:
                ipid = meta["ip"]
                is_vpn = meta.get("isVpn", False)
                tooltip = f"<b>IP ADDRESS</b><br>IP: {ipid}<br>Country: {meta.get('country')}<br>VPN: {'YES (⚠️)' if is_vpn else 'NO'}"
                G.add_node(ipid, label=f"{ipid}\n({meta.get('country')})", title=tooltip, color="#a855f7", shape="square", size=16)
                G.add_edge(tx.get("txId"), ipid, label="ORIGINATED_FROM", color="#a855f7", width=1.5)

        # Counterparties in Multi-Hop Ring View
        if multi_hop_view and other_acc:
            o_aid = other_acc.get("accountId")
            o_bal = other_acc.get("balance", 0)
            o_tooltip = f"<b>COUNTERPARTY ACCOUNT</b><br>ID: {o_aid}<br>Balance: ₹{o_bal:,.2f}"
            G.add_node(o_aid, label=o_aid, title=o_tooltip, color="#06b6d4", shape="dot", size=18)

            if tx:
                G.add_edge(tx.get("txId"), o_aid, label="CREDITED_TO", color="#10b981", width=1.5)

            if other_user:
                o_uid = other_user.get("userId")
                o_is_bl = other_user.get("isBlacklisted", False)
                o_color = "#f43f5e" if o_is_bl else "#3b82f6"
                o_u_tooltip = f"<b>USER</b><br>ID: {o_uid}<br>Name: {other_user.get('name')}<br>Risk: {other_user.get('riskScore')}"
                G.add_node(o_uid, label=f"{other_user.get('name')}\n({o_uid})", title=o_u_tooltip, color=o_color, shape="dot", size=22)
                G.add_edge(o_uid, o_aid, label="OWNS", color="#3b82f6", width=2)

    # Render Pyvis Network
    if len(G.nodes) > 0:
        net = Network(height="520px", width="100%", bgcolor="#090d16", font_color="#f8fafc", directed=True)
        net.from_nx(G)

        # Smooth glowing node shadows and physics
        net.set_options("""
        var options = {
          "nodes": {
            "borderWidth": 2,
            "borderWidthSelected": 4,
            "shadow": { "enabled": true, "color": "rgba(0,0,0,0.6)", "size": 14 },
            "font": { "size": 11, "color": "#f8fafc", "face": "Inter, sans-serif" }
          },
          "edges": {
            "arrows": { "to": { "enabled": true, "scaleFactor": 0.8 } },
            "color": { "inherit": false },
            "font": { "size": 9, "color": "#94a3b8", "align": "top", "strokeWidth": 0 },
            "smooth": { "type": "continuous" }
          },
          "physics": {
            "barnesHut": {
              "gravitationalConstant": -3200,
              "centralGravity": 0.35,
              "springLength": 95,
              "springConstant": 0.04
            },
            "minVelocity": 0.75
          }
        }
        """)

        html_graph = net.generate_html()
        components.html(html_graph, height=535)

        # Legend Bar
        st.markdown(f"""
        <div style="display: flex; gap: 14px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; color: #94a3b8; justify-content: flex-end; margin-top: -12px;">
            <span><span style="color: #3b82f6;">●</span> User</span>
            <span><span style="color: #06b6d4;">●</span> Account</span>
            <span><span style="color: #10b981;">◆</span> Completed Tx</span>
            <span><span style="color: #f43f5e;">◆</span> Flagged Tx</span>
            <span><span style="color: #f59e0b;">▲</span> Device</span>
            <span><span style="color: #a855f7;">■</span> IP Address</span>
            <span style="color: #38bdf8; font-weight: bold;">({len(G.nodes)} nodes, {len(G.edges)} edges)</span>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.info("No connected graph entities found.")

# ------------------------------------------------------------------------------
# RIGHT COLUMN: STACKED FRAUD INTELLIGENCE & TRANSACTION SIMULATOR
# ------------------------------------------------------------------------------
with main_col_right:
    # 1. TOP RIGHT: FRAUD INTELLIGENCE FEEDS
    st.markdown("""
    <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #e2e8f0; margin-bottom: 8px;">
        🚨 Fraud Intelligence Feeds
    </div>
    """, unsafe_allow_html=True)

    tab1, tab2, tab3 = st.tabs([
        "🔄 Circular Rings",
        "📱 Device Hubs",
        "🔀 Money Mules"
    ])

    # Tab 1: Circular Rings
    with tab1:
        ring_query = """
        MATCH (u1:User)-[:OWNS]->(a1:Account)
              -[:INITIATED]->(t1:Transaction)-[:CREDITED_TO]->(a2:Account)
              -[:INITIATED]->(t2:Transaction)-[:CREDITED_TO]->(a3:Account)
              -[:INITIATED]->(t3:Transaction)-[:CREDITED_TO]->(a1)
        WHERE t1.timestamp < t2.timestamp AND t2.timestamp < t3.timestamp
          AND t3.amount >= t1.amount * 0.80
        RETURN [u1.name, a2.accountId, a3.accountId] AS ringMembers,
               t1.amount AS initialAmount,
               t3.amount AS returnedAmount,
               [t1.txId, t2.txId, t3.txId] AS transactionIds,
               u1.userId AS originUserId
        """
        rings = run_query(ring_query)
        if rings:
            for r in rings:
                ret_pct = (r['returnedAmount'] / r['initialAmount']) * 100
                st.markdown(f"""
                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 10px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; background: rgba(244, 63, 94, 0.2); color: #fda4af; padding: 2px 6px; border-radius: 4px;">
                            3-Hop Closed Cycle
                        </span>
                        <span style="font-size: 0.75rem; font-family: monospace; color: #34d399; font-weight: bold;">
                            {ret_pct:.1f}% Retained
                        </span>
                    </div>
                    <div style="font-size: 0.78rem; font-family: monospace; color: #e2e8f0; margin-bottom: 4px;">
                        <b>Flow:</b> {r['ringMembers'][0]} → {r['ringMembers'][1]} → {r['ringMembers'][2]} → Return
                    </div>
                    <div style="font-size: 0.75rem; color: #94a3b8; display: flex; gap: 12px; font-family: monospace;">
                        <span>Out: <b>₹{r['initialAmount']:,.0f}</b></span>
                        <span>Back: <b style="color: #34d399;">₹{r['returnedAmount']:,.0f}</b></span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                if st.button(f"Inspect Ring ({r.get('originUserId', 'U-201')})", key=f"btn_ring_{r.get('originUserId', 'U-201')}"):
                    st.session_state.selected_user = r.get("originUserId", "U-201")
                    st.rerun()
        else:
            st.info("No circular rings detected.")

    # Tab 2: Shared Device Hubs
    with tab2:
        device_query = """
        MATCH (u:User)-[:OWNS]->(:Account)-[:INITIATED]->(t:Transaction)-[:EXECUTED_ON]->(d:Device)
        OPTIONAL MATCH (t)-[:ORIGINATED_FROM]->(ip:IPAddress)
        WITH d,
             collect(DISTINCT u.userId) AS userIds,
             collect(DISTINCT u.name) AS userNames,
             collect(DISTINCT ip.ip) AS ipsUsed,
             count(DISTINCT u) AS userCount
        WHERE userCount >= 3
        RETURN d.fingerprintHash AS deviceHash,
               userCount,
               userIds,
               userNames,
               ipsUsed
        """
        devices = run_query(device_query)
        if devices:
            for d in devices:
                st.markdown(f"""
                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 0.7rem; font-weight: 700; font-family: monospace; background: rgba(245, 158, 11, 0.2); color: #fde68a; padding: 2px 6px; border-radius: 4px;">
                            {d['deviceHash']}
                        </span>
                        <span style="font-size: 0.75rem; font-family: monospace; color: #f87171; font-weight: bold;">
                            {d['userCount']} Linked Accounts
                        </span>
                    </div>
                    <div style="font-size: 0.75rem; color: #cbd5e1; margin-bottom: 4px;">
                        <b>Users:</b> {', '.join(d['userNames'])}
                    </div>
                    <div style="font-size: 0.72rem; color: #94a3b8; font-family: monospace;">
                        VPN Exit IPs: {', '.join(d['ipsUsed'])}
                    </div>
                </div>
                """, unsafe_allow_html=True)

                if d['userIds']:
                    target_u = d['userIds'][0]
                    if st.button(f"Inspect Device Hub ({target_u})", key=f"btn_dev_{d['deviceHash']}"):
                        st.session_state.selected_user = target_u
                        st.rerun()
        else:
            st.info("No shared device hubs detected.")

    # Tab 3: Money Mules
    with tab3:
        mule_query = """
        MATCH (sender:Account)-[:INITIATED]->(t:Transaction)-[:CREDITED_TO]->(muleAcc:Account)<-[:OWNS]-(muleUser:User)
        WITH muleUser,
             muleAcc,
             count(DISTINCT sender) AS uniqueSenders,
             sum(t.amount) AS totalReceived
        WHERE uniqueSenders >= 5
        RETURN muleUser.userId AS userId,
               muleUser.name AS muleName,
               muleAcc.accountId AS accountId,
               uniqueSenders,
               totalReceived
        """
        mules = run_query(mule_query)
        if mules:
            for m in mules:
                st.markdown(f"""
                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 10px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; background: rgba(168, 85, 247, 0.2); color: #e9d5ff; padding: 2px 6px; border-radius: 4px;">
                            Smurfing Fan-In Node
                        </span>
                        <span style="font-size: 0.75rem; font-family: monospace; color: #34d399; font-weight: bold;">
                            ₹{m['totalReceived']:,.0f} Received
                        </span>
                    </div>
                    <div style="font-size: 0.75rem; color: #e2e8f0; margin-bottom: 2px;">
                        <b>Holder:</b> {m['muleName']} (Account: <code>{m['accountId']}</code>)
                    </div>
                    <div style="font-size: 0.72rem; color: #f87171; font-weight: 600;">
                        Incoming Deposits: {m['uniqueSenders']} Distinct Senders
                    </div>
                </div>
                """, unsafe_allow_html=True)

                if st.button(f"Inspect Mule ({m['userId']})", key=f"btn_mule_{m['userId']}"):
                    st.session_state.selected_user = m["userId"]
                    st.rerun()
        else:
            st.info("No money mule accounts detected.")

    st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

    # 2. BOTTOM RIGHT: LIVE TRANSACTION SIMULATOR & RISK ENGINE
    st.markdown("""
    <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #e2e8f0; margin-bottom: 8px;">
        ⚡ Live Transaction Simulator & Risk Engine
    </div>
    """, unsafe_allow_html=True)

    with st.container():
        st.markdown("<div class='cyber-panel'>", unsafe_allow_html=True)
        
        sim_col1, sim_col2 = st.columns(2)
        with sim_col1:
            sim_sender_label = st.selectbox("Sender Account", list(account_options.keys()), index=0)
            sim_sender_acc = account_options[sim_sender_label]
        with sim_col2:
            sim_receiver_label = st.selectbox("Receiver Account", list(account_options.keys()), index=min(4, len(account_options)-1))
            sim_receiver_acc = account_options[sim_receiver_label]

        sim_amt_col, sim_dev_col = st.columns([1, 1.2])
        with sim_amt_col:
            sim_amount = st.number_input("Amount (₹)", min_value=1.0, value=7500.0, step=500.0)
        with sim_dev_col:
            st.markdown("<label style='font-size: 0.75rem; color: #94a3b8; font-weight: 500;'>Device Fingerprint</label>", unsafe_allow_html=True)
            d_pick1, d_pick2 = st.columns(2)
            with d_pick1:
                if st.button("DEV-CLEAN-01", use_container_width=True):
                    st.session_state.device_hash_val = "DEV-CLEAN-01"
            with d_pick2:
                if st.button("DEV-SPOOF-999", use_container_width=True):
                    st.session_state.device_hash_val = "DEV-SPOOF-999"
            sim_device = st.text_input("Device Hash", value=st.session_state.device_hash_val, label_visibility="collapsed")

        sim_ip_col, sim_vpn_col, sim_geo_col = st.columns([1.2, 0.8, 1])
        with sim_ip_col:
            sim_ip = st.text_input("IP Address", value="185.220.101.4")
        with sim_vpn_col:
            st.markdown("<div style='height: 18px;'></div>", unsafe_allow_html=True)
            sim_is_vpn = st.checkbox("VPN Active", value=True)
        with sim_geo_col:
            sim_country = st.selectbox("IP Country", ["IN", "NL", "DE", "US", "GB"], index=1)

        # Real-time Scoring Projection
        sender_user_obj = next((u for u in all_users if u['accountId'] == sim_sender_acc), None)
        receiver_user_obj = next((u for u in all_users if u['accountId'] == sim_receiver_acc), None)
        
        proj_blacklist_risk = 50 if (receiver_user_obj and receiver_user_obj['isBlacklisted']) else 0
        proj_vpn_risk = 30 if (sim_is_vpn and sender_user_obj and sim_country != sender_user_obj['country']) else 0
        proj_total_risk = proj_blacklist_risk + proj_vpn_risk
        proj_status = "FLAGGED" if proj_total_risk >= 50 else "COMPLETED"

        st.markdown(f"""
        <div style="background: #090e1a; border: 1px solid #1e293b; border-radius: 8px; padding: 10px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.75rem; color: #94a3b8;">
                <b>Projection:</b> Blacklist ({proj_blacklist_risk}) + VPN Geo ({proj_vpn_risk}) = 
                <b style="color: #f59e0b; font-family: monospace;">{proj_total_risk}/100</b>
            </div>
            <div>
                <span style="font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 5px; font-family: monospace; background: {'rgba(244, 63, 94, 0.2)' if proj_status == 'FLAGGED' else 'rgba(16, 185, 129, 0.2)'}; color: {'#f43f5e' if proj_status == 'FLAGGED' else '#10b981'}; border: 1px solid {'rgba(244, 63, 94, 0.4)' if proj_status == 'FLAGGED' else 'rgba(16, 185, 129, 0.4)'};">
                    {proj_status}
                </span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🚀 Simulate & Execute Graph Transfer", use_container_width=True, type="primary"):
            sim_cypher = """
            MATCH (senderUser:User)-[:OWNS]->(senderAcc:Account {accountId: $senderAccId})
            MATCH (receiverAcc:Account {accountId: $receiverAccId})<-[:OWNS]-(receiverUser:User)
            MERGE (dev:Device {fingerprintHash: $deviceHash})
            MERGE (ip:IPAddress {ip: $ip})
              ON CREATE SET ip.isVpn = $isVpn, ip.country = $ipCountry
            WITH senderUser, senderAcc, receiverUser, receiverAcc, dev, ip,
                 CASE WHEN receiverUser.isBlacklisted = true THEN 50 ELSE 0 END AS blacklistRisk,
                 CASE WHEN ip.isVpn = true AND ip.country <> senderUser.country THEN 30 ELSE 0 END AS vpnGeoRisk
            WITH senderUser, senderAcc, receiverUser, receiverAcc, dev, ip,
                 (blacklistRisk + vpnGeoRisk) AS totalRiskScore
            CREATE (tx:Transaction {
              txId: 'TX-' + toString(timestamp()),
              amount: toFloat($amount),
              timestamp: datetime(),
              status: CASE WHEN totalRiskScore >= 50 THEN 'FLAGGED' ELSE 'COMPLETED' END,
              riskScore: totalRiskScore
            })
            CREATE (senderAcc)-[:INITIATED]->(tx)-[:CREDITED_TO]->(receiverAcc)
            CREATE (tx)-[:EXECUTED_ON]->(dev)
            CREATE (tx)-[:ORIGINATED_FROM]->(ip)
            RETURN tx.txId AS txId, tx.status AS status, tx.riskScore AS riskScore
            """
            try:
                tx_res = run_query(sim_cypher, {
                    "senderAccId": sim_sender_acc,
                    "receiverAccId": sim_receiver_acc,
                    "amount": sim_amount,
                    "deviceHash": sim_device,
                    "ip": sim_ip,
                    "isVpn": sim_is_vpn,
                    "ipCountry": sim_country
                })
                if tx_res:
                    created_tx = tx_res[0]
                    st.success(f"Transaction `{created_tx['txId']}` created: Status `{created_tx['status']}` (Risk: `{created_tx['riskScore']}`)")
                    st.cache_data.clear()
                    st.rerun()
            except Exception as e:
                st.error(f"Simulation Error: {e}")

        # Compact Investigator Blacklist Controls
        st.markdown("<hr style='border-color: #1e293b; margin: 12px 0;'>", unsafe_allow_html=True)
        st.markdown("<div style='font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #cbd5e1; margin-bottom: 6px;'>Investigator Blacklist Controls</div>", unsafe_allow_html=True)
        
        bl_col1, bl_col2 = st.columns([1.5, 1])
        with bl_col1:
            bl_target_label = st.selectbox("Select User", list(user_options.keys()), key="bl_user_dropdown", label_visibility="collapsed")
            bl_target_uid = user_options[bl_target_label]
            target_user_record = next((u for u in all_users if u['userId'] == bl_target_uid), None)
            is_bl_now = target_user_record['isBlacklisted'] if target_user_record else False
        
        with bl_col2:
            new_target_status = not is_bl_now
            bl_btn_text = "Remove Blacklist" if is_bl_now else "Blacklist (+50)"
            if st.button(bl_btn_text, use_container_width=True, type="secondary" if is_bl_now else "primary"):
                bl_cypher = """
                MATCH (u:User {userId: $userId})
                SET u.isBlacklisted = $isBlacklisted,
                    u.riskScore = CASE WHEN $isBlacklisted = true THEN 100 ELSE 10 END
                RETURN u.userId AS userId, u.name AS name, u.isBlacklisted AS isBlacklisted, u.riskScore AS riskScore
                """
                run_query(bl_cypher, {"userId": bl_target_uid, "isBlacklisted": new_target_status})
                st.cache_data.clear()
                st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# ZONE C: COLLAPSIBLE / BOTTOM PANDAS TRANSACTION EXPLORER
# ==============================================================================

st.markdown("<div style='height: 18px;'></div>", unsafe_allow_html=True)

with st.expander("📋 Transaction Audit Log & Advanced Filters (Pandas Data Explorer)", expanded=True):
    # Query All Transactions for Pandas
    tx_query = """
    MATCH (senderUser:User)-[:OWNS]->(senderAcc:Account)-[:INITIATED]->(tx:Transaction)-[:CREDITED_TO]->(receiverAcc:Account)<-[:OWNS]-(receiverUser:User)
    OPTIONAL MATCH (tx)-[:EXECUTED_ON]->(dev:Device)
    OPTIONAL MATCH (tx)-[:ORIGINATED_FROM]->(ip:IPAddress)
    RETURN tx.txId AS txId,
           senderUser.userId AS senderUserId,
           senderUser.name AS senderName,
           senderAcc.accountId AS senderAccId,
           receiverUser.userId AS receiverUserId,
           receiverUser.name AS receiverName,
           receiverAcc.accountId AS receiverAccId,
           tx.amount AS amount,
           toString(tx.timestamp) AS timestamp,
           tx.status AS status,
           tx.riskScore AS riskScore,
           dev.fingerprintHash AS deviceHash,
           ip.ip AS ipAddress,
           ip.country AS ipCountry
    ORDER BY tx.timestamp DESC
    """
    all_txs = run_query(tx_query)
    df_txs = pd.DataFrame(all_txs)

    if not df_txs.empty:
        # Filter controls row
        f_col1, f_col2, f_col3 = st.columns([1.5, 1, 1.2])

        with f_col1:
            max_amt = float(df_txs['amount'].max())
            min_amount_slider = st.slider(
                "Minimum Transaction Amount (₹)",
                min_value=0.0,
                max_value=max_amt,
                value=0.0,
                step=500.0,
                format="₹%d"
            )

        with f_col2:
            status_filter = st.multiselect(
                "Transaction Status",
                options=["COMPLETED", "FLAGGED"],
                default=["COMPLETED", "FLAGGED"]
            )

        with f_col3:
            search_term = st.text_input(
                "Search Transactions",
                placeholder="Search TxID, User, Account, Device..."
            )

        # Apply Pandas Filters
        df_filtered = df_txs[
            (df_txs['amount'] >= min_amount_slider) &
            (df_txs['status'].isin(status_filter))
        ]

        if search_term:
            term = search_term.lower()
            df_filtered = df_filtered[
                df_filtered['txId'].str.lower().str.contains(term, na=False) |
                df_filtered['senderName'].str.lower().str.contains(term, na=False) |
                df_filtered['receiverName'].str.lower().str.contains(term, na=False) |
                df_filtered['senderAccId'].str.lower().str.contains(term, na=False) |
                df_filtered['receiverAccId'].str.lower().str.contains(term, na=False) |
                df_filtered['deviceHash'].str.lower().str.contains(term, na=False)
            ]

        st.caption(f"Showing **{len(df_filtered)}** transactions matching active filters.")

        st.dataframe(
            df_filtered[[
                'txId', 'amount', 'status', 'riskScore', 'senderName', 'senderAccId',
                'receiverName', 'receiverAccId', 'deviceHash', 'ipAddress', 'ipCountry', 'timestamp'
            ]],
            use_container_width=True,
            column_config={
                "amount": st.column_config.NumberColumn("Amount (₹)", format="₹%.2f"),
                "riskScore": st.column_config.ProgressColumn("Risk Score", min_value=0, max_value=100, format="%d"),
                "status": st.column_config.TextColumn("Status"),
                "timestamp": st.column_config.TextColumn("Timestamp"),
            }
        )
    else:
        st.info("No transaction records found.")

# Footer info
st.markdown("""
<div style="text-align: center; font-size: 0.72rem; color: #64748b; margin-top: 24px; padding-top: 12px; border-top: 1px solid #1e293b;">
    FinFraud Real-Time Cyber-Investigation Platform • Powered by Streamlit, Neo4j Python Driver, Pandas, NetworkX & Pyvis
</div>
""", unsafe_allow_html=True)
