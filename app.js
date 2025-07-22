// ======== DOM Elements ========
const form = document.getElementById("entryForm");
const list = document.getElementById("entryList");
const installBtn = document.getElementById("installBtn");
const searchInput = document.getElementById("searchInput");
const filterDateInput = document.getElementById("filterDate");
const filterCustomerSelect = document.getElementById("filterCustomer");

// ======== LocalStorage Data ========
let entries = JSON.parse(localStorage.getItem("entries")) || [];

// ======== Utility ========
function saveEntries() {
  localStorage.setItem("entries", JSON.stringify(entries));
}

function formatCurrency(amount) {
  return `৳${parseFloat(amount).toFixed(2)}`;
}

// ======== Rendering Entries ========
function renderEntries(filtered = entries) {
  const list = document.getElementById("entryList");
  list.innerHTML = "";
  
  let cashTotal = 0;
  let dueTotal = 0;
  
  filtered.forEach((entry, index) => {
    const amount = parseFloat(entry.amount);
    if (entry.type === "cash") cashTotal += amount;
    else if (entry.type === "due") dueTotal += amount;
    
    const li = document.createElement("li");
    li.className = `entry-item ${entry.type}`;
    
    li.innerHTML = `
      <div class="entry-details">
        <div class="entry-name">${entry.name}</div>
        <div class="entry-meta">
          ${entry.note ? `<span class="entry-note">📝 ${entry.note}</span>` : ""}
          <span>📅 ${entry.date}</span>
          <span class="entry-type">${entry.type === "cash" ? "নগদ" : "বাকি"}</span>
        </div>
      </div>

      <div class="entry-amount">৳${amount.toFixed(2)}</div>

      <div class="entry-actions">
        <button class="action-btn" title="Edit" onclick="editEntry(${index})">✏️</button>
        <button class="action-btn" title="Delete" onclick="deleteEntry(${index})">🗑️</button>
      </div>
    `;
    
    list.appendChild(li);
  });
  
  // Summary updates
  document.getElementById("cashTotal").innerText = `৳${cashTotal.toFixed(2)}`;
  document.getElementById("dueTotal").innerText = `৳${dueTotal.toFixed(2)}`;
  document.getElementById("grandTotal").innerText = `৳${(cashTotal + dueTotal).toFixed(2)}`;
  
  updateCustomerFilterOptions();
}
// ======== Entry Operations ========

// -----delet entry------
function deleteEntry(index) {
  const confirmDelete = confirm("❌ আপনি কি এই এন্ট্রিটি মুছে ফেলতে চান?");
  
  if (!confirmDelete) return;
  
  // ডেটা থেকে সরাও
  entries.splice(index, 1);
  
  // সেভ ও রেন্ডার
  saveEntries();
  renderEntries();
  
  // ইউজার ফিডব্যাক
  alert("🗑️ এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে!");
}
// -------edit entry-------


function editEntry(index) {
  const entry = entries[index];
  
  // ইনপুট ফিল্ডে ডেটা বসাও
  document.getElementById("name").value = entry.name;
  document.getElementById("amount").value = entry.amount;
  document.getElementById("note").value = entry.note || "";
  document.getElementById("type").value = entry.type;
  
  // পুরনো এন্ট্রিটি মুছে ফেলো (এডিটের সময় নতুন করে সাবমিট হবে)
  entries.splice(index, 1);
  saveEntries();
  renderEntries();
  
  // ফোকাস ইনপুটে
  document.getElementById("name").focus();
  
  // নোটিফিকেশন দেখাও
  alert("✏️ এন্ট্রি সম্পাদনার জন্য প্রস্তুত। পরিবর্তন করে আবার জমা দিন।");
}

// ======== Form Submit ========
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const { name, amount, note, type } = form;
  const date = new Date().toISOString().split("T")[0];
  
  if (!name.value || !amount.value || !type.value) return alert("সব ঘর পূরণ করুন!");
  
  entries.push({ name: name.value, amount: amount.value, note: note.value, date, type: type.value });
  saveEntries();
  renderEntries();
  form.reset();
});

