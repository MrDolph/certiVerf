const GRAPH_URL = "https://api.studio.thegraph.com/query/1756477/certiverf/v0.0.1";
const REGISTRY_ADDR = "0x5416e493590141D710F367afA994F97A58116834";
const CERT_ADDR = "0x30d5AEa8d649856a7f986d8D41DA314145Ecd6f5";
const RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/3RE7F8bPJ2MofC94L2tdP";
const AMOY_ID = 80002;
const PAGE_URL = window.location.href.split("?")[0];

const REG_ABI = [
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },

    {
        "inputs":
            [
                { "internalType": "string", "name": "_name", "type": "string" },
                { "internalType": "string", "name": "_acronym", "type": "string" },
                { "internalType": "string", "name": "_website", "type": "string" }
            ],
        "name": "requestRegistration",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }],
        "name": "approveRegistration",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "rejectRegistration", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "isRegistered", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "getInstitution", "outputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "acronym", "type": "string" }, { "internalType": "string", "name": "website", "type": "string" }, { "internalType": "uint256", "name": "registrationTime", "type": "uint256" }], "stateMutability": "view", "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "name": "getPendingInstitution", "outputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "acronym", "type": "string" }, { "internalType": "string", "name": "website", "type": "string" }], "stateMutability": "view", "type": "function"
    },
    {
        "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "wallet", "type": "address" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }, { "indexed": false, "internalType": "string", "name": "acronym", "type": "string" }], "name": "RegistrationRequested", "type": "event"
    },
    {
        "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "wallet", "type": "address" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "name": "RegistrationApproved", "type": "event"
    },
    {
        "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "wallet", "type": "address" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }], "name": "RegistrationRejected", "type": "event"
    }
];

const CERT_ABI = [
    {
        "inputs": [{ "components": [{ "internalType": "string", "name": "studentName", "type": "string" }, { "internalType": "string", "name": "studentId", "type": "string" }, { "internalType": "string", "name": "programme", "type": "string" }, { "internalType": "string", "name": "degreeClass", "type": "string" }, { "internalType": "uint256", "name": "completionYear", "type": "uint256" }, { "internalType": "string", "name": "email", "type": "string" }, { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }, { "internalType": "string", "name": "ipfsCid", "type": "string" }], "internalType": "struct CertificateRegistry.CertificateInput", "name": "_input", "type": "tuple" }], "name": "issueCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "_metaHash", "type": "bytes32" }, { "internalType": "string", "name": "_reason", "type": "string" }], "name": "revokeCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "_metaHash", "type": "bytes32" }],
        "name": "verifyCertificate",
        "outputs": [
            {
                "components": 
                    [
                        { "internalType": "bytes32", "name": "metaHash", "type": "bytes32" },
                        { "internalType": "bytes32", "name": "docHash", "type": "bytes32" },
                        { "internalType": "string", "name": "ipfsCid", "type": "string" },
                        { "internalType": "string", "name": "institutionName", "type": "string" },
                        { "internalType": "string", "name": "institutionAcronym", "type": "string" },
                        { "internalType": "string", "name": "programme", "type": "string" },
                        { "internalType": "string", "name": "degreeClass", "type": "string" },
                        { "internalType": "string", "name": "studentName", "type": "string" },
                        { "internalType": "string", "name": "studentId", "type": "string" },
                        { "internalType": "string", "name": "email", "type": "string" },
                        { "internalType": "uint256", "name": "completionYear", "type": "uint256" },
                        { "internalType": "uint256", "name": "issuedAt", "type": "uint256" }, 
                        { "internalType": "address", "name": "issuer", "type": "address" }, 
                        { "internalType": "bool", "name": "isValid", "type": "bool" }, 
                        { "internalType": "string", "name": "revokeReason", "type": "string" },
                        { "internalType": "uint256", "name": "revokedAt", "type": "uint256" }
                    ], 
                "internalType": "struct CertificateRegistry.Certificate", 
                "name": "", 
                "type": "tuple"
            }
        ],
        "stateMutability": "view", 
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "bytes32", "name": "metaHash", "type": "bytes32" },
            { "indexed": true, "internalType": "address", "name": "issuer", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "institutionName", "type": "string" }, { "indexed": false, "internalType": "string", "name": "studentName", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "studentId", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "programme", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "issuedAt", "type": "uint256" }
        ],
        "name": "CertificateIssued", "type": "event"
    }
];

