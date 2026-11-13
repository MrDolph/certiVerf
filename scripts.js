const GRAPH_URL = "https://api.studio.thegraph.com/query/1756477/certiverf/version/latest";
const REGISTRY_ADDR = "0x5416e493590141D710F367afA994F97A58116834";
const CERT_ADDR = "0x30d5AEa8d649856a7f986d8D41DA314145Ecd6f5";
const RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/3RE7F8bPJ2MofC94L2tdP";
const AMOY_ID = 80002;
const PAGE_URL = window.location.href.split("?")[0];

// Wallets to exclude from the Registered Institutions / Statistics display and CSV exports.
// This is a DISPLAY-ONLY filter — the underlying on-chain approval is untouched.
// Used for cases like the NUC admin wallet being mistakenly approved as an institution;
// once InstitutionRegistry.revokeInstitution() is deployed, this can be phased out in
// favor of properly revoking the wallet on-chain instead of hiding it client-side.
// Note: this is a lowercase array for easier comparison. 
// Use of version latest of The Graph subgraph is required for this to work, as older versions may not have the wallet data in the events.
const HIDDEN_WALLETS = [
    "0x44f586b4991b622fc44b31225aae0b85415efb6e" // NUC admin wallet, mistakenly self-approved as "University of Lagos"
];

const REG_ABI = [
    { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_acronym", "type": "string" }, { "internalType": "string", "name": "_website", "type": "string" }], "name": "requestRegistration", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "approveRegistration", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "rejectRegistration", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "isRegistered", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "getInstitution", "outputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "acronym", "type": "string" }, { "internalType": "string", "name": "website", "type": "string" }, { "internalType": "uint256", "name": "registrationTime", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "getPendingInstitution", "outputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "acronym", "type": "string" }, { "internalType": "string", "name": "website", "type": "string" }], "stateMutability": "view", "type": "function" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "wallet", "type": "address" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }, { "indexed": false, "internalType": "string", "name": "acronym", "type": "string" }], "name": "RegistrationRequested", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "wallet", "type": "address" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "name": "RegistrationApproved", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "wallet", "type": "address" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }], "name": "RegistrationRejected", "type": "event" }
];

const CERT_ABI = [
    { "inputs": [{ "components": [{ "internalType": "string", "name": "studentName", "type": "string" }, { "internalType": "string", "name": "studentId", "type": "string" }, { "internalType": "string", "name": "programme", "type": "string" }, { "internalType": "string", "name": "degreeClass", "type": "string" }, { "internalType": "uint256", "name": "completionYear", "type": "uint256" }, { "internalType": "string", "name": "email", "type": "string" }, { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }, { "internalType": "string", "name": "ipfsCid", "type": "string" }], "internalType": "struct CertificateRegistry.CertificateInput", "name": "_input", "type": "tuple" }], "name": "issueCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "bytes32", "name": "_metaHash", "type": "bytes32" }, { "internalType": "string", "name": "_reason", "type": "string" }], "name": "revokeCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    {
        "inputs": [{ "internalType": "bytes32", "name": "_metaHash", "type": "bytes32" }],
        "name": "verifyCertificate",
        "outputs": [{ "components": [{ "internalType": "bytes32", "name": "metaHash", "type": "bytes32" }, { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }, { "internalType": "string", "name": "ipfsCid", "type": "string" }, { "internalType": "string", "name": "institutionName", "type": "string" }, { "internalType": "string", "name": "institutionAcronym", "type": "string" }, { "internalType": "string", "name": "programme", "type": "string" }, { "internalType": "string", "name": "degreeClass", "type": "string" }, { "internalType": "string", "name": "studentName", "type": "string" }, { "internalType": "string", "name": "studentId", "type": "string" }, { "internalType": "string", "name": "email", "type": "string" }, { "internalType": "uint256", "name": "completionYear", "type": "uint256" }, { "internalType": "uint256", "name": "issuedAt", "type": "uint256" }, { "internalType": "address", "name": "issuer", "type": "address" }, { "internalType": "bool", "name": "isValid", "type": "bool" }, { "internalType": "string", "name": "revokeReason", "type": "string" }, { "internalType": "uint256", "name": "revokedAt", "type": "uint256" }], "internalType": "struct CertificateRegistry.Certificate", "name": "", "type": "tuple" }],
        "stateMutability": "view", "type": "function"
    },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "metaHash", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "issuer", "type": "address" }, { "indexed": false, "internalType": "string", "name": "institutionName", "type": "string" }, { "indexed": false, "internalType": "string", "name": "studentName", "type": "string" }, { "indexed": false, "internalType": "string", "name": "studentId", "type": "string" }, { "indexed": false, "internalType": "string", "name": "programme", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "issuedAt", "type": "uint256" }], "name": "CertificateIssued", "type": "event" }
];

let provider, signer, userAddress, isOwner = false, isReg = false, instData = null, computedDocHash = null;
let nucSessionToken = null;