// ======== Filters ========
function updateCustomerFilterOptions() {
  const customers = [...new Set(entries.map(e => e.name))].sort();
  filterCustomerSelect.innerHTML = `<option value="">-- কাস্টমার ফিল্টার --</option>`;
  customers.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    filterCustomerSelect.appendChild(opt);
  });
}
// ======== Search ========
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(query) || (e.note && e.note.toLowerCase().includes(query))
  );
  renderEntries(filtered);
});

// ======== PDF Export ========
async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text("hisebkhata852@gmail.com", 14, 15);
  
  const tableData = entries.map((entry, i) => [
    i + 1,
    entry.name,
    `${entry.amount}`,
    entry.type === "cash" ? "cash" : "due",
    entry.note || '',
    entry.date
  ]);
  
  doc.autoTable({
    head: [
      ["#", "Name", "Amount", "Type", "Note", "Date"]
    ],
    body: tableData,
    startY: 25,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 167, 69] },
  });
  
  doc.save("hishab_report.pdf");
}

// ======== Monthly PDF ========
async function generateMonthlyPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const monthlyTotals = {};
  
  entries.forEach(entry => {
    const [year, month] = entry.date.split("-");
    const key = `${year}-${month}`;
    if (!monthlyTotals[key]) monthlyTotals[key] = { cash: 0, due: 0 };
    const amount = parseFloat(entry.amount);
    if (entry.type === "cash") monthlyTotals[key].cash += amount;
    else monthlyTotals[key].due += amount;
  });
  
  const tableData = Object.keys(monthlyTotals).sort().map(month => {
    const cash = monthlyTotals[month].cash.toFixed(2);
    const due = monthlyTotals[month].due.toFixed(2);
    const total = (parseFloat(cash) + parseFloat(due)).toFixed(2);
    return [month, cash, due, total];
  });
  
  doc.setFontSize(16);
  doc.text("Monthly Hishab Report", 14, 15);
  doc.autoTable({
    head: [
      ["Month", "Cash", "Due", "Total"]
    ],
    body: tableData,
    startY: 25,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 167, 69] },
  });
  
  doc.save("monthly_hishab_report.pdf");
}

// ======== Reports ========
function generateMonthlyReport() {
  const monthlyTotals = {};
  
  entries.forEach(entry => {
    const [year, month] = entry.date.split("-");
    const key = `${year}-${month}`;
    if (!monthlyTotals[key]) monthlyTotals[key] = { cash: 0, due: 0 };
    const amount = parseFloat(entry.amount);
    if (entry.type === "cash") monthlyTotals[key].cash += amount;
    else monthlyTotals[key].due += amount;
  });
  
  let reportText = "📅 মাসিক রিপোর্ট:\n\n";
  Object.keys(monthlyTotals).sort().forEach(month => {
    const data = monthlyTotals[month];
    const total = data.cash + data.due;
    reportText += `🗓️ ${month}: নগদ = ${formatCurrency(data.cash)}, বাকি = ${formatCurrency(data.due)}, মোট = ${formatCurrency(total)}\n`;
  });
  
  alert(reportText);
}

function updateReports() {
  const today = new Date().toISOString().split("T")[0];
  const todayCash = entries
    .filter(e => e.date === today && e.type === "cash")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyTotal = entries
    .filter(e => new Date(e.date) >= oneWeekAgo)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  document.getElementById("todayCash").innerText = formatCurrency(todayCash);
  document.getElementById("weeklyTotal").innerText = formatCurrency(weeklyTotal);
}

// ======== Backup ========
function exportBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
  const a = document.createElement("a");
  a.href = dataStr;
  a.download = "hishab_backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importBackup() {
  document.getElementById("importFile").click();
}

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        entries = imported;
        saveEntries();
        renderEntries();
        alert("✅ ব্যাকআপ সফলভাবে ইমপোর্ট করা হয়েছে!");
      } else {
        alert("❌ অবৈধ ফাইল ফরম্যাট।");
      }
    } catch {
      alert("❌ ফাইল পড়তে সমস্যা হয়েছে।");
    }
  };
  reader.readAsText(file);
}