let provider, signer, userAddress, isOwner = false, isReg = false, instData = null, computedDocHash = null;

const short = a => a ? a.slice(0, 6) + "..." + a.slice(-4) : "";
const fmtDate = u => {
    if (!u || Number(u) === 0) return "—";
    return new Date(Number(u) * 1000).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })
};
const qrUrl = d => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(d)}&margin=10`;
function copyTxt(t) {
    navigator.clipboard.writeText(t).then(() => {
        const b = event.target; const o = b.textContent; b.textContent = "Copied!";
        setTimeout(() => { b.textContent = o }, 1500)
    })
}
function setSt(id, type, msg) {
    const el = document.getElementById(id);
    const ico = type === "pending" ? '<span class="spin">⟳</span>' : type === "success" ? "✓" : "✗"; el.className = "tx-st show tx-" + type; el.innerHTML = ico + " " + msg
}
function clrSt(id) {
    const el = document.getElementById(id);
    el.className = "tx-st"; el.innerHTML = ""
}

function switchTab(n) {
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("pane-" + n).classList.add("active");
    document.getElementById("tab-" + n).classList.add("active");
    sessionStorage.setItem("activeTab", n);
}

// Auto-detect MetaMask account or network changes
if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length === 0) {
            // Wallet disconnected
            document.getElementById("walletPill").classList.remove("show");
            document.getElementById("connectBtn").textContent = "Connect Wallet";
            document.getElementById("connectBtn").disabled = false;
        } else {
            // Account switched — reconnect automatically
            document.getElementById("connectBtn").textContent = "Reconnecting...";
            await connectWallet();
        }
    });
    window.ethereum.on("chainChanged", () => { window.location.reload(); });
}

window.addEventListener("load", () => {
    const p = new URLSearchParams(window.location.search);
    const h = p.get("hash");
    if (h) {
        document.getElementById("verifyHash").value = h;
        runVerify()
    }
});

// Auto-reconnect on page refresh if MetaMask was previously connected
window.addEventListener("load", async () => {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
            // Wallet already connected — silently reconnect without prompting
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
    // Restore active tab instantly before anything renders
    const savedTab = sessionStorage.getItem("activeTab");
    if (savedTab) switchTab(savedTab);
    document.body.classList.remove("tab-loading");
});

async function connectWallet() {
    if (!window.ethereum) { alert("MetaMask is not installed. Install from metamask.io"); return }
    const btn = document.getElementById("connectBtn"); btn.textContent = "Connecting..."; btn.disabled = true;
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        // Always prompt user to select which account to connect
        await provider.send("wallet_requestPermissions", [{ "eth_accounts": {} }]);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner(); userAddress = await signer.getAddress();
        const net = await provider.getNetwork();
        const nb = document.getElementById("netBadge"); nb.classList.add("show");
        if (Number(net.chainId) === AMOY_ID) { nb.className = "net-badge show ok"; nb.textContent = "Polygon Amoy ✓" }
        else { nb.className = "net-badge show wrong"; nb.textContent = "Wrong network — switch to Polygon Amoy" }
        document.getElementById("walletAddr").textContent = short(userAddress);
        document.getElementById("disconnectBtn").style.display = "block";
        document.getElementById("walletPill").classList.add("show");
        btn.textContent = "Connected";
        await detectRole();
    } catch (e) { btn.textContent = "Connect Wallet"; btn.disabled = false; console.error(e) }
}

function disconnectWallet() {
    // Reset all state
    provider = null; signer = null; userAddress = null; isOwner = false; isReg = false; instData = null;
    // Reset UI
    document.getElementById("walletPill").classList.remove("show");
    document.getElementById("connectBtn").textContent = "Connect Wallet";
    document.getElementById("connectBtn").disabled = false;
    document.getElementById("connectBtn").style.display = "block";
    document.getElementById("disconnectBtn").style.display = "none";
    document.getElementById("netBadge").classList.remove("show");
    document.getElementById("roleBanner") && (document.getElementById("roleBanner").style && (document.getElementById("roleBanner").style.display = "none"));
    // Reset all portals to gate state
    document.getElementById("instGate").style.display = "block";
    document.getElementById("instContent").style.display = "none";
    document.getElementById("adminGate").style.display = "block";
    document.getElementById("adminContent").style.display = "none";
    document.getElementById("adminDenied").style.display = "none";
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
            // Also initialise institution tab so switching tabs works
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
        }
        else if (isReg) { rEl.textContent = instData[1]; showInstitution() }
        else { let pend = false; try { await reg.getPendingInstitution(userAddress); pend = true } catch { } rEl.textContent = pend ? "Pending" : "Unregistered"; showInstitution(pend) }
    } catch (e) { console.error("Role detection:", e) }
}

function showAdmin() {
    document.getElementById("adminGate").style.display = "none";
    document.getElementById("adminDenied").style.display = "none";
    document.getElementById("adminContent").style.display = "block";
    document.getElementById("regInstCard").style.display = "block";
    loadPending();
    loadRegistered();
}

async function loadRegistered() {
    const el = document.getElementById("registeredList");
    el.innerHTML = `<div class="empty"><span class="ei spin">⟳</span><p>Loading from The Graph...</p></div>`;
    try {
        const query = `{
      registrationApproveds(orderBy: timestamp, orderDirection: asc) {
        wallet
        name
        timestamp
      }
    }`;
        const res = await fetch(GRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        const events = data.data.registrationApproveds;
        if (!events || !events.length) {
            el.innerHTML = `<div class="empty"><span class="ei">🏛️</span><p>No registered institutions yet.</p></div>`;
            return;
        }
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, provider);
        let rows = "";
        for (const ev of events) {
            try {
                const d = await reg.getInstitution(ev.wallet);
                rows += `<tr>
          <td><strong>${d[0]}</strong></td>
          <td>${d[1]}</td>
          <td><a href="${d[2]}" target="_blank" rel="noopener"
            style="color:var(--g600);font-size:.82rem">${d[2]}</a></td>
          <td style="font-family:monospace;font-size:.68rem;color:var(--n400)">
            ${ev.wallet.slice(0, 10)}...${ev.wallet.slice(-6)}</td>
          <td><span class="badge b-green" style="font-size:.65rem">✓ Active</span></td>
        </tr>`;
            } catch { continue; }
        }
        if (!rows) {
            el.innerHTML = `<div class="empty"><span class="ei">🏛️</span><p>No active institutions found.</p></div>`;
            return;
        }
        el.innerHTML = `<table class="hist-tbl">
      <thead><tr><th>Institution</th><th>Acronym</th><th>Website</th><th>Wallet</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    } catch (e) {
        el.innerHTML = `<div class="empty"><span class="ei">⚠️</span><p>${e.message}</p></div>`;
    }
}