const short = a => a ? a.slice(0, 6) + "..." + a.slice(-4) : "";
const fmtDate = u => {
    if (!u || Number(u) === 0) return "—";
    return new Date(Number(u) * 1000).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
};
const qrUrl = d => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(d)}&margin=10`;

function copyTxt(t) {
    navigator.clipboard.writeText(t).then(() => {
        const b = event.target; const o = b.textContent; b.textContent = "Copied!";
        setTimeout(() => { b.textContent = o }, 1500);
    });
}
function setSt(id, type, msg) {
    const el = document.getElementById(id);
    const ico = type === "pending" ? '<span class="spin">⟳</span>' : type === "success" ? "✓" : "✗";
    el.className = "tx-st show tx-" + type;
    el.innerHTML = ico + " " + msg;
}
function clrSt(id) {
    const el = document.getElementById(id);
    el.className = "tx-st";
    el.innerHTML = "";
}

function switchTab(n) {
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    const pane = document.getElementById("pane-" + n);
    if (pane) pane.classList.add("active");
    sessionStorage.setItem("activeTab", n);
}


// ── LANDING SCREEN ────────────────────────────────────────────────────────
function enterPortal(role) {
    sessionStorage.setItem("selectedRole", role);
    sessionStorage.setItem("activeTab", role);
    const ls = document.getElementById("landingScreen");
    ls.classList.add("fade-out");
    setTimeout(() => { ls.style.display = "none"; }, 350);
    switchTab(role);
    document.body.classList.remove("tab-loading");
    document.getElementById("changeRoleBtn").classList.add("show");
}

function continuePrevious() {
    const role = sessionStorage.getItem("selectedRole") || sessionStorage.getItem("activeTab") || "verify";
    enterPortal(role);
}

function showLanding() {
    const ls = document.getElementById("landingScreen");
    ls.style.display = "flex";
    ls.style.opacity = "0";
    setTimeout(() => { ls.style.opacity = "1"; }, 10);
    ls.classList.remove("fade-out");
    sessionStorage.removeItem("selectedRole");
    document.getElementById("changeRoleBtn").classList.remove("show");
    // Show continue option since they have a previous role
    document.getElementById("landingContinue").style.display = "block";
}


// ── MOBILE SIDEBAR ───────────────────────────────────────────────────────
function toggleSidebar() {
    document.getElementById("sidebarDrawer").classList.toggle("open");
    document.getElementById("sidebarOverlay").classList.toggle("show");
    // Always re-sync state when opening
    syncSidebar();
}
function closeSidebar() {
    document.getElementById("sidebarDrawer").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("show");
}

// Keep sidebar in sync with header state
function syncSidebar() {
    const addr = document.getElementById("walletAddr").textContent;
    const role = document.getElementById("walletRole").textContent;
    const netText = document.getElementById("netBadge").textContent;
    const isConnected = addr && addr.length > 0;
    const changeRoleVisible = document.getElementById("changeRoleBtn").classList.contains("show");

    // Network
    document.getElementById("sidebarNet").textContent = netText || "";

    // Wallet
    const sw = document.getElementById("sidebarWallet");
    if (isConnected) {
        sw.style.display = "block";
        document.getElementById("sidebarAddr").textContent = addr;
        document.getElementById("sidebarRoleLabel").textContent = role;
    } else {
        sw.style.display = "none";
    }

    // Buttons
    document.getElementById("sidebarChangeRole").style.display = changeRoleVisible ? "block" : "none";
    document.getElementById("sidebarConnect").style.display = isConnected ? "none" : "block";
    document.getElementById("sidebarConnect").textContent = isConnected ? "Connected" : "Connect Wallet";
    document.getElementById("sidebarDisconnect").style.display = isConnected ? "block" : "none";
}

// Auto-detect MetaMask account or network changes
if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length === 0) {
            document.getElementById("walletPill").classList.remove("show");
            document.getElementById("connectBtn").textContent = "Connect Wallet";
            document.getElementById("connectBtn").disabled = false;
        } else {
            document.getElementById("connectBtn").textContent = "Reconnecting...";
            await connectWallet();
        }
    });
    window.ethereum.on("chainChanged", () => { window.location.reload(); });
}

// SINGLE load event listener — tab restore happens FIRST before any async work
window.addEventListener("load", async () => {

    // Check if user has already chosen a role — skip landing if so
    const selectedRole = sessionStorage.getItem("selectedRole");
    const savedTab = sessionStorage.getItem("activeTab");

    if (selectedRole) {
        // Skip landing, go straight to portal
        document.getElementById("landingScreen").style.display = "none";
        if (savedTab) switchTab(savedTab);
        document.body.classList.remove("tab-loading");
        document.getElementById("changeRoleBtn").classList.add("show");
    } else {
        // Show landing screen explicitly
        document.body.classList.remove("tab-loading");
        document.getElementById("landingScreen").style.display = "flex";
        if (savedTab) {
            document.getElementById("landingContinue").style.display = "block";
        }
        return;
    }

    // URL hash auto-verify
    const p = new URLSearchParams(window.location.search);
    const h = p.get("hash");
    if (h) {
        document.getElementById("verifyHash").value = h;
        runVerify();
    }

    // FIX 2: Only auto-reconnect if user has NOT explicitly disconnected
    if (window.ethereum && !sessionStorage.getItem("walletDisconnected")) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            userAddress = await signer.getAddress();
            const net = await provider.getNetwork();
            const nb = document.getElementById("netBadge");
            nb.classList.add("show");
            if (Number(net.chainId) === AMOY_ID) {
                nb.className = "net-badge show ok";
                nb.textContent = "Polygon Amoy ✓";
            } else {
                nb.className = "net-badge show wrong";
                nb.textContent = "Wrong network — switch to Polygon Amoy";
            }
            document.getElementById("walletAddr").textContent = short(userAddress);
            document.getElementById("walletPill").classList.add("show");
            document.getElementById("disconnectBtn").style.display = "block";
            document.getElementById("connectBtn").textContent = "Connected";
            await detectRole();
        }
    }
});

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask is not installed. Install from metamask.io");
        return;
    }
    // FIX 2: Clear disconnect flag when user manually connects
    sessionStorage.removeItem("walletDisconnected");
    const btn = document.getElementById("connectBtn");
    btn.textContent = "Connecting...";
    btn.disabled = true;
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("wallet_requestPermissions", [{ "eth_accounts": {} }]);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        const net = await provider.getNetwork();
        const nb = document.getElementById("netBadge");
        nb.classList.add("show");
        if (Number(net.chainId) === AMOY_ID) {
            nb.className = "net-badge show ok";
            nb.textContent = "Polygon Amoy ✓";
        } else {
            nb.className = "net-badge show wrong";
            nb.textContent = "Wrong network — switch to Polygon Amoy";
        }
        document.getElementById("walletAddr").textContent = short(userAddress);
        document.getElementById("disconnectBtn").style.display = "block";
        document.getElementById("walletPill").classList.add("show");
        btn.textContent = "Connected";
        await detectRole();
        syncSidebar();
    } catch (e) {
        btn.textContent = "Connect Wallet";
        btn.disabled = false;
        // Silently handle user rejection — not an error
        if (e.code !== 4001 && !e.message?.includes("rejected")) {
            console.error(e);
        }
    }
}

function disconnectWallet() {
    // FIX 2: Set flag so auto-reconnect does not fire on next refresh
    sessionStorage.setItem("walletDisconnected", "true");
    provider = null;
    signer = null;
    userAddress = null;
    isOwner = false;
    nucSessionToken = null;
    document.getElementById("nucStorageCard").style.display = "none";
    isReg = false;
    instData = null;
    document.getElementById("walletPill").classList.remove("show");
    document.getElementById("connectBtn").textContent = "Connect Wallet";
    document.getElementById("connectBtn").disabled = false;
    document.getElementById("connectBtn").style.display = "block";
    document.getElementById("disconnectBtn").style.display = "none";
    document.getElementById("netBadge").classList.remove("show");
    document.getElementById("instGate").style.display = "block";
    document.getElementById("instContent").style.display = "none";
    document.getElementById("adminGate").style.display = "block";
    document.getElementById("adminContent").style.display = "none";
    document.getElementById("adminDenied").style.display = "none";
    document.getElementById("regInstCard").style.display = "none";
    document.getElementById("statsCard").style.display = "none";
    syncSidebar();
}

async function detectRole() {
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, provider);
        const owner = await reg.owner();
        isOwner = owner.toLowerCase() === userAddress.toLowerCase();
        isReg = await reg.isRegistered(userAddress);
        if (isReg) instData = await reg.getInstitution(userAddress);
        const rEl = document.getElementById("walletRole");
        if (isOwner) {
            rEl.textContent = "NUC Admin";
            showAdmin();
            document.getElementById("instGate").style.display = "none";
            document.getElementById("instContent").style.display = "block";
            document.getElementById("instTitle").textContent = "Institution Portal";
            document.getElementById("instSub").textContent = "This wallet is the NUC Admin. Switch to an institution wallet to register or issue certificates.";
            document.getElementById("instSteps").style.display = "none";
            document.getElementById("instStatBadge").className = "badge b-gray";
            document.getElementById("instStatBadge").textContent = "Admin Wallet";
            document.getElementById("instStatDesc").textContent = "NUC Admin wallets do not issue certificates";
            document.getElementById("instStatBody").innerHTML = "<p style='font-size:.875rem;color:var(--n500)'>To issue certificates, connect a registered institution wallet. This wallet is configured as the NUC regulatory admin.</p>";
            document.getElementById("regCard").style.display = "none";
            document.getElementById("issueCard").style.display = "none";
            document.getElementById("revokeCard").style.display = "none";
            document.getElementById("histCard").style.display = "none";
        } else if (isReg) {
            rEl.textContent = instData[1];
            showInstitution();
        } else {
            let pend = false;
            try { await reg.getPendingInstitution(userAddress); pend = true; } catch { }
            rEl.textContent = pend ? "Pending" : "Unregistered";
            showInstitution(pend);
        }
    } catch (e) {
        console.error("Role detection:", e);
    }
}

function showAdmin() {
    document.getElementById("adminGate").style.display = "none";
    document.getElementById("adminDenied").style.display = "none";
    document.getElementById("adminContent").style.display = "block";
    document.getElementById("regInstCard").style.display = "block";
    document.getElementById("statsCard").style.display = "block";
    document.getElementById("nucStorageCard").style.display = "block";
    loadPending();
    loadRegistered();
    loadStats();
}

function nucEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function nucSafeUrl(value) {
    try { const u = new URL(String(value || "")); return ["https:","http:"].includes(u.protocol) ? u.href : null; }
    catch { return null; }
}
function nucDetails(wallet) {
    const d = (window._regData || []).find(r => r.wallet.toLowerCase() === String(wallet).toLowerCase());
    const box = document.getElementById("nucInstitutionDetails");
    if (!d || !box) return;
    const url = nucSafeUrl(d.website);
    box.hidden = false;
    box.innerHTML = `<div class="card-hdr"><div><h2>${nucEscape(d.name)}</h2><p>Institution profile · V1 registry</p></div><button type="button" class="btn btn-ghost btn-sm" id="nucCloseDetails">Close</button></div>
      <div class="card-body"><div class="cert-grid">
      <div class="cf"><div class="cf-lbl">Acronym</div><div class="cf-val">${nucEscape(d.acronym)}</div></div>
      <div class="cf"><div class="cf-lbl">Live registry status</div><div class="cf-val">${d.registered ? "Registered" : "Not registered"}</div></div>
      <div class="cf full"><div class="cf-lbl">Institution wallet</div><div class="cf-val mono">${nucEscape(d.wallet)}</div></div>
      <div class="cf"><div class="cf-lbl">Registration date</div><div class="cf-val">${nucEscape(fmtDate(d.registrationTime || d.timestamp))}</div></div>
      <div class="cf"><div class="cf-lbl">Website</div><div class="cf-val">${url ? `<a href="${nucEscape(url)}" target="_blank" rel="noopener noreferrer">${nucEscape(d.website)}</a>` : nucEscape(d.website || "Not supplied")}</div></div>
      </div><p class="nuc-note">V1 registry status is read directly from the contract. Suspension, reinstatement, institution revocation and wallet rotation require a deployed V2.1 governance integration. No such action is available here.</p></div>`;
    document.getElementById("nucCloseDetails").addEventListener("click", () => { box.hidden = true; box.innerHTML = ""; });
    box.scrollIntoView({behavior:"smooth",block:"nearest"});
}
async function loadRegistered() {
    const el = document.getElementById("registeredList");
    el.innerHTML = `<div class="empty"><span class="ei spin">⟳</span><p>Checking indexed history and live registry...</p></div>`;
    try {
        const query = `{ registrationApproveds(first:1000, orderBy:timestamp, orderDirection:asc) { wallet name timestamp } }`;
        const res = await fetch(GRAPH_URL, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({query})});
        if (!res.ok) throw new Error("Institution history request failed");
        const payload = await res.json();
        if (payload.errors?.length) throw new Error(payload.errors[0].message);
        if (!payload.data) throw new Error("Institution history is unavailable");
        const latest = new Map();
        for (const e of payload.data.registrationApproveds || []) {
            if (ethers.isAddress(e.wallet) && !HIDDEN_WALLETS.includes(e.wallet.toLowerCase())) {
                latest.set(e.wallet.toLowerCase(), e);
            }
        }
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, provider);
        const records = await Promise.all([...latest.values()].map(async ev => {
            try {
                const registered = await reg.isRegistered(ev.wallet);
                let d = null;
                try { d = await reg.getInstitution(ev.wallet); } catch { /* historical entry may no longer be registered */ }
                return {wallet:ev.wallet, name:d?.[0] || ev.name || "Unknown institution", acronym:d?.[1] || "—", website:d?.[2] || "", registrationTime:d?.[3] || 0, timestamp:ev.timestamp, registered};
            } catch { return {wallet:ev.wallet,name:ev.name || "Unknown institution",acronym:"—",website:"",timestamp:ev.timestamp,registered:null}; }
        }));
        window._regData = records;
        const active = records.filter(r => r.registered === true).length;
        const unknown = records.filter(r => r.registered === null).length;
        const excludedLegacy = (payload.data.registrationApproveds || []).filter(e => ethers.isAddress(e.wallet) && HIDDEN_WALLETS.includes(e.wallet.toLowerCase())).length;
        const rows = records.map(d => {
            const url = nucSafeUrl(d.website);
            const badge = d.registered === true ? '<span class="badge b-green">✓ Registered</span>' : d.registered === false ? '<span class="badge b-gray">Not registered</span>' : '<span class="badge b-amber">Status unavailable</span>';
            return `<tr><td><strong>${nucEscape(d.name)}</strong></td><td>${nucEscape(d.acronym)}</td><td>${url ? `<a href="${nucEscape(url)}" target="_blank" rel="noopener noreferrer">${nucEscape(d.website)}</a>` : nucEscape(d.website || "—")}</td><td class="mono-sm">${nucEscape(short(d.wallet))}</td><td>${badge}</td><td><button type="button" class="btn btn-ghost btn-sm nuc-view-inst" data-wallet="${nucEscape(d.wallet)}">View</button></td></tr>`;
        }).join("");
        el.innerHTML = `<div class="nuc-directory-summary"><strong>${active}</strong> currently registered · ${records.length} historical approvals${unknown ? ` · ${unknown} status checks unavailable` : ""}</div>
          <div class="nuc-directory-tools"><input id="nucInstitutionSearch" type="search" aria-label="Search institutions" placeholder="Search institution, acronym or wallet"><button class="btn btn-ghost btn-sm" onclick="exportRegCSV()">⬇ Export CSV</button></div>
          <div style="overflow-x:auto"><table class="hist-tbl"><thead><tr><th>Institution</th><th>Acronym</th><th>Website</th><th>Wallet</th><th>V1 status</th><th>Details</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No indexed approvals found.</td></tr>'}</tbody></table></div>
          <p class="nuc-note">Historical approvals come from The Graph (first 1,000 events); registration status is checked live on V1. ${excludedLegacy ? `${excludedLegacy} legacy NUC-wallet approval event(s) excluded from the ordinary directory and CSV (display-only; on-chain authorization unchanged). ` : ""}This is not a complete V2.1 governance directory.</p>`;
        el.querySelectorAll(".nuc-view-inst").forEach(btn => btn.addEventListener("click", () => nucDetails(btn.dataset.wallet)));
        document.getElementById("nucInstitutionSearch").addEventListener("input", e => {
            const term = e.target.value.trim().toLowerCase();
            el.querySelectorAll("tbody tr").forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(term) && !(row.querySelector("[data-wallet]")?.dataset.wallet || "").toLowerCase().includes(term); });
        });
    } catch (e) {
        el.innerHTML = `<div class="empty"><span class="ei">⚠️</span><p>Unable to load institution directory: ${nucEscape(e.message)}</p></div>`;
    }
}

function exportRegCSV() {
    const data = window._regData || [];
    if (!data.length) return;
    downloadCSV(
        "certiverf_registered_institutions.csv",
        ["Institution", "Acronym", "Website", "Wallet", "V1 status", "Registered"],
        data.map(ev => [ev.name || "", ev.acronym || "", ev.website || "", ev.wallet, ev.registered === true ? "Registered" : ev.registered === false ? "Not registered" : "Unavailable", fmtDate(ev.registrationTime || ev.timestamp)])
    );
}

function showInstitution(isPend = false) {
    document.getElementById("instGate").style.display = "none";
    document.getElementById("instContent").style.display = "block";
    document.getElementById("adminGate").style.display = "none";
    document.getElementById("adminDenied").style.display = "block";
    const t = document.getElementById("instTitle"), s = document.getElementById("instSub"),
        badge = document.getElementById("instStatBadge"), desc = document.getElementById("instStatDesc"),
        body = document.getElementById("instStatBody"), steps = document.getElementById("instSteps"),
        regC = document.getElementById("regCard"), issC = document.getElementById("issueCard"),
        revC = document.getElementById("revokeCard"), histC = document.getElementById("histCard");
    if (isReg && instData) {
        t.textContent = instData[0];
        s.textContent = "Registered institution — issue and manage certificates";
        badge.className = "badge b-green"; badge.textContent = "✓ Approved by NUC";
        desc.textContent = "Your institution is approved and active";
        body.innerHTML = `<p style="font-size:.875rem;color:var(--n700)"><strong>${instData[0]}</strong> (${instData[1]}) · ${instData[2]}<br/><span style="color:var(--n500)">Registered on ${fmtDate(instData[3])}</span></p>`;
        steps.innerHTML = `<div class="step"><span class="step-num">1</span><span class="step-text">Fill in graduate details</span></div><span class="step-arrow">→</span><div class="step"><span class="step-num">2</span><span class="step-text">Upload PDF to compute SHA-256 fingerprint</span></div><span class="step-arrow">→</span><div class="step"><span class="step-num">3</span><span class="step-text">Issue on blockchain — receive hash + QR code</span></div>`;
        regC.style.display = "none"; issC.style.display = "block"; revC.style.display = "block"; histC.style.display = "block";
    } else if (isPend) {
        t.textContent = "Registration Pending";
        s.textContent = "Your request awaits NUC review";
        badge.className = "badge b-amber"; badge.textContent = "⏳ Pending";
        desc.textContent = "Awaiting NUC approval";
        body.innerHTML = `<p style="font-size:.875rem;color:var(--n500)">Your registration has been submitted. You will be able to issue certificates once the NUC admin approves your request.</p>`;
        steps.style.display = "none";
        regC.style.display = "none"; issC.style.display = "none"; revC.style.display = "none"; histC.style.display = "none";
    } else {
        t.textContent = "Register Your Institution";
        s.textContent = "Submit a registration request to the NUC. Once approved, you can issue blockchain certificates.";
        badge.className = "badge b-gray"; badge.textContent = "Not Registered";
        desc.textContent = "Submit a registration request below";
        body.innerHTML = `<p style="font-size:.875rem;color:var(--n500)">Complete the form below and submit your registration to NUC for approval.</p>`;
        steps.innerHTML = `<div class="step"><span class="step-num">1</span><span class="step-text">Fill in your institution details</span></div><span class="step-arrow">→</span><div class="step"><span class="step-num">2</span><span class="step-text">Submit request to NUC Admin</span></div><span class="step-arrow">→</span><div class="step"><span class="step-num">3</span><span class="step-text">Once approved — issue certificates</span></div>`;
        regC.style.display = "block"; issC.style.display = "none"; revC.style.display = "none"; histC.style.display = "none";
    }
}

async function doRegister() {
    const name = document.getElementById("regName").value.trim(),
        acr = document.getElementById("regAcronym").value.trim(),
        web = document.getElementById("regWebsite").value.trim();
    if (!name || !acr) { setSt("regSt", "error", "Institution name and acronym are required."); return; }
    const btn = document.getElementById("regBtn"); btn.disabled = true;
    setSt("regSt", "pending", "Submitting registration to blockchain...");
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, signer);
        const tx = await reg.requestRegistration(name, acr, web, { maxPriorityFeePerGas: ethers.parseUnits('65', 'gwei'), maxFeePerGas: ethers.parseUnits('70', 'gwei'), gasLimit: 400000 });
        setSt("regSt", "pending", "Transaction submitted — awaiting confirmation...");
        await tx.wait();
        setSt("regSt", "success", "Registration submitted! NUC Admin will see your request automatically. Your wallet: " + userAddress);
        await detectRole();
    } catch (e) { setSt("regSt", "error", e.reason || e.message); btn.disabled = false; }
}

async function onPdf(input) {
    const file = input.files[0]; if (!file) return;
    computedDocHash = null;
    document.getElementById("docHashDiv").style.display = "none";
    try {
        const buf = await file.arrayBuffer();
        const hb = await crypto.subtle.digest("SHA-256", buf);
        const arr = Array.from(new Uint8Array(hb));
        computedDocHash = "0x" + arr.map(b => b.toString(16).padStart(2, "0")).join("");
        document.getElementById("docHashVal").textContent = computedDocHash;
        document.getElementById("docHashDiv").style.display = "block";
    } catch (e) { console.error(e); }
}



async function doIssue(options = {}) {
    const diagnostic = options?.diagnostic === true;
    const btn = document.getElementById("issueBtn");
    const resultEl = document.getElementById("issueResult");
    const ipfsField = document.getElementById("stuIpfs");

    let stage = "validation";

    function report(type, message) {
        setSt("issueSt", type, message);
        console.log(`[CERTIVERF][${type.toUpperCase()}] ${message}`);
    }

    function fail(message) {
        report("error", message);
        return {
            success: false,
            stage,
            error: message,
            transactionSubmitted: false
        };
    }

    // Prevent simultaneous issuance attempts.
    if (btn.disabled) {
        return fail("Another certificate issuance is already in progress.");
    }

    const name = document.getElementById("stuName").value.trim();
    const id = document.getElementById("stuId").value.trim();
    const prog = document.getElementById("stuProg").value.trim();
    const cls = document.getElementById("stuClass").value;
    const yr = Number(document.getElementById("stuYear").value);
    const em = document.getElementById("stuEmail").value.trim();
    const pdf = document.getElementById("certPdf").files[0];

    if (!name || !id || !prog || !cls ||
        !Number.isInteger(yr) || yr <= 0) {
        return fail("Complete all required certificate fields.");
    }

    if (!pdf) {
        return fail("Select a certificate PDF before issuance.");
    }

    if (!signer) {
        return fail("Connect your institution wallet first.");
    }

    if (!pdf.name.toLowerCase().endsWith(".pdf") ||
        pdf.type && pdf.type !== "application/pdf") {
        return fail("Only PDF certificate files are accepted.");
    }

    btn.disabled = true;
    resultEl.style.display = "none";

    let transactionSubmitted = false;
    let transactionHash = null;

    try {
        // STEP 1: Calculate PDF SHA-256.
        stage = "pdf-hashing";
        report("pending", "Calculating certificate SHA-256...");

        const dHash = await sha256Pdf(pdf);

        computedDocHash = dHash;

        document.getElementById("docHashVal").textContent = dHash;
        document.getElementById("docHashDiv").style.display = "block";

        // STEP 2: Reuse an existing CID for the same PDF.
        stage = "pinata-upload";

        const cacheKey = `certiverf_pinata_${dHash.toLowerCase()}`;
        let ipfs = sessionStorage.getItem(cacheKey);

        if (ipfs && !/^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]+$/i.test(ipfs)) {
            ipfs = null;
        }

        if (ipfs) {
            report("pending", "Reusing previously uploaded Pinata CID...");
        } else {
            report(
                "pending",
                "Authenticating institution and uploading PDF to Pinata..."
            );

            const uploaded = await uploadCertificateToPinata(pdf, dHash);

            if (!uploaded?.cid ||
                uploaded.docHash?.toLowerCase() !== dHash.toLowerCase()) {
                throw new Error("Pinata upload validation failed.");
            }

            ipfs = uploaded.cid;
            sessionStorage.setItem(cacheKey, ipfs);
        }

        ipfsField.value = ipfs;

        // STEP 3: Prepare the issuance transaction.
        stage = "transaction-preparation";

        const cert = new ethers.Contract(CERT_ADDR, CERT_ABI, signer);

        const certificateData = [
            name,
            id,
            prog,
            cls,
            BigInt(yr),
            em,
            dHash,
            ipfs
        ];

        // STEP 4: Estimate gas using the actual certificate data.
        stage = "gas-estimation";
        report("pending", "Estimating blockchain gas. No transaction submitted...");

        const estimatedGas =
            await cert.issueCertificate.estimateGas(certificateData);

        const gasLimit = (estimatedGas * 120n) / 100n;

        const diagnosticResult = {
            success: true,
            stage: "gas-estimation",
            estimatedGas: estimatedGas.toString(),
            suggestedGasLimit: gasLimit.toString(),
            pdfSHA256: dHash,
            pinataCID: ipfs,
            transactionSubmitted: false
        };

        console.table(diagnosticResult);

        // DIAGNOSTIC MODE: stop safely before blockchain submission.
        if (diagnostic) {
            report(
                "success",
                `GAS DIAGNOSTIC SUCCESSFUL | ` +
                `Estimated gas: ${estimatedGas} | ` +
                `Suggested limit: ${gasLimit} | ` +
                `No blockchain transaction submitted.`
            );

            return diagnosticResult;
        }

        // STEP 5: Submit transaction.
        stage = "transaction-submission";

        report(
            "pending",
            `Estimated gas: ${estimatedGas}. ` +
            `Gas limit: ${gasLimit}. Confirm transaction in MetaMask...`
        );

        const tx = await cert.issueCertificate(
            certificateData,
            { gasLimit }
        );

        transactionSubmitted = true;
        transactionHash = tx.hash;

        stage = "transaction-confirmation";
        report(
            "pending",
            `Transaction submitted: ${transactionHash}. Awaiting confirmation...`
        );

        const receipt = await tx.wait();

        if (!receipt || receipt.status !== 1) {
            throw new Error("Certificate issuance transaction reverted.");
        }

        // STEP 6: Extract the certificate metadata hash.
        stage = "receipt-processing";

        let mHash = "";

        for (const log of receipt.logs) {
            try {
                const parsed = cert.interface.parseLog(log);

                if (parsed?.name === "CertificateIssued") {
                    mHash = parsed.args.metaHash;
                    break;
                }
            } catch {
                // Ignore unrelated contract logs.
            }
        }

        document.getElementById("issuedHash").textContent =
            mHash || "Event hash not found; inspect transaction receipt.";

        // STEP 7: Generate verification QR.
        const issueQR = document.getElementById("issueQR");
        issueQR.style.display = "none";

        if (mHash) {
            const verificationLink = PAGE_URL + "?hash=" + mHash;
            const issueQREl = document.getElementById("issueQRImg");

            issueQREl.onerror = () => {
                issueQR.style.display = "none";
            };

            issueQREl.src = qrUrl(verificationLink);
            issueQR.style.display = "flex";
        }

        resultEl.style.display = "block";

        report(
            "success",
            "CERTIFICATE ISSUED SUCCESSFULLY. " +
            `Transaction: ${transactionHash}`
        );

        return {
            success: true,
            stage: "completed",
            metaHash: mHash,
            pdfSHA256: dHash,
            pinataCID: ipfs,
            transactionHash,
            estimatedGas: estimatedGas.toString(),
            gasLimit: gasLimit.toString(),
            transactionSubmitted: true
        };

    } catch (error) {
        console.error(`[CERTIVERF][${stage}]`, error);

        const message =
            error.shortMessage ||
            error.reason ||
            error.message ||
            "Unknown certificate issuance error.";

        report("error", `${stage.toUpperCase()} FAILED: ${message}`);

        return {
            success: false,
            stage,
            error: message,
            transactionSubmitted,
            transactionHash
        };

    } finally {
        btn.disabled = false;
    }
}



async function doRevoke() {
    const h = document.getElementById("revokeHash").value.trim(), r = document.getElementById("revokeReason").value.trim();
    if (!h || !r) { setSt("revokeSt", "error", "Both fields are required."); return; }
    if (!confirm("Revocation is permanent. Proceed?")) return;
    const btn = document.getElementById("revokeBtn"); btn.disabled = true;
    setSt("revokeSt", "pending", "Submitting revocation...");
    try {
        const cert = new ethers.Contract(CERT_ADDR, CERT_ABI, signer);
        const tx = await cert.revokeCertificate(h, r, { maxPriorityFeePerGas: ethers.parseUnits('65', 'gwei'), maxFeePerGas: ethers.parseUnits('70', 'gwei'), gasLimit: 300000 });
        setSt("revokeSt", "pending", "Awaiting confirmation...");
        await tx.wait();
        setSt("revokeSt", "success", "Certificate revoked. Reason and timestamp stored permanently on-chain.");
        btn.disabled = false;
    } catch (e) { setSt("revokeSt", "error", e.reason || e.message); btn.disabled = false; }
}


function downloadCSV(filename, headers, rows) {
    const escape = v => {
        const s = String(v ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n")
            ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [headers.map(escape).join(","),
    ...rows.map(r => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

async function loadHistory() {
    const el = document.getElementById("histContent");
    el.innerHTML = `<div class="empty"><span class="ei spin">⟳</span><p>Loading from The Graph...</p></div>`;
    try {
        const query = `{
            certificateIssueds(
                where: { issuer: "${userAddress.toLowerCase()}" }
                orderBy: issuedAt
                orderDirection: desc
                first: 1000
            ) { metaHash studentName studentId programme issuedAt }
        }`;
        const res = await fetch(GRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const jsonHist = await res.json();
        if (jsonHist.errors) throw new Error(jsonHist.errors[0].message);
        const events = jsonHist.data ? jsonHist.data.certificateIssueds : [];
        if (!events || !events.length) {
            el.innerHTML = `<div class="empty"><span class="ei">📜</span><p>No certificates issued yet.</p></div>`;
            return;
        }
        // Check on-chain validity for each certificate
        const rp = new ethers.JsonRpcProvider(RPC_URL);
        const cert = new ethers.Contract(CERT_ADDR, CERT_ABI, rp);
        const statuses = await Promise.all(events.map(async c => {
            try {
                const r = await cert.verifyCertificate(c.metaHash);
                return { valid: r.isValid, reason: r.revokeReason, revokedAt: r.revokedAt };
            } catch { return { valid: true, reason: "", revokedAt: 0 }; }
        }));

        // Store for CSV export
        window._histData = events.map((c, i) => ({ ...c, ...statuses[i] }));

        const rows = events.map((c, i) => {
            const s = statuses[i];
            const statusBadge = s.valid
                ? `<span class="badge b-green" style="font-size:.65rem">✓ Valid</span>`
                : `<span class="badge b-red" style="font-size:.65rem">✗ Revoked</span>`;
            return `<tr>
                <td>${i + 1}</td>
                <td><strong>${c.studentName}</strong><br/><span style="color:var(--n500);font-size:.75rem">${c.studentId}</span></td>
                <td>${c.programme}</td>
                <td>${fmtDate(c.issuedAt)}</td>
                <td>${statusBadge}${!s.valid ? `<br/><span style="font-size:.7rem;color:var(--revoked)">${s.reason.slice(0, 40)}${s.reason.length > 40 ? "..." : ""}</span>` : ""}</td>
                <td><span class="mono-sm">${c.metaHash.slice(0, 14)}...</span><br/>
                <button class="copy-btn" style="margin-top:4px" onclick="navigator.clipboard.writeText('${c.metaHash}')">Copy</button></td>
            </tr>`;
        }).join("");

        const validCount = statuses.filter(s => s.valid).length;
        const revokedCount = statuses.filter(s => !s.valid).length;

        el.innerHTML = `
            <div style="display:flex;gap:12px;padding:16px 16px 0;flex-wrap:wrap">
                <span style="background:var(--g50);border:1px solid var(--g200);border-radius:8px;padding:8px 16px;font-size:.82rem;font-weight:600;color:var(--g700)">✓ ${validCount} Valid</span>
                ${revokedCount > 0 ? `<span style="background:#FFF5F5;border:1px solid #FECACA;border-radius:8px;padding:8px 16px;font-size:.82rem;font-weight:600;color:var(--revoked)">✗ ${revokedCount} Revoked</span>` : ""}
                <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="exportHistCSV()">⬇ Export CSV</button>
            </div>
            <div style="overflow-x:auto">
            <table class="hist-tbl">
                <thead><tr><th>#</th><th>Graduate</th><th>Programme</th><th>Date Issued</th><th>Status</th><th>Certificate Hash</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>`;
    } catch (e) {
        el.innerHTML = `<div class="empty"><span class="ei">⚠️</span><p>${e.message}</p></div>`;
    }
}