// ======== Dark Mode ========
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
  renderEntries();
  updateReports();
});

// ======== PWA Install ========
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "block";
  
  installBtn.addEventListener("click", () => {
    installBtn.style.display = "none";
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      console.log(choice.outcome === "accepted" ? "✅ ইনস্টলেশন শুরু হয়েছে" : "❌ ইউজার ইনস্টলেশন বাতিল করেছে");
      deferredPrompt = null;
    });
  });
});

// ======== Service Worker ========
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/hisebkhata009/service-worker.js")
    .then(reg => console.log("✅ Service Worker রেজিস্টার হয়েছে:", reg.scope))
    .catch(err => console.error("❌ Service Worker রেজিস্টার হয়নি:", err.message));
}



function renderModalEntries() {
  const list = document.getElementById("modalEntryList");
  list.innerHTML = "";
  
  if (entries.length === 0) {
    list.innerHTML = `<li style="text-align:center; color:gray;">কোনো এন্ট্রি নেই</li>`;
    return;
  }
  
  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = `entry-item ${entry.type}`;
    const amount = parseFloat(entry.amount).toFixed(2);
    
    li.innerHTML = `
      <div class="entry-details">
        <div class="entry-name">${entry.name}</div>
        <div class="entry-meta">
          ${entry.note ? `<span class="entry-note">📝 ${entry.note}</span>` : ""}
          <span>📅 ${entry.date}</span>
          <span class="entry-type">${entry.type === "cash" ? "নগদ" : "বাকি"}</span>
        </div>
      </div>
      <div class="entry-amount">৳${amount}</div>
      <div class="entry-actions">
        <button class="action-btn" onclick="editEntry(${index})">✏️</button>
        <button class="action-btn" onclick="deleteEntry(${index})">🗑️</button>
      </div>
    `;
    
    list.appendChild(li);
  });
}


function toggleModal() {
  const modal = document.getElementById("entryModal");
  const isOpen = !modal.classList.contains("hidden");
  
  modal.classList.toggle("hidden");
  
  // body scroll বন্ধ বা চালু
  document.body.style.overflow = isOpen ? "" : "hidden";
  
  // modal খোলা হলে renderModalEntries() চালাও
  if (!isOpen) {
    renderModalEntries();
  }
}
renderEntries();
updateReports();


// ==== search filter =====

function applyFilters() {
  const dateVal = filterDateInput.value.trim();
  const customerVal = filterCustomerSelect.value.trim();
  const searchQuery = searchInput.value.toLowerCase().trim();
  
  let filtered = entries;
  
  // 📅 তারিখ ফিল্টার (input type="date" অনুযায়ী exact match)
  if (dateVal) {
    filtered = filtered.filter(e => e.date === dateVal);
  }
  
  // 👤 কাস্টমার ফিল্টার
  if (customerVal) {
    filtered = filtered.filter(e => e.name === customerVal);
  }
  
  // 🔍 শুধু নাম ও নোটে সার্চ (তারিখ বাদ)
  if (searchQuery) {
    filtered = filtered.filter(e =>
      e.name.toLowerCase().includes(searchQuery) ||
      (e.note && e.note.toLowerCase().includes(searchQuery))
    );
  }
  
  renderEntries(filtered);
}

searchInput.addEventListener("input", applyFilters);
filterCustomerSelect.addEventListener("change", applyFilters);
filterDateInput.addEventListener("input", applyFilters);


// ==== Stock LocalStorage ====
let stockItems = JSON.parse(localStorage.getItem("stockItems")) || [];

function saveStockItems() {
  localStorage.setItem("stockItems", JSON.stringify(stockItems));
}