function showInstitution(isPend = false) {
    document.getElementById("instGate").style.display = "none";
    document.getElementById("instContent").style.display = "block";
    document.getElementById("adminGate").style.display = "none";
    document.getElementById("adminDenied").style.display = "block";
    const t = document.getElementById("instTitle"), s = document.getElementById("instSub"), badge = document.getElementById("instStatBadge"), desc = document.getElementById("instStatDesc"), body = document.getElementById("instStatBody"), steps = document.getElementById("instSteps"), regC = document.getElementById("regCard"), issC = document.getElementById("issueCard"), revC = document.getElementById("revokeCard"), histC = document.getElementById("histCard");
    if (isReg && instData) {
        t.textContent = instData[0];
        s.textContent = "Registered institution — issue and manage certificates";
        badge.className = "badge b-green"; badge.textContent = "✓ Approved by NUC"; desc.textContent = "Your institution is approved and active";
        body.innerHTML = `<p style="font-size:.875rem;
        color:var(--n700)"><strong>${instData[0]}</strong> (${instData[1]}) · ${instData[2]}<br/><span style="color:var(--n500)">Registered on ${fmtDate(instData[3])}</span></p>`;
        steps.innerHTML = `<div class="step"><span class="step-num">1</span><span class="step-text">Fill in graduate details</span></div><span class="step-arrow">→</span><div class="step"><span class="step-num">2</span><span class="step-text">Upload PDF to compute SHA-256 fingerprint</span></div><span class="step-arrow">→</span><div class="step"><span class="step-num">3</span><span class="step-text">Issue on blockchain — receive hash + QR code</span></div>`;
        regC.style.display = "none";
        issC.style.display = "block";
        revC.style.display = "block";
        histC.style.display = "block";
    } else if (isPend) {
        t.textContent = "Registration Pending";
        s.textContent = "Your request awaits NUC review";
        badge.className = "badge b-amber";
        badge.textContent = "⏳ Pending";
        desc.textContent = "Awaiting NUC approval";
        body.innerHTML = `<p style="font-size:.875rem;
        color:var(--n500)">Your registration has been submitted. You will be able to issue certificates once the NUC admin approves your request.</p>`;
        steps.style.display = "none";
        regC.style.display = "none";
        issC.style.display = "none";
        revC.style.display = "none";
        histC.style.display = "none";
    } else {
        t.textContent = "Register Your Institution";
        s.textContent = "Submit a registration request to the NUC. Once approved, you can issue blockchain certificates.";
        badge.className = "badge b-gray";
        badge.textContent = "Not Registered";
        desc.textContent = "Submit a registration request below";
        body.innerHTML = `<p style="font-size:.875rem;
        color:var(--n500)">Complete the form below and submit your registration to NUC for approval.</p>`;
        steps.innerHTML = `<div class="step"><span class="step-num">1</span><span class="step-text">Fill in your institution details</span></div><span class="step-arrow">→</span><div class="step"><span class="step-num">2</span><span class="step-text">Submit request to NUC Admin</span></div><span class="step-arrow">→</span><div class="step"><span class="step-num">3</span><span class="step-text">Once approved — issue certificates</span></div>`;
        regC.style.display = "block";
        issC.style.display = "none";
        revC.style.display = "none";
        histC.style.display = "none";
    }
}