function exportHistCSV() {
    const data = window._histData || [];
    if (!data.length) return;
    downloadCSV(
        "certiverf_certificate_history.csv",
        ["#", "Student Name", "Student ID", "Programme", "Date Issued", "Status", "MetaHash"],
        data.map((c, i) => [i + 1, c.studentName, c.studentId, c.programme, fmtDate(c.issuedAt), c.valid ? "Valid" : "Revoked", c.metaHash])
    );
}

async function loadPending() {
    const list = document.getElementById("pendingList");
    list.innerHTML = `<div class="empty"><span class="ei spin">⟳</span><p>Loading pending applications...</p></div>`;
    try {
        const query = `{
            registrationRequesteds(orderBy: blockTimestamp, orderDirection: asc, first: 1000) {
                wallet
                name
                acronym
            }
            registrationApproveds(first: 1000) {
                wallet
            }
            registrationRejecteds(first: 1000) {
                wallet
            }
        }`;
        const res = await fetch(GRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);
        if (!json.data) throw new Error("No data returned from The Graph");

        const requested = json.data.registrationRequesteds || [];
        // Historical rejection/approval events do not prove current pending state.
        // Deduplicate by wallet; the contract is authoritative for pending requests.
        const byWallet = new Map();
        for (const r of requested) if (ethers.isAddress(r.wallet)) byWallet.set(r.wallet.toLowerCase(), r);
        const candidates = [...byWallet.values()];

        if (candidates.length === 0) {
            list.innerHTML = `<div class="empty"><span class="ei">✅</span><p>No pending applications at this time.</p></div>`;
            return;
        }

        // Cross-check each candidate against live contract state (covers subgraph indexing lag / edge cases)
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, provider);
        list.innerHTML = "";
        let shownAny = false;
        for (const item of candidates) {
            let stillPending = false; let web = "";
            try { const pd = await reg.getPendingInstitution(item.wallet); stillPending = true; web = pd[2] || ""; } catch { }
            if (!stillPending) continue;
            shownAny = true;
            const el = document.createElement("div"); el.className = "pend-row";
            el.innerHTML = `<div class="pend-info"><h3>${nucEscape(item.name)} <span style="font-weight:400;color:var(--n500)">(${nucEscape(item.acronym)})</span></h3>${web ? `<p>${nucEscape(web)}</p>` : ""}<div class="pend-addr">${nucEscape(item.wallet)}</div></div><div class="pend-acts"><button class="btn btn-green btn-sm">✓ Approve</button><button class="btn btn-danger btn-sm">✗ Reject</button></div>`;
            const buttons = el.querySelectorAll(".pend-acts button");
            buttons[0].addEventListener("click", () => doApprove(item.wallet, item.name));
            buttons[1].addEventListener("click", () => doReject(item.wallet, item.name));
            list.appendChild(el);
        }
        if (!shownAny) {
            list.innerHTML = `<div class="empty"><span class="ei">✅</span><p>No pending applications at this time.</p></div>`;
        }
    } catch (e) {
        list.innerHTML = `<div class="empty"><span class="ei">⚠️</span><p style="color:var(--n700);font-size:.85rem">${e.message}<br/><br/>Use the <strong>Look Up an Institution</strong> tool below if the subgraph is temporarily unavailable.</p></div>`;
    }
}

