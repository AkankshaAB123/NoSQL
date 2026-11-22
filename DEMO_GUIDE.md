# FinFraud: Video Demonstration Script & Submission Guide
## Step-by-Step Walkthrough for Project Demo Video (5–8 Minutes)

---

## 🎬 Demo Video Overview & Timing

| Segment | Duration | Focus |
| :--- | :--- | :--- |
| **1. Intro & Architecture** | 1:00 min | Introduce FinFraud, NoSQL justification (Neo4j AuraDB graph), and tech stack. |
| **2. KPI Header Bar** | 0:45 min | Show live counts from AuraDB: Total Users (16), Total Volume, Flagged alerts. |
| **3. Fraud Ring A (Circular Loop)** | 1:15 min | Show Fraud Alerts tab $\rightarrow$ Circular Rings. Click "Inspect Ring" $\rightarrow$ load `U-201` into Graph Explorer. |
| **4. Fraud Ring B (Shared Device Hub)** | 1:15 min | Show Shared Devices tab $\rightarrow$ `DEV-SPOOF-999`. Click "Inspect U-301" $\rightarrow$ show rotating foreign VPN IPs. |
| **5. Fraud Ring C (Money Mule Fan-In)** | 1:00 min | Show Money Mules tab $\rightarrow$ `U-400` / `ACC-MULE`. Show 5 incoming deposits of ₹4,900. |
| **6. Live Simulation & Blacklist Toggle** | 1:30 min | Simulate a transfer to blacklisted account $\rightarrow$ show `FLAGGED` status (+50 score). Toggle blacklist. |
| **7. Conclusion** | 0:30 min | Summary of graph advantages over relational databases. |

---

## 🎙️ Step-by-Step Script & Actions

### Segment 1: Introduction (0:00 - 1:00)
- **What to show on screen:**
  - Browser opened to `http://localhost:3000` showing the dark-mode FinFraud Investigator Dashboard.
- **What to say:**
  > "Hello everyone. Today we are presenting **FinFraud**, a real-time graph financial fraud detection platform built for our NoSQL Mini Project. The system is connected live to a cloud-hosted **Neo4j AuraDB** graph database.
  > Modern financial crime—such as circular money laundering, VPN-hopping shared device rings, and smurfing fan-in mules—operates across deeply connected networks. Relational databases choke on multi-hop joins ($O(b^k)$), whereas Neo4j's Index-Free Adjacency allows us to traverse these relationships at pointer speeds."

### Segment 2: KPI Header & Live AuraDB Connection (1:00 - 1:45)
- **What to show on screen:**
  - Highlight the top KPI bar: Total Users (16), Total Transactions, Flagged Alerts (in rose red), and Total Volume in ₹.
  - Point to the green pulsing status dot: `neo4j+s://08891cc5.databases.neo4j.io`.
- **What to say:**
  > "Across the top header, our dashboard queries AuraDB in real time using parameterized Cypher. We can see our 16 seeded users, transaction volume, and flagged transactions. Clicking 'Sync AuraDB' re-evaluates all queries instantly."

### Segment 3: Fraud Ring A — Circular Money Laundering (1:45 - 3:00)
- **What to show on screen:**
  - In the right-hand panel, click the **Circular Rings** tab.
  - Hover over the detected card showing Vikram Rathore (`U-201`), `ACC-202`, and `ACC-203`.
  - Point out the initial outflow ₹95,000, returned amount ₹90,000 (94.7% retained), and transaction chain `TX-RING-01` $\rightarrow$ `TX-RING-02` $\rightarrow$ `TX-RING-03`.
  - Click **"Inspect Ring"**.
  - Show the Graph Canvas centering on `U-201` (`ACC-201`).
  - Toggle **"Multi-Hop Ring View"** to display the entire closed cycle connecting all 3 accounts.
  - Click on the `Transaction` node to open the Node Inspection drawer showing status and amount.

### Segment 4: Fraud Ring B — Shared Device & VPN Hopping (3:00 - 4:15)
- **What to show on screen:**
  - Switch to the **Device Hubs** tab in the alerts panel.
  - Point out `DEV-SPOOF-999`.
  - Show that 3 different users (`Arjun Das - U-301`, `Siddharth Roy - U-302`, `Ananya Sen - U-303`) share the exact same hardware fingerprint, even though each transaction originated from a completely different foreign VPN exit IP (`185.220.101.4` in NL, `45.134.26.88` in DE, and `192.42.116.19` in US).
  - Click on `U-301` to view its subgraph, showing the Device node and IPAddress node.

### Segment 5: Fraud Ring C — Money Mule Fan-In (4:15 - 5:15)
- **What to show on screen:**
  - Click the **Money Mules** tab.
  - Highlight `U-400` (Rakesh Gill, `ACC-MULE`).
  - Explain smurfing: 5 accounts each sent ₹4,900 to stay under the ₹5,000 / ₹50,000 audit thresholds, totaling ₹24,500.
  - Click **"Inspect Mule"** to show all 5 incoming transaction nodes linked to `ACC-MULE`.

### Segment 6: Live Transaction Simulator & Blacklist Controls (5:15 - 6:45)
- **What to show on screen:**
  - Scroll down to the **Live Transaction Simulator**.
  - Select Sender: `ACC-101 (Aarav Sharma)`.
  - Select Receiver: `ACC-301 (Arjun Das)` (who is blacklisted).
  - Show the **Real-Time Scoring Projection**:
    - Blacklist Risk = +50
    - VPN Active with NL exit IP = +30
    - Projected Score = 80 $\rightarrow$ `FLAGGED`.
  - Click **"Simulate & Execute Graph Transfer"**.
  - Show the newly generated Transaction ID (e.g., `TX-177...`) with `FLAGGED` status badge.
  - Show that the Flagged Alerts counter in the top KPI bar automatically updated!
  - Scroll to the **Investigator Blacklist Controls**, toggle a user from Clean to Blacklisted, and explain how the risk score immediately shifts to 100 in AuraDB.

### Segment 7: Conclusion (6:45 - 7:15)
- **What to say:**
  > "In conclusion, FinFraud demonstrates how Neo4j AuraDB graph databases empower real-time financial fraud detection and visual investigations, overcoming the fundamental latency and algorithmic limits of traditional relational systems. Thank you!"

---

## 📁 Google Drive Submission Checklist

Ensure the following files are organized in your project submission folder:
- [x] **📄 Final Report**: `FINAL_REPORT.md` (or exported as `Final_Report.pdf`)
- [x] **📊 PPT Presentation**: `PRESENTATION_OUTLINE.md` (or exported as `FinFraud_Presentation.pptx`)
- [x] **🎥 Demo Video**: Recorded MP4 video following the script above
- [x] **💻 Source Code**: Complete `/backend`, `/frontend`, and root `README.md`