async function doRegister() {
    const name = document.getElementById("regName").value.trim(), acr = document.getElementById("regAcronym").value.trim(), web = document.getElementById("regWebsite").value.trim();
    if (!name || !acr) {
        setSt("regSt", "error", "Institution name and acronym are required.");
        return
    }
    const btn = document.getElementById("regBtn");
    btn.disabled = true;
    setSt("regSt", "pending", "Submitting registration to blockchain...");
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, signer);
        const tx = await reg.requestRegistration(name, acr, web, { maxPriorityFeePerGas: ethers.parseUnits('65', 'gwei'), maxFeePerGas: ethers.parseUnits('70', 'gwei'), gasLimit: 300000 });
        setSt("regSt", "pending", "Transaction submitted — awaiting confirmation...");
        await tx.wait();
        // Store in localStorage so NUC Admin can see it automatically
        const lsPending = JSON.parse(localStorage.getItem('cv_pending') || '[]');
        lsPending.push({ wallet: userAddress, name: name, acronym: acr, website: web, ts: Date.now() });
        localStorage.setItem('cv_pending', JSON.stringify(lsPending));
        setSt("regSt", "success", "Registration submitted! NUC Admin will see your request automatically. Your wallet: " + userAddress);
        await detectRole()
    }
    catch (e) { setSt("regSt", "error", e.reason || e.message); btn.disabled = false }
}

async function onPdf(input) {
    const file = input.files[0];
    if (!file) return;
    computedDocHash = null;
    document.getElementById("docHashDiv").style.display = "none";
    try {
        const buf = await file.arrayBuffer();
        const hb = await crypto.subtle.digest("SHA-256", buf);
        const arr = Array.from(new Uint8Array(hb));
        computedDocHash = "0x" + arr.map(b => b.toString(16).padStart(2, "0")).join(""); document.getElementById("docHashVal").textContent = computedDocHash;
        document.getElementById("docHashDiv").style.display = "block"
    }
    catch (e) { console.error(e) }
}