async function doApprove(addr, name) {
    setSt("adminSt", "pending", `Approving ${name}...`);
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, signer);
        const tx = await reg.approveRegistration(addr);
        setSt("adminSt", "pending", "Awaiting confirmation...");
        await tx.wait();
        const lsApp = JSON.parse(localStorage.getItem("cv_approved") || "[]");
        if (!lsApp.find(i => i.wallet.toLowerCase() === addr.toLowerCase()))
            lsApp.push({ wallet: addr, name: name, approvedAt: Date.now() });
        localStorage.setItem("cv_approved", JSON.stringify(lsApp));
        setSt("adminSt", "success", `${name} approved — can now issue certificates.`);
        await loadPending();
        loadRegistered();
    } catch (e) { setSt("adminSt", "error", e.reason || e.message); }
}

async function doReject(addr, name) {
    if (!confirm(`Reject ${name}?`)) return;
    setSt("adminSt", "pending", `Rejecting ${name}...`);
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, signer);
        const tx = await reg.rejectRegistration(addr);
        await tx.wait();
        setSt("adminSt", "success", `${name} rejected.`);
        await loadPending();
    } catch (e) { setSt("adminSt", "error", e.reason || e.message); }
}

async function doLookup() {
    const addr = document.getElementById("lookupAddr").value.trim(), out = document.getElementById("lookupResult");
    if (!addr) return;
    out.innerHTML = `<p style="font-size:.82rem;color:var(--n400)">Looking up...</p>`;
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, provider);
        const ok = await reg.isRegistered(addr);
        if (ok) {
            const d = await reg.getInstitution(addr);
            const lsApp = JSON.parse(localStorage.getItem("cv_approved") || "[]");
            if (!lsApp.find(i => i.wallet.toLowerCase() === addr.toLowerCase())) {
                lsApp.push({ wallet: addr, name: d[0], approvedAt: Date.now() });
                localStorage.setItem("cv_approved", JSON.stringify(lsApp));
            }
            loadRegistered();
            out.innerHTML = `<div style="background:var(--g50);border:1px solid var(--g200);border-radius:8px;padding:16px"><span class="badge b-green">✓ Registered</span><p style="margin-top:10px;font-weight:700">${d[0]} (${d[1]})</p><p style="color:var(--n500);font-size:.82rem">${d[2]}</p><p style="color:var(--n500);font-size:.78rem;margin-top:4px">Registered ${fmtDate(d[3])}</p></div>`;
        } else {
            let pend = false; let pd = { name: "", acronym: "", website: "" };
            try { const r = await reg.getPendingInstitution(addr); pend = true; pd = { name: r[0], acronym: r[1], website: r[2] }; } catch { }
            if (pend) {
                out.innerHTML = `<div style="background:var(--gold-bg);border:1px solid #EDD9A3;border-radius:8px;padding:18px">
                    <span class="badge b-amber">⏳ Pending Approval</span>
                    <p style="margin-top:12px;font-weight:700;font-size:.95rem">${pd.name} (${pd.acronym})</p>
                    ${pd.website ? `<p style="color:var(--n500);font-size:.82rem;margin-top:4px">${pd.website}</p>` : ""}
                    <p style="font-family:monospace;font-size:.72rem;color:var(--n400);margin-top:6px;word-break:break-all">${addr}</p>
                    <div style="display:flex;gap:10px;margin-top:16px">
                        <button class="btn btn-green btn-sm" onclick="doApprove('${addr}','${pd.name}')">✓ Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="doReject('${addr}','${pd.name}')">✗ Reject</button>
                    </div>
                </div>`;
            } else {
                out.innerHTML = `<div style="background:#FFF5F5;border:1px solid #FECACA;border-radius:8px;padding:14px"><span class="badge b-red">Not Registered</span></div>`;
            }
        }
    } catch (e) { out.innerHTML = `<p style="font-size:.82rem;color:var(--revoked)">Error: ${e.message}</p>`; }
}