function renderStock(items = stockItems) {
  const stockList = document.getElementById("stockList");
  stockList.innerHTML = "";
  
  let totalBuy = 0;
  let totalSell = 0;
  
  items.forEach((item, index) => {
    const qty = parseFloat(item.qty);
    const buy = parseFloat(item.buy);
    const sell = parseFloat(item.sell);
    const itemTotalBuy = qty * buy;
    const itemTotalSell = qty * sell;
    const profit = itemTotalSell - itemTotalBuy;
    
    totalBuy += itemTotalBuy;
    totalSell += itemTotalSell;
    
    const card = document.createElement("div");
    card.className = "stock-card"; // ✅ এইটা যুক্ত করলাম
    
    card.innerHTML = `
      <h3>
      <span class="item-name">${item.name}</span>
       (<span class="item-qty">${item.qty}</span>)
      </h3>
      <p>💰 ক্রয়মূল্য: ৳${buy.toFixed(2)}</p>
      <p>💵 বিক্রয়মূল্য: ৳${sell.toFixed(2)}</p>
      <p>📦 মোট ক্রয়: ৳${itemTotalBuy.toFixed(2)}</p>
      <p>🛒 মোট বিক্রয়: ৳${itemTotalSell.toFixed(2)}</p>
      <p>📈 লাভ/ক্ষতি: <span class="${profit >= 0 ? 'profit' : 'loss'}">৳${profit.toFixed(2)}</span></p>
      <p>📅 তারিখ: ${item.date}</p>
      <div class="entry-actions">
        <button class="action-btn" onclick="editStock(${index})">✏️</button>
        <button class="action-btn" onclick="deleteStock(${index})">🗑️</button>
      </div>
    `;
    
    stockList.appendChild(card);
  });
  
  // Summary update
  const totalProfit = totalSell - totalBuy;
  document.getElementById("totalBuy").textContent = `৳${totalBuy.toFixed(2)}`;
  document.getElementById("totalSell").textContent = `৳${totalSell.toFixed(2)}`;
  document.getElementById("totalProfit").textContent = `৳${totalProfit.toFixed(2)}`;
}

document.getElementById("stockForm").addEventListener("submit", function(e) {
  e.preventDefault(); // ❗ পেজ রিফ্রেশ বন্ধ
  
  const name = document.getElementById("stockName").value.trim();
  const qty = document.getElementById("qty").value;
  const buy = document.getElementById("buy").value;
  const sell = document.getElementById("sell").value;
  const date = document.getElementById("date").value;
  
  if (!name || !qty || !buy || !sell || !date) {
    alert("⚠️ সব ঘর পূরণ করুন!");
    return;
  }
  
  stockItems.push({ name, qty, buy, sell, date });
  saveStockItems();
  renderStock();
  this.reset(); // ফর্ম রিসেট
});

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
  renderEntries();
  updateReports();
  renderStock(); // ✅ Add this line
});
//=== delet and edit ফাংশন 

function editStock(index) {
  const item = stockItems[index];
  
  document.getElementById("stockName").value = item.name;
  document.getElementById("qty").value = item.qty;
  document.getElementById("buy").value = item.buy;
  document.getElementById("sell").value = item.sell;
  document.getElementById("date").value = item.date;
  
  // পুরোনো আইটেম ডিলিট করে নতুনটা সাবমিটে যোগ হবে
  stockItems.splice(index, 1);
  saveStockItems();
  renderStock();
  
  alert("✏️ সম্পাদনার জন্য তথ্য ফর্মে বসানো হয়েছে। পরিবর্তন করে আবার 'যোগ করুন' চাপুন।");
}

function deleteStock(index) {
  if (!confirm("❌ আপনি কি নিশ্চিতভাবে এই পণ্যটি মুছে ফেলতে চান?")) return;
  
  stockItems.splice(index, 1);
  saveStockItems();
  renderStock();
  
  alert("🗑️ পণ্যটি মুছে ফেলা হয়েছে!");
}