async function doIssue() {
    const name = document.getElementById("stuName").value.trim(), id = document.getElementById("stuId").value.trim(), prog = document.getElementById("stuProg").value.trim(), cls = document.getElementById("stuClass").value, yr = parseInt(document.getElementById("stuYear").value), em = document.getElementById("stuEmail").value.trim(), ipfs = document.getElementById("stuIpfs").value.trim();
    if (!name || !id || !prog || !cls || !yr) {
        setSt("issueSt", "error", "Please fill in all required fields.");
        return
    }
    const dHash = computedDocHash || ethers.zeroPadValue("0x01", 32);
    const btn = document.getElementById("issueBtn");
    btn.disabled = true; document.getElementById("issueResult").style.display = "none";
    setSt("issueSt", "pending", "Issuing certificate on Polygon Amoy blockchain...");
    try {
        const cert = new ethers.Contract(CERT_ADDR, CERT_ABI, signer); const tx = await cert.issueCertificate([name, id, prog, cls, BigInt(yr), em, dHash, ipfs || ""], { maxPriorityFeePerGas: ethers.parseUnits('65', 'gwei'), maxFeePerGas: ethers.parseUnits('70', 'gwei'), gasLimit: 500000 }); setSt("issueSt", "pending", "Transaction submitted — awaiting confirmation..."); const receipt = await tx.wait();
        let mHash = ""; for (const log of receipt.logs) { try { const p = cert.interface.parseLog(log); if (p && p.name === "CertificateIssued") { mHash = p.args.metaHash; break } } catch { } }
        setSt("issueSt", "success", "Certificate issued and permanently stored on the blockchain.");
        document.getElementById("issuedHash").textContent = mHash;
        if (mHash) { const link = PAGE_URL + "?hash=" + mHash; document.getElementById("issueQRImg").src = qrUrl(link); document.getElementById("issueQR").style.display = "flex" }
        document.getElementById("issueResult").style.display = "block"; btn.disabled = false;
    } catch (e) { setSt("issueSt", "error", e.reason || e.message); btn.disabled = false }
}

async function doRevoke() {
    const h = document.getElementById("revokeHash").value.trim(), r = document.getElementById("revokeReason").value.trim();
    if (!h || !r) {
        setSt("revokeSt", "error", "Both fields are required.");
        return
    }
    if (!confirm("Revocation is permanent. Proceed?")) return;
    const btn = document.getElementById("revokeBtn");
    btn.disabled = true;
    setSt("revokeSt", "pending", "Submitting revocation...");
    try {
        const cert = new ethers.Contract(CERT_ADDR, CERT_ABI, signer);
        const tx = await cert.revokeCertificate(h, r, { maxPriorityFeePerGas: ethers.parseUnits('65', 'gwei'), maxFeePerGas: ethers.parseUnits('70', 'gwei'), gasLimit: 300000 });
        setSt("revokeSt", "pending", "Awaiting confirmation...");
        await tx.wait();
        setSt("revokeSt", "success", "Certificate revoked. Reason and timestamp stored permanently on-chain.");
        btn.disabled = false
    }
    catch (e) { setSt("revokeSt", "error", e.reason || e.message); btn.disabled = false }
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
            ) 
            {
                metaHash
                studentName
                studentId
                programme
                issuedAt
            }
        }`;
        const res = await fetch(GRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        const events = data.data.certificateIssueds;
        if (!events || !events.length) {
            el.innerHTML = `<div class="empty"><span class="ei">📜</span><p>No certificates issued yet.</p></div>`;
            return;
        }
        const rows = events.map((c, i) => `<tr>
      <td>${i + 1}</td>
        <td><strong>${c.studentName}</strong><br/>
        <span style="color:var(--n500);font-size:.75rem">${c.studentId}</span>
      </td>
      <td>${c.programme}</td>
      <td>${fmtDate(c.issuedAt)}</td>
      <td>
        <span class="mono-sm">${c.metaHash.slice(0, 14)}...</span><br/>
        <button class="copy-btn" style="margin-top:4px" onclick="navigator.clipboard.writeText('${c.metaHash}')">Copy hash</button>
      </td>
        </tr>`).join("");
        el.innerHTML = `<table class="hist-tbl">
            <thead>
                <tr>
                <th>#</th>
                <th>Graduate</th>
                <th>Programme</th>
                <th>Date Issued</th>
                <th>Certificate Hash</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    } catch (e) {
        el.innerHTML = `<div class="empty"><span class="ei">⚠️</span><p>${e.message}</p></div>`;
    }
}