// Phase 4: Compare a presented PDF to the registered on-chain document digest.
// This check works with the deployed V1 contract and does not fetch the IPFS copy.
function clearPdfVerification() {
    const outcome = document.getElementById("pdfVerifyOutcome");
    if (outcome) { outcome.className = "tx-st"; outcome.textContent = ""; }
    // An uploaded PDF change invalidates the previous combined verdict.
    const card = document.getElementById("certCard");
    if (card) card.style.display = "none";
}

function setVerificationHero(kind) {
    const hero = document.getElementById("certHero");
    const states = {
        verified: ["🛡️", "CERTIFICATE VERIFIED", "The blockchain record is valid and the presented PDF matches its registered SHA-256.", true],
        record: ["ℹ️", "BLOCKCHAIN RECORD VALID", "This certificate record is valid on Polygon Amoy. No presented PDF was checked.", true],
        mismatch: ["🚫", "DOCUMENT VERIFICATION FAILED", "The blockchain record is valid, but the presented PDF differs from the registered document. Do not accept this PDF as verified.", false],
        inconclusive: ["⚠️", "DOCUMENT VERIFICATION INCONCLUSIVE", "The presented PDF could not be authenticated against a usable on-chain document hash.", false],
        revoked: ["🚫", "CERTIFICATE REVOKED", "This certificate has been revoked by the issuing institution.", false]
    };
    const [icon, title, detail, positive] = states[kind];
    const css = positive ? "valid" : "revoked";
    hero.innerHTML = `<span class="shield-icon shield-${css}">${icon}</span><div class="result-title ${css}">${title}</div><div class="result-sub">${detail}</div>`;
}