//== stock pdf
function generateStockPDF() {
  if (!stockItems || stockItems.length === 0) {
    alert("❌ কোনো স্টক ডেটা নেই!");
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(14);
  doc.text("hisebkhata stockList", 14, 15);
  
  const tableData = stockItems.map((item, i) => {
    const qty = parseFloat(item.qty);
    const buy = parseFloat(item.buy);
    const sell = parseFloat(item.sell);
    const totalBuy = qty * buy;
    const totalSell = qty * sell;
    const profit = totalSell - totalBuy;
    
    return [
      i + 1,
      item.name,
      qty,
      `${buy.toFixed(2)}`,
      `${sell.toFixed(2)}`,
      item.date,
      `${totalBuy.toFixed(2)}`,
      `${totalSell.toFixed(2)}`,
      `${profit.toFixed(2)}`
    ];
  });
  
  doc.autoTable({
    head: [
      ["#", "product name", "quantity", "buy price", "sell price", "date", "totalBuy", "totalSell", "profit"]
    ],
    body: tableData,
    startY: 25,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [40, 167, 69] },
  });
  
  doc.save("stock_report.pdf");
}

// == navigation ==

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ✅ ক্যালকুলেটর ইনিশিয়ালাইজ
let calculatorInitialized = false;
let isResultShown = false;

function initCalculator() {
  if (calculatorInitialized) return;

  const screen = document.getElementById("calcScreen");
  const buttons = document.querySelectorAll(".calc-btn");

  buttons.forEach(btn => {
    btn.onclick = () => {
      const val = btn.getAttribute("data-value");

      if (val === "C") {
        screen.value = "";
        isResultShown = false;
      } else if (val === "⌫") {
        screen.value = screen.value.slice(0, -1);
      } else if (val === "=") {
        try {
          screen.value = eval(screen.value);
          isResultShown = true;
        } catch {
          screen.value = "Error";
          isResultShown = false;
        }
      } else {
        if (isResultShown && /[0-9.]/.test(val)) {
          screen.value = val;
        } else {
          screen.value += val;
        }
        isResultShown = false;
      }
    };
  });

  calculatorInitialized = true;
}

// ✅ স্ক্রল করে সেকশন দেখাও
function scrollToSection(sectionId) {
  const allSections = document.querySelectorAll("main > section, main > form, #calculatorPage");
  allSections.forEach(sec => sec.style.display = "none");

  const target = document.getElementById(sectionId);
  if (target) {
    target.style.display = sectionId === "homePage" ? "flex" : "block";

    // হোমে গ্যাপ ও আপডেট
    if (sectionId === "homePage") {
      target.style.gap = "15px";
      updateHomeSummary();
    }

    // ক্যালকুলেটর ইনিশিয়ালাইজ
    if (sectionId === "calculatorPage") {
      initCalculator();
    }

    target.scrollIntoView({ behavior: "smooth" });

    // ✅ Active Tab হাইলাইট
    const navButtons = document.querySelectorAll(".mobile-nav button");
    navButtons.forEach(btn => btn.classList.remove("active"));
    const activeBtn = [...navButtons].find(btn => btn.getAttribute("onclick")?.includes(sectionId));
    if (activeBtn) activeBtn.classList.add("active");
  }
}

// ✅ হোম সামারি আপডেট
function updateHomeSummary() {
  const entries = JSON.parse(localStorage.getItem("entries")) || [];

  let totalCash = 0;
  let totalDue = 0;

  entries.forEach(entry => {
    const amount = parseFloat(entry.amount) || 0;
    if (entry.type === "cash") {
      totalCash += amount;
    } else if (entry.type === "due") {
      totalDue += amount;
    }
  });

  const grandTotal = totalCash + totalDue;

  document.getElementById("cashTotal").textContent = `৳${totalCash.toFixed(2)}`;
  document.getElementById("dueTotal").textContent = `৳${totalDue.toFixed(2)}`;
  document.getElementById("grandTotal").textContent = `৳${grandTotal.toFixed(2)}`;
}


renderEntries();
updateReports();
// updateStockSummary();