async function loadPending() {
    const list = document.getElementById("pendingList");
    list.innerHTML = `<div class="empty"><span class="ei spin">⟳</span><p>Loading pending applications...</p></div>`;
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, provider);
        // Read from localStorage (populated when institutions register)
        const lsPending = JSON.parse(localStorage.getItem('cv_pending') || '[]');
        // Also try last 10 blocks for very recent registrations
        let recentAddrs = [];
        try {
            const curBlk = await provider.getBlockNumber();
            const reqEv = await reg.queryFilter(reg.filters.RegistrationRequested(), Math.max(0, curBlk - 10), "latest");
            recentAddrs = reqEv.map(e => ({ wallet: e.args.wallet, name: e.args.name, acronym: e.args.acronym, website: "" }));
        } catch { }

        // Merge both sources, deduplicate by wallet
        const allMap = {};
        for (const r of [...lsPending, ...recentAddrs]) allMap[r.wallet.toLowerCase()] = { wallet: r.wallet, name: r.name, acronym: r.acronym, website: r.website || "" };
        const allPending = Object.values(allMap);
        if (allPending.length === 0) {
            list.innerHTML = `<div class="empty"><span class="ei">ℹ️</span>
        <p style="color:var(--n700);font-size:.85rem;line-height:1.6">No pending applications found.<br/>
        Use the <strong>Look Up an Institution</strong> tool below if you have a wallet address.</p></div>`;
            return;
        }

        // For each, check on-chain status
        list.innerHTML = "";
        let shownAny = false;
        const approvedWallets = [];
        for (const item of allPending) {
            const isReg = await reg.isRegistered(item.wallet);
            if (isReg) { approvedWallets.push(item.wallet.toLowerCase()); continue; }
            let stillPending = false; let web = item.website || "";
            try { const pd = await reg.getPendingInstitution(item.wallet); stillPending = true; web = web || pd[2]; } catch { }
            if (!stillPending) { approvedWallets.push(item.wallet.toLowerCase()); continue; }
            shownAny = true;
            const el = document.createElement("div"); el.className = "pend-row";
            el.innerHTML = `<div class="pend-info"><h3>${item.name} <span style="font-weight:400;color:var(--n500)">(${item.acronym})</span></h3>${web ? `<p>${web}</p>` : ""}<div class="pend-addr">${item.wallet}</div></div><div class="pend-acts"><button class="btn btn-green btn-sm" onclick="doApprove('${item.wallet}','${item.name}')">✓ Approve</button><button class="btn btn-danger btn-sm" onclick="doReject('${item.wallet}','${item.name}')">✗ Reject</button></div>`;
            list.appendChild(el);
        }

        // Clean up approved ones from localStorage
        if (approvedWallets.length > 0) {
            const cleaned = lsPending.filter(r => !approvedWallets.includes(r.wallet.toLowerCase()));
            localStorage.setItem('cv_pending', JSON.stringify(cleaned));
        }
        if (!shownAny) {
            list.innerHTML = `<div class="empty"><span class="ei">✅</span><p>No pending applications at this time.</p></div>`;
        }
    } catch (e) {
        list.innerHTML = `<div class="empty"><span class="ei">ℹ️</span>
      <p style="color:var(--n700);font-size:.85rem">Use the <strong>Look Up an Institution</strong> tool below.</p></div>`;
    }
}

async function doApprove(addr, name) {
    setSt("adminSt", "pending", `Approving ${name}...`);
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, signer);
        const tx = await reg.approveRegistration(addr, { maxPriorityFeePerGas: ethers.parseUnits('65', 'gwei'), maxFeePerGas: ethers.parseUnits('70', 'gwei'), gasLimit: 300000 });
        setSt("adminSt", "pending", "Awaiting confirmation...");
        await tx.wait();
        const lsApp = JSON.parse(localStorage.getItem("cv_approved") || "[]");
        if (!lsApp.find(i => i.wallet.toLowerCase() === addr.toLowerCase()))
            lsApp.push({ wallet: addr, name: name, approvedAt: Date.now() });
        localStorage.setItem("cv_approved", JSON.stringify(lsApp));
        setSt("adminSt", "success", `${name} approved — can now issue certificates.`);
        await loadPending();
        loadRegistered();
    }
    catch (e) {
        setSt("adminSt", "error", e.reason || e.message)

    }
}

async function doReject(addr, name) {
    if (!confirm(`Reject ${name}?`)) return;
    setSt("adminSt", "pending", `Rejecting ${name}...`);
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, signer);
        const tx = await reg.rejectRegistration(addr, { maxPriorityFeePerGas: ethers.parseUnits('65', 'gwei'), maxFeePerGas: ethers.parseUnits('70', 'gwei'), gasLimit: 300000 });
        await tx.wait();
        setSt("adminSt", "success", `${name} rejected.`);
        await loadPending()
    } catch (e) {
        setSt("adminSt", "error", e.reason || e.message)
    }
}