async function sha256Pdf(file) {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) throw new Error("Select a PDF file.");
    if (!file.size) throw new Error("The PDF is empty.");
    const bytes = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return "0x" + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPresentedPdf(c) {
    const file = document.getElementById("verifyPdf")?.files?.[0];
    if (!file) return; // Legacy hash-only verification remains available.
    const out = document.getElementById("pdfVerifyOutcome");
    out.className = "tx-st show tx-pending";
    out.textContent = "Calculating presented PDF fingerprint...";
    try {
        const actual = await sha256Pdf(file);
        const registered = String(c.docHash || "").toLowerCase();
        if (!/^0x[0-9a-f]{64}$/.test(registered) || /^0x0{64}$/.test(registered)) {
            if (c.isValid) setVerificationHero("inconclusive");
            out.className = "tx-st show tx-error";
            out.textContent = "INCONCLUSIVE: This blockchain record has no usable registered PDF fingerprint. PDF integrity cannot be established.";
            return;
        }
        const matched = actual === registered;
        setVerificationHero(!c.isValid ? "revoked" : matched ? "verified" : "mismatch");
        out.className = "tx-st show " + (matched ? "tx-success" : "tx-error");
        out.textContent = (matched ? "PDF MATCH: Presented PDF bytes match the on-chain docHash." : "PDF MISMATCH: Presented PDF differs from the registered document.") +
            " Presented SHA-256: " + actual + " | Registered SHA-256: " + registered +
            " | Certificate status: " + (c.isValid ? "valid" : "revoked") + ".";
    } catch (e) {
        if (c.isValid) setVerificationHero("inconclusive");
        out.className = "tx-st show tx-error";
        out.textContent = "PDF integrity check failed: " + e.message;
    }
}

async function runVerify() {
    const hash = document.getElementById("verifyHash").value.trim();
    document.getElementById("certCard").style.display = "none";
    clearPdfVerification();
    if (!hash.startsWith("0x") || hash.length !== 66) { setSt("verifySt", "error", "Enter a valid certificate hash — starts with 0x, exactly 66 characters."); return; }
    const btn = document.getElementById("verifyBtn"); btn.disabled = true;
    setSt("verifySt", "pending", "Querying Polygon Amoy blockchain...");
    try {
        const rp = new ethers.JsonRpcProvider(RPC_URL);
        const cert = new ethers.Contract(CERT_ADDR, CERT_ABI, rp);
        const c = await cert.verifyCertificate(hash);
        clrSt("verifySt");
        showResult(c, hash);
        await verifyPresentedPdf(c);
    } catch (e) {
        let msg = e.message || "Unknown error";
        if (msg.includes("Certificate not found")) msg = "No certificate found for this hash. Please check and try again.";
        setSt("verifySt", "error", msg);
    } finally { btn.disabled = false; }
}

function clearResult() {
    document.getElementById("verifyHash").value = "";
    document.getElementById("verifyPdf").value = "";
    clearPdfVerification();
    document.getElementById("certCard").style.display = "none";
    clrSt("verifySt");
}

function showResult(c, hash) {
    const valid = c.isValid;
    setVerificationHero(valid ? "record" : "revoked");
    document.getElementById("certFields").innerHTML = `
    <div class="cf"><div class="cf-lbl">Student Name</div><div class="cf-val">${c.studentName}</div></div>
    <div class="cf"><div class="cf-lbl">Student ID</div><div class="cf-val">${c.studentId}</div></div>
    <div class="cf full"><div class="cf-lbl">Issuing Institution</div><div class="cf-val">${c.institutionName} (${c.institutionAcronym})</div></div>
    <div class="cf full"><div class="cf-lbl">Programme</div><div class="cf-val">${c.programme}</div></div>
    <div class="cf"><div class="cf-lbl">Degree Classification</div><div class="cf-val">${c.degreeClass}</div></div>
    <div class="cf"><div class="cf-lbl">Completion Year</div><div class="cf-val">${c.completionYear.toString()}</div></div>
    <div class="cf"><div class="cf-lbl">Date Issued (On-Chain)</div><div class="cf-val">${fmtDate(c.issuedAt)}</div></div>
    <div class="cf"><div class="cf-lbl">Issuing Wallet</div><div class="cf-val mono">${c.issuer}</div></div>
    <div class="cf full"><div class="cf-lbl">Certificate Hash (metaHash)</div><div class="cf-val mono">${hash}<button class="copy-btn" style="margin-left:12px" onclick="copyTxt('${hash}')">Copy</button></div></div>
    <div class="cf full"><div class="cf-lbl">Document Fingerprint (SHA-256 docHash)</div><div class="cf-val mono">${c.docHash}</div></div>
    ${c.ipfsCid && c.ipfsCid !== "" && c.ipfsCid !== "QmTestCidPlaceholder" ? `<div class="cf full"><div class="cf-lbl">IPFS Document</div><div class="cf-val"><a href="https://ipfs.io/ipfs/${c.ipfsCid}" target="_blank" rel="noopener" style="color:var(--g600)">${c.ipfsCid}</a></div></div>` : ""}
    ${!valid ? `<div class="cf full alert"><div class="cf-lbl">Revocation Reason</div><div class="cf-val">${c.revokeReason}</div><div class="cf-lbl" style="margin-top:10px">Revoked On</div><div class="cf-val">${fmtDate(c.revokedAt)}</div></div>` : ""}`;
    if (valid) {
        const link = PAGE_URL + "?hash=" + hash;
        // FIX 3: QR with error fallback
        const qrEl = document.getElementById("qrImg");
        qrEl.src = qrUrl(link);
        qrEl.onerror = () => { document.getElementById("qrSec").style.display = "none"; };
        document.getElementById("qrSec").classList.add("qr-sec");
        document.getElementById("qrSec").style.display = "flex";
    } else {
        document.getElementById("qrSec").style.display = "none";
    }
    document.getElementById("resultActs").innerHTML = `<button class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Print / Save PDF</button><button class="btn btn-ghost btn-sm" onclick="copyTxt('${hash}')">📋 Copy Hash</button><button class="btn btn-ghost btn-sm" onclick="clearResult()">✕ Clear</button>`;
    document.getElementById("certCard").style.display = "block";
    document.getElementById("certCard").scrollIntoView({ behavior: "smooth" });
}