async function doLookup() {
    const addr = document.getElementById("lookupAddr").value.trim(), out = document.getElementById("lookupResult"); if (!addr) return;
    out.innerHTML = `<p style="font-size:.82rem;color:var(--n400)">Looking up...</p>`;
    try {
        const reg = new ethers.Contract(REGISTRY_ADDR, REG_ABI, provider);
        const ok = await reg.isRegistered(addr);
        if (ok) {
            const d = await reg.getInstitution(addr);
            // Auto-save to approved list so Registered Institutions shows it
            const lsApp = JSON.parse(localStorage.getItem("cv_approved") || "[]");
            if (!lsApp.find(i => i.wallet.toLowerCase() === addr.toLowerCase())) {
                lsApp.push({ wallet: addr, name: d[0], approvedAt: Date.now() });
                localStorage.setItem("cv_approved", JSON.stringify(lsApp));
            }
            loadRegistered();
            out.innerHTML = `<div style="background:var(--g50);border:1px solid var(--g200);border-radius:8px;padding:16px"><span class="badge b-green">✓ Registered</span><p style="margin-top:10px;font-weight:700">${d[0]} (${d[1]})</p><p style="color:var(--n500);font-size:.82rem">${d[2]}</p><p style="color:var(--n500);font-size:.78rem;margin-top:4px">Registered ${fmtDate(d[3])}</p></div>`
        }
        else {
            let pend = false;
            let pd = { name: "", acronym: "", website: "" };
            try {
                const r = await reg.getPendingInstitution(addr);
                pend = true; pd = { name: r[0], acronym: r[1], website: r[2] }
            }
            catch { }
            if (pend) {
                out.innerHTML = `<div style="background:var(--gold-bg);border:1px solid #EDD9A3;border-radius:8px;
            padding:18px">
          <span class="badge b-amber">⏳ Pending Approval</span>
          <p style="margin-top:12px;
          font-weight:700;
          font-size:.95rem">
          ${pd.name} (${pd.acronym})
          </p>
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
    } catch (e) { out.innerHTML = `<p style="font-size:.82rem;color:var(--revoked)">Error: ${e.message}</p>` }
}

async function runVerify() {
    const hash = document.getElementById("verifyHash").value.trim();
    document.getElementById("certCard").style.display = "none";
    if (!hash.startsWith("0x") || hash.length !== 66) { setSt("verifySt", "error", "Enter a valid certificate hash — starts with 0x, exactly 66 characters."); return }
    const btn = document.getElementById("verifyBtn"); btn.disabled = true; setSt("verifySt", "pending", "Querying Polygon Amoy blockchain...");
    try {
        const rp = new ethers.JsonRpcProvider(RPC_URL);
        const cert = new ethers.Contract(CERT_ADDR, CERT_ABI, rp);
        const c = await cert.verifyCertificate(hash); clrSt("verifySt");
        showResult(c, hash);
    } catch (e) {
        let msg = e.message || "Unknown error";
        if (msg.includes("Certificate not found")) msg = "No certificate found for this hash. Please check and try again.";
        setSt("verifySt", "error", msg)
    }
    finally { btn.disabled = false }
}

function clearResult() {
    document.getElementById("verifyHash").value = "";
    document.getElementById("certCard").style.display = "none";
    clrSt("verifySt")
}

function showResult(c, hash) {
    const valid = c.isValid;
    document.getElementById("certHero").innerHTML = `<span class="shield-icon ${valid ? "shield-valid" : "shield-revoked"}">${valid ? "🛡️" : "🚫"}</span><div class="result-title ${valid ? "valid" : "revoked"}">${valid ? "CERTIFICATE VALID" : "CERTIFICATE REVOKED"}</div><div class="result-sub">${valid ? "This certificate has been verified as authentic on the Polygon Amoy blockchain." : "This certificate has been revoked by the issuing institution."}</div>`;
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
        document.getElementById("qrImg").src = qrUrl(link);
        document.getElementById("qrSec").style.display = "flex"
    }
    else { document.getElementById("qrSec").style.display = "none" }
    document.getElementById("resultActs").innerHTML = `<button class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Print / Save PDF</button><button class="btn btn-ghost btn-sm" onclick="copyTxt('${hash}')">📋 Copy Hash</button><button class="btn btn-ghost btn-sm" onclick="clearResult()">✕ Clear</button>`;
    document.getElementById("certCard").style.display = "block";
    document.getElementById("certCard").scrollIntoView({ behavior: "smooth" });
}