async function loadStats() {
    const el = document.getElementById("statsContent");
    el.innerHTML = `<div class="empty"><span class="ei spin">⟳</span><p>Loading statistics from The Graph...</p></div>`;
    try {
        const query = `{
            certificateIssueds(first: 1000) { id metaHash issuer institutionName studentName studentId programme issuedAt }
            registrationApproveds(first: 1000) { id wallet name timestamp }
        }`;
        const res = await fetch(GRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);
        if (!json.data) throw new Error("No data returned from The Graph");
        const issued = json.data.certificateIssueds || [];
        const approved = (json.data.registrationApproveds || [])
            .filter(a => !HIDDEN_WALLETS.includes(a.wallet.toLowerCase()));

        // Check revocation status for all certificates
        const rp = new ethers.JsonRpcProvider(RPC_URL);
        const cert = new ethers.Contract(CERT_ADDR, CERT_ABI, rp);
        const statusMap = {};
        await Promise.all(issued.map(async c => {
            try {
                const r = await cert.verifyCertificate(c.metaHash || c.id);
                statusMap[c.id] = r.isValid;
            } catch { statusMap[c.id] = true; }
        }));

        const totalIssued = issued.length;
        const totalRevoked = Object.values(statusMap).filter(v => !v).length;
        const totalValid = totalIssued - totalRevoked;
        const totalInstitutions = approved.length;

        // Per-institution breakdown with full details
        const instMap = {};
        for (const c of issued) {
            const key = c.issuer.toLowerCase();
            if (!instMap[key]) {
                const inst = approved.find(a => a.wallet.toLowerCase() === key);
                instMap[key] = {
                    name: c.institutionName,
                    wallet: c.issuer,
                    website: "",
                    registeredAt: inst ? inst.timestamp : 0,
                    total: 0, revoked: 0, certs: []
                };
            }
            instMap[key].total++;
            if (!statusMap[c.id]) instMap[key].revoked++;
            instMap[key].certs.push(c);
        }

        // Get website from contract for every approved institution (not just active issuers)
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, rp);
        const websiteMap = {};
        await Promise.all(approved.map(async a => {
            const key = a.wallet.toLowerCase();
            try { const d = await reg.getInstitution(a.wallet); websiteMap[key] = d[2]; }
            catch { websiteMap[key] = ""; }
        }));
        for (const key of Object.keys(instMap)) instMap[key].website = websiteMap[key] || "";

        // Store for CSV
        window._statsData = { issued, approved, statusMap, websiteMap };

        const statCards = `
            <div class="stat-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px">
                <div style="background:var(--g50);border:1px solid var(--g200);border-radius:10px;padding:18px;text-align:center">
                    <div style="font-size:2rem;font-weight:800;color:var(--g600);font-family:'Playfair Display',serif">${totalIssued}</div>
                    <div style="font-size:.75rem;font-weight:600;color:var(--n500);margin-top:4px;text-transform:uppercase;letter-spacing:.06em">Total Issued</div>
                </div>
                <div style="background:var(--g50);border:1px solid var(--g200);border-radius:10px;padding:18px;text-align:center">
                    <div style="font-size:2rem;font-weight:800;color:var(--g600);font-family:'Playfair Display',serif">${totalValid}</div>
                    <div style="font-size:.75rem;font-weight:600;color:var(--n500);margin-top:4px;text-transform:uppercase;letter-spacing:.06em">Currently Valid</div>
                </div>
                <div style="background:#FFF5F5;border:1px solid #FECACA;border-radius:10px;padding:18px;text-align:center">
                    <div style="font-size:2rem;font-weight:800;color:var(--revoked);font-family:'Playfair Display',serif">${totalRevoked}</div>
                    <div style="font-size:.75rem;font-weight:600;color:var(--n500);margin-top:4px;text-transform:uppercase;letter-spacing:.06em">Revoked</div>
                </div>
                <div style="background:var(--g50);border:1px solid var(--g200);border-radius:10px;padding:18px;text-align:center">
                    <div style="font-size:2rem;font-weight:800;color:var(--g600);font-family:'Playfair Display',serif">${totalInstitutions}</div>
                    <div style="font-size:.75rem;font-weight:600;color:var(--n500);margin-top:4px;text-transform:uppercase;letter-spacing:.06em">Institutions</div>
                </div>
            </div>`;

        const instRows = Object.entries(instMap)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([wallet, info], i) => `<tr>
                <td>${i + 1}</td>
                <td>
                    <strong>${info.name}</strong><br/>
                    ${info.website ? `<a href="${info.website}" target="_blank" rel="noopener" style="color:var(--g600);font-size:.75rem">${info.website}</a>` : ""}
                </td>
                <td style="font-family:monospace;font-size:.68rem;color:var(--n400)">${wallet.slice(0, 10)}...${wallet.slice(-6)}</td>
                <td>${info.registeredAt ? fmtDate(info.registeredAt) : "—"}</td>
                <td style="text-align:center"><span style="background:var(--g100);color:var(--g700);font-weight:700;padding:4px 10px;border-radius:20px;font-size:.82rem">${info.total}</span></td>
                <td style="text-align:center">${info.revoked > 0 ? `<span style="background:#FEE2E2;color:var(--revoked);font-weight:700;padding:4px 10px;border-radius:20px;font-size:.82rem">${info.revoked}</span>` : `<span style="color:var(--n400);font-size:.8rem">—</span>`}</td>
                <td style="text-align:center"><span style="background:var(--g50);color:var(--g700);font-weight:700;padding:4px 10px;border-radius:20px;font-size:.82rem">${info.total - info.revoked}</span></td>
            </tr>`).join("");

        const instTable = instRows ? `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <div style="font-size:.82rem;font-weight:700;color:var(--n700);text-transform:uppercase;letter-spacing:.06em">Per-Institution Breakdown</div>
                <button class="btn btn-ghost btn-sm" onclick="exportStatsCSV()">⬇ Export CSV</button>
            </div>
            <div style="overflow-x:auto">
                <table class="hist-tbl">
                    <thead><tr><th>#</th><th>Institution</th><th>Wallet</th><th>Registered</th><th style="text-align:center">Total</th><th style="text-align:center">Revoked</th><th style="text-align:center">Valid</th></tr></thead>
                    <tbody>${instRows}</tbody>
                </table>
            </div>` : `<div class="empty"><span class="ei">📜</span><p>No certificates issued yet.</p></div>`;

        el.innerHTML = statCards + instTable;

    } catch (e) {
        el.innerHTML = `<div class="empty"><span class="ei">⚠️</span><p>${e.message}</p></div>`;
    }
}

function exportStatsCSV() {
    const d = window._statsData;
    if (!d) return;
    downloadCSV(
        "certiverf_statistics.csv",
        ["Institution", "Website", "Wallet", "Registered", "Total Issued", "Revoked", "Valid"],
        d.approved.map(a => {
            const certs = d.issued.filter(c => c.issuer.toLowerCase() === a.wallet.toLowerCase());
            const revoked = certs.filter(c => !d.statusMap[c.id]).length;
            const website = (d.websiteMap && d.websiteMap[a.wallet.toLowerCase()]) || "";
            return [a.name, website, a.wallet, fmtDate(a.timestamp), certs.length, revoked, certs.length - revoked];
        })
    );
}
// Phase 4.2: authenticated, server-mediated IPFS upload.
// No Pinata token is ever sent to the browser.
async function uploadCertificateToPinata(file, expectedHash) {
    if (!signer) throw new Error("Connect your approved institution wallet first.");
    const challengeResponse = await fetch("/api/pinata/challenge", { cache: "no-store" });
    if (!challengeResponse.ok) throw new Error("Secure Pinata service unavailable. Start the Phase 4.2 server.");
    const challenge = await challengeResponse.json();
    const address = await signer.getAddress();
    const message = `Certiverf Pinata upload\nWallet: ${address}\nNonce: ${challenge.nonce}\nDocument SHA-256: ${expectedHash}`;
    const signature = await signer.signMessage(message);
    const body = new FormData();
    body.append("file", file, file.name);
    body.append("address", address);
    body.append("nonce", challenge.nonce);
    body.append("signature", signature);
    body.append("docHash", expectedHash);
    const response = await fetch("/api/pinata/upload", { method: "POST", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Pinata upload failed.");
    if (result.docHash?.toLowerCase() !== expectedHash.toLowerCase() || !result.cid)
        throw new Error("Upload result did not match the selected PDF.");
    return result;
}


// Phase 4.4.1 — authenticated read-only monitoring inside the existing NUC tab.
async function loadNucStorage() {
    const target = document.getElementById('nucStorageContent');
    if (!isOwner || !signer) { target.textContent = 'Connect the NUC contract-owner wallet first.'; return; }
    target.textContent = 'Authenticating and loading institutional inventory…';
    try {
        async function fetchOverview() {
            return fetch('/api/nuc/storage-overview', {headers:{Authorization:`Bearer ${nucSessionToken}`}, cache:'no-store'});
        }
        let response = nucSessionToken ? await fetchOverview() : {status:401};
        if (response.status === 401) {
            const challengeResponse = await fetch('/api/nuc/challenge', {cache:'no-store'});
            if (!challengeResponse.ok) throw new Error('NUC API unavailable. Run Certiverf through the local Node server.');
            const challenge = await challengeResponse.json();
            const signature = await signer.signMessage(challenge.message);
            const sessionResponse = await fetch('/api/nuc/session', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({nonce:challenge.nonce,signature})
            });
            if (!sessionResponse.ok) throw new Error('Admin wallet authentication rejected.');
            nucSessionToken = (await sessionResponse.json()).token;
            response = await fetchOverview();
        }
        if (!response.ok) throw new Error('Unable to load institutional storage statistics.');
        const data = await response.json();
        target.replaceChildren();
        const summary = document.createElement('p');
        summary.textContent = `Inventory records: ${data.totalInventoryRecords} · Uploads awaiting on-chain confirmation: ${data.uploadedUnconfirmed} · Reconciled: ${data.reconciledRecords} · Invalid inventory rows: ${data.malformedRows}`;
        target.appendChild(summary);
        const table = document.createElement('table'); table.className = 'hist-tbl';
        const head = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (const title of ['Institution code','Inventory records']) {
            const th=document.createElement('th'); th.textContent=title; headerRow.appendChild(th);
        }
        head.appendChild(headerRow); table.appendChild(head);
        const body=document.createElement('tbody');
        for (const institution of data.institutions) {
            const row=document.createElement('tr');
            for (const value of [institution.code,institution.records]) {
                const cell=document.createElement('td'); cell.textContent=String(value); row.appendChild(cell);
            }
            body.appendChild(row);
        }
        table.appendChild(body); target.appendChild(table);
        const note=document.createElement('p'); note.style.marginTop='12px';
        note.textContent=data.note; target.appendChild(note);
    } catch(error) { target.textContent=error.message || 'Storage overview failed.'; }
}
