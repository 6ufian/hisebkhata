// ======== DOM Elements ========
const elements = {
  form: document.getElementById("entryForm"),
  list: document.getElementById("entryList"),
  installBtn: document.getElementById("installBtn"),
  searchInput: document.getElementById("searchInput"),
  filterDateInput: document.getElementById("filterDate"),
  filterCustomerSelect: document.getElementById("filterCustomer"),
  cashTotal: document.getElementById("cashTotal"),
  dueTotal: document.getElementById("dueTotal"),
  grandTotal: document.getElementById("grandTotal"),
  todayCash: document.getElementById("todayCash"),
  weeklyTotal: document.getElementById("weeklyTotal"),
  modalEntryList: document.getElementById("modalEntryList"),
  entryModal: document.getElementById("entryModal"),
  stockList: document.getElementById("stockList"),
  stockForm: document.getElementById("stockForm"),
  totalBuy: document.getElementById("totalBuy"),
  totalSell: document.getElementById("totalSell"),
  totalProfit: document.getElementById("totalProfit"),
  calcScreen: document.getElementById("calcScreen")
};

// ======== Data Management ========
const dataManager = {
  getEntries: () => JSON.parse(localStorage.getItem("entries")) || [],
  setEntries: (entries) => localStorage.setItem("entries", JSON.stringify(entries)),
  getStockItems: () => JSON.parse(localStorage.getItem("stockItems")) || [],
  setStockItems: (items) => localStorage.setItem("stockItems", JSON.stringify(items)),
  getDarkMode: () => localStorage.getItem("darkMode") === "true",
  setDarkMode: (isDark) => localStorage.setItem("darkMode", isDark)
};

// ======== Utility Functions ========
const utils = {
  formatCurrency: (amount) => `৳${parseFloat(amount).toFixed(2)}`,
  getTodayDate: () => new Date().toISOString().split("T")[0],
  validateNumber: (value) => !isNaN(parseFloat(value)) && isFinite(value),
  safeEval: (expr) => {
    try {
      return new Function(`'use strict'; return (${expr})`)();
    } catch {
      return "Error";
    }
  }
};

// ======== Entry Management ========
const entryManager = {
  entries: dataManager.getEntries(),
  
  addEntry: (entry) => {
    entryManager.entries.push(entry);
    dataManager.setEntries(entryManager.entries);
  },
  
  deleteEntry: (index) => {
    entryManager.entries.splice(index, 1);
    dataManager.setEntries(entryManager.entries);
  },
  
  updateCustomerFilter: () => {
    const customers = [...new Set(entryManager.entries.map(e => e.name))].sort();
    elements.filterCustomerSelect.innerHTML = `<option value="">-- কাস্টমার ফিল্টার --</option>`;
    customers.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      elements.filterCustomerSelect.appendChild(opt);
    });
  },
  
  filterEntries: () => {
    const dateVal = elements.filterDateInput.value.trim();
    const customerVal = elements.filterCustomerSelect.value.trim();
    const searchQuery = elements.searchInput.value.toLowerCase().trim();
    
    return entryManager.entries.filter(entry => {
      const matchesDate = !dateVal || entry.date === dateVal;
      const matchesCustomer = !customerVal || entry.name === customerVal;
      const matchesSearch = !searchQuery ||
        entry.name.toLowerCase().includes(searchQuery) ||
        (entry.note && entry.note.toLowerCase().includes(searchQuery));
      
      return matchesDate && matchesCustomer && matchesSearch;
    });
  },
  
  getMonthlyTotals: () => {
    const monthlyTotals = {};
    entryManager.entries.forEach(entry => {
      const [year, month] = entry.date.split("-");
      const key = `${year}-${month}`;
      if (!monthlyTotals[key]) monthlyTotals[key] = { cash: 0, due: 0 };
      const amount = parseFloat(entry.amount);
      if (entry.type === "cash") monthlyTotals[key].cash += amount;
      else monthlyTotals[key].due += amount;
    });
    return monthlyTotals;
  },
  
  getWeeklyTotal: () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return entryManager.entries
      .filter(e => new Date(e.date) >= oneWeekAgo)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }
};

// ======== Stock Management ========
const stockManager = {
  items: dataManager.getStockItems(),
  
  addItem: (item) => {
    stockManager.items.push(item);
    dataManager.setStockItems(stockManager.items);
  },
  
  deleteItem: (index) => {
    stockManager.items.splice(index, 1);
    dataManager.setStockItems(stockManager.items);
  },
  
  calculateTotals: (items = stockManager.items) => {
    return items.reduce((totals, item) => {
      const qty = parseFloat(item.qty);
      const buy = parseFloat(item.buy);
      const sell = parseFloat(item.sell);
      
      totals.buy += qty * buy;
      totals.sell += qty * sell;
      totals.profit = totals.sell - totals.buy;
      return totals;
    }, { buy: 0, sell: 0, profit: 0 });
  }
};






// ======== Rendering Functions ========
const renderer = {
  renderEntry: (entry, index) => {
    const amount = parseFloat(entry.amount);
    return `
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
  },
  
  renderEntries: (entries = entryManager.entries) => {
    elements.list.innerHTML = "";
    
    const totals = entries.reduce((acc, entry) => {
      const amount = parseFloat(entry.amount);
      if (entry.type === "cash") acc.cash += amount;
      else if (entry.type === "due") acc.due += amount;
      return acc;
    }, { cash: 0, due: 0 });
    
    entries.forEach((entry, index) => {
      const li = document.createElement("li");
      li.className = `entry-item ${entry.type}`;
      li.innerHTML = renderer.renderEntry(entry, index);
      elements.list.appendChild(li);
    });
    
    elements.cashTotal.textContent = utils.formatCurrency(totals.cash);
    elements.dueTotal.textContent = utils.formatCurrency(totals.due);
    elements.grandTotal.textContent = utils.formatCurrency(totals.cash + totals.due);
    
    entryManager.updateCustomerFilter();
  },
  
  renderStockItem: (item, index) => {
    const qty = parseFloat(item.qty);
    const buy = parseFloat(item.buy);
    const sell = parseFloat(item.sell);
    const totalBuy = qty * buy;
    const totalSell = qty * sell;
    const profit = totalSell - totalBuy;
    
    return `
      <h3>
        <span class="item-name">${item.name}</span>
        (<span class="item-qty">${item.qty}</span>)
      </h3>
      <p>💰 ক্রয়মূল্য: ৳${buy.toFixed(2)}</p>
      <p>💵 বিক্রয়মূল্য: ৳${sell.toFixed(2)}</p>
      <p>📦 মোট ক্রয়: ৳${totalBuy.toFixed(2)}</p>
      <p>🛒 মোট বিক্রয়: ৳${totalSell.toFixed(2)}</p>
      <p>📈 লাভ/ক্ষতি: <span class="${profit >= 0 ? 'profit' : 'loss'}">৳${profit.toFixed(2)}</span></p>
      <p>📅 তারিখ: ${item.date}</p>
      <div class="entry-actions">
        <button class="action-btn" onclick="editStock(${index})">✏️</button>
        <button class="action-btn" onclick="deleteStock(${index})">🗑️</button>
        <button class="action-btn" onclick="adjustStock(${index})">⚙️</button>
      </div>
    `;
  },
  
  renderStock: (items = stockManager.items) => {
    elements.stockList.innerHTML = "";
    const totals = stockManager.calculateTotals(items);
    
    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "stock-card";
      card.innerHTML = renderer.renderStockItem(item, index);
      elements.stockList.appendChild(card);
    });
    
    elements.totalBuy.textContent = utils.formatCurrency(totals.buy);
    elements.totalSell.textContent = utils.formatCurrency(totals.sell);
    elements.totalProfit.textContent = utils.formatCurrency(totals.profit);
  },
  
  updateReports: () => {
    const today = utils.getTodayDate();
    const todayCash = entryManager.entries
      .filter(e => e.date === today && e.type === "cash")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    elements.todayCash.textContent = utils.formatCurrency(todayCash);
    elements.weeklyTotal.textContent = utils.formatCurrency(entryManager.getWeeklyTotal());
  }
};




// ======== Event Handlers ========
const handlers = {
  handleFormSubmit: (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const amount = document.getElementById("amount").value;
    const note = document.getElementById("note").value;
    const type = document.getElementById("type").value;
    const entryDate = document.getElementById("entryDate").value;
    const date = entryDate || utils.getTodayDate();

    if (!name || !amount || !type || !utils.validateNumber(amount)) {
      return alert("সব ঘর সঠিকভাবে পূরণ করুন!");
    }

    entryManager.addEntry({ name, amount, note, type, date });
    renderer.renderEntries();
    updateCustomerSuggestions();
    document.getElementById("entryForm").reset();
  },

  handleStockSubmit: (e) => {
    e.preventDefault();
    const { stockName, qty, buy, sell, date } = elements.stockForm;
    
    if (!stockName.value || !qty.value || !buy.value || !sell.value || !date.value ||
      !utils.validateNumber(qty.value) || !utils.validateNumber(buy.value) || !utils.validateNumber(sell.value)) {
      return alert("সব ঘর সঠিকভাবে পূরণ করুন!");
    }
    
    stockManager.addItem({
      name: stockName.value.trim(),
      qty: qty.value,
      buy: buy.value,
      sell: sell.value,
      date: date.value
    });
    
    renderer.renderStock();
    elements.stockForm.reset();
  },

  handleSearch: () => {
    renderer.renderEntries(entryManager.filterEntries());
  },

  toggleDarkMode: () => {
    document.body.classList.toggle("dark");
    dataManager.setDarkMode(document.body.classList.contains("dark"));
  },

  toggleModal: () => {
    const isOpen = !elements.entryModal.classList.contains("hidden");
    elements.entryModal.classList.toggle("hidden");
    document.body.style.overflow = isOpen ? "" : "hidden";
    
    if (!isOpen) {
      elements.modalEntryList.innerHTML = entryManager.entries.length === 0
        ? `<li style="text-align:center; color:gray;">কোনো এন্ট্রি নেই</li>`
        : entryManager.entries.map((entry, index) =>
            `<li class="entry-item ${entry.type}">${renderer.renderEntry(entry, index)}</li>`
          ).join("");
    }
  }
};





// ======== PDF Generation ========
const pdfGenerator = {
  generatePDF: () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("hisebkhata852@gmail.com", 14, 15);
    
    doc.autoTable({
      head: [
        ["#", "Name", "Amount", "Type", "Note", "Date"]
      ],
      body: entryManager.entries.map((entry, i) => [
        i + 1,
        entry.name,
        entry.amount,
        entry.type === "cash" ? "cash" : "due",
        entry.note || '',
        entry.date
      ]),
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 167, 69] },
    });
    
    doc.save("hishab_report.pdf");
  },
  
  generateMonthlyPDF: () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const monthlyTotals = entryManager.getMonthlyTotals();
    
    doc.setFontSize(16);
    doc.text("Monthly Hishab Report", 14, 15);
    
    doc.autoTable({
      head: [
        ["Month", "Cash", "Due", "Total"]
      ],
      body: Object.keys(monthlyTotals).sort().map(month => {
        const cash = monthlyTotals[month].cash.toFixed(2);
        const due = monthlyTotals[month].due.toFixed(2);
        return [month, cash, due, (parseFloat(cash) + parseFloat(due)).toFixed(2)];
      }),
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 167, 69] },
    });
    
    doc.save("monthly_hishab_report.pdf");
  },
  
  generateStockPDF: () => {
    if (stockManager.items.length === 0) {
      alert("❌ কোনো স্টক ডেটা নেই!");
      return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const totals = stockManager.calculateTotals();
    
    doc.setFontSize(14);
    doc.text("hisebkhata stockList", 14, 15);
    
    doc.autoTable({
      head: [
        ["#", "Product", "Qty", "Buy", "Sell", "Date", "Total Buy", "Total Sell", "Profit"]
      ],
      body: stockManager.items.map((item, i) => {
        const qty = parseFloat(item.qty);
        const buy = parseFloat(item.buy);
        const sell = parseFloat(item.sell);
        return [
          i + 1,
          item.name,
          qty,
          buy.toFixed(2),
          sell.toFixed(2),
          item.date,
          (qty * buy).toFixed(2),
          (qty * sell).toFixed(2),
          (qty * (sell - buy)).toFixed(2)
        ];
      }),
      startY: 25,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 167, 69] },
    });
    
    doc.text(`Total Profit: ৳${totals.profit.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save("stock_report.pdf");
  }
};

// ======== Backup Functions ========
const backupManager = {
  exportBackup: () => {
    const data = {
      entries: entryManager.entries,
      stockItems: stockManager.items,
      darkMode: dataManager.getDarkMode()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "hishab_backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
  
  importBackup: (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (data.entries && data.stockItems) {
          entryManager.entries = data.entries;
          stockManager.items = data.stockItems;
          
          dataManager.setEntries(entryManager.entries);
          dataManager.setStockItems(stockManager.items);
          
          if (data.darkMode) {
            document.body.classList.add("dark");
            dataManager.setDarkMode(true);
          }
          
          renderer.renderEntries();
          renderer.renderStock();
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
};

// ======== PWA Functions ========
const pwaManager = {
  deferredPrompt: null,
  
  init: () => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      pwaManager.deferredPrompt = e;
      elements.installBtn.style.display = "block";
      
      elements.installBtn.addEventListener("click", () => {
        elements.installBtn.style.display = "none";
        pwaManager.deferredPrompt.prompt();
        pwaManager.deferredPrompt.userChoice.then(choice => {
          console.log(choice.outcome === "accepted" ?
            "✅ ইনস্টলেশন শুরু হয়েছে" : "❌ ইউজার ইনস্টলেশন বাতিল করেছে");
          pwaManager.deferredPrompt = null;
        });
      });
    });
    
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/hisebkhata009/service-worker.js")
        .then(reg => console.log("✅ Service Worker রেজিস্টার হয়েছে:", reg.scope))
        .catch(err => console.error("❌ Service Worker রেজিস্টার হয়নি:", err.message));
    }
  }
};

// ======== Calculator Functions ========
const calculator = {
  initialized: false,
  isResultShown: false,
  
  init: () => {
    if (calculator.initialized) return;
    
    document.querySelectorAll(".calc-btn").forEach(btn => {
      btn.onclick = () => {
        const val = btn.getAttribute("data-value");
        
        if (val === "C") {
          elements.calcScreen.value = "";
          calculator.isResultShown = false;
        } else if (val === "⌫") {
          elements.calcScreen.value = elements.calcScreen.value.slice(0, -1);
        } else if (val === "=") {
          elements.calcScreen.value = utils.safeEval(elements.calcScreen.value);
          calculator.isResultShown = true;
        } else {
          if (calculator.isResultShown && /[0-9.]/.test(val)) {
            elements.calcScreen.value = val;
          } else {
            elements.calcScreen.value += val;
          }
          calculator.isResultShown = false;
        }
      };
    });
    
    calculator.initialized = true;
  }
};

// ======== Navigation Functions ========
const navigation = {
  scrollToSection: (sectionId) => {
    document.querySelectorAll("main > section, main > form, #calculatorPage")
      .forEach(sec => sec.style.display = "none");
    
    const target = document.getElementById(sectionId);
    if (target) {
      target.style.display = sectionId === "homePage" ? "flex" : "block";
      
      if (sectionId === "homePage") {
        target.style.gap = "15px";
        renderer.updateReports();
      }
      
      if (sectionId === "calculatorPage") {
        calculator.init();
      }
      
      target.scrollIntoView({ behavior: "smooth" });
      
      document.querySelectorAll(".mobile-nav button").forEach(btn =>
        btn.classList.remove("active"));
      const activeBtn = [...document.querySelectorAll(".mobile-nav button")]
        .find(btn => btn.getAttribute("onclick")?.includes(sectionId));
      if (activeBtn) activeBtn.classList.add("active");
    }
  },
  
  scrollToTop: () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

// ======== Initialize App ========
function initApp() {
  // Load saved data
  if (dataManager.getDarkMode()) {
    document.body.classList.add("dark");
  }
  
  // Set up event listeners
  elements.form.addEventListener("submit", handlers.handleFormSubmit);
  elements.stockForm.addEventListener("submit", handlers.handleStockSubmit);
  elements.searchInput.addEventListener("input", handlers.handleSearch);
  elements.filterDateInput.addEventListener("input", handlers.handleSearch);
  elements.filterCustomerSelect.addEventListener("change", handlers.handleSearch);
  document.getElementById("importFile").addEventListener("change", backupManager.importBackup);
  
  // Initial rendering
  renderer.renderEntries();
  renderer.renderStock();
  renderer.updateReports();
  
  // Initialize PWA
  pwaManager.init();
}

// ======== Global Functions ========
window.editEntry = (index) => {
  const entry = entryManager.entries[index];
  const { name, amount, note, type } = elements.form;
  
  name.value = entry.name;
  amount.value = entry.amount;
  note.value = entry.note || "";
  type.value = entry.type;
  
  entryManager.deleteEntry(index);
  name.focus();
  alert("✏️ এন্ট্রি সম্পাদনার জন্য প্রস্তুত। পরিবর্তন করে আবার জমা দিন।");
};

window.deleteEntry = (index) => {
  if (confirm("❌ আপনি কি এই এন্ট্রিটি মুছে ফেলতে চান?")) {
    entryManager.deleteEntry(index);
    renderer.renderEntries();
    alert("🗑️ এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে!");
  }
};

window.editStock = (index) => {
  const item = stockManager.items[index];
  const { stockName, qty, buy, sell, date } = elements.stockForm;
  
  stockName.value = item.name;
  qty.value = item.qty;
  buy.value = item.buy;
  sell.value = item.sell;
  date.value = item.date;
  
  stockManager.deleteItem(index);
  alert("✏️ সম্পাদনার জন্য তথ্য ফর্মে বসানো হয়েছে। পরিবর্তন করে আবার 'যোগ করুন' চাপুন।");
};

window.deleteStock = (index) => {
  if (confirm("❌ আপনি কি নিশ্চিতভাবে এই পণ্যটি মুছে ফেলতে চান?")) {
    stockManager.deleteItem(index);
    renderer.renderStock();
    alert("🗑️ পণ্যটি মুছে ফেলা হয়েছে!");
  }
};

window.generatePDF = pdfGenerator.generatePDF;
window.generateMonthlyPDF = pdfGenerator.generateMonthlyPDF;
window.generateStockPDF = pdfGenerator.generateStockPDF;
window.generateMonthlyReport = () => {
  const monthlyTotals = entryManager.getMonthlyTotals();
  let reportText = "📅 মাসিক রিপোর্ট:\n\n";
  
  Object.keys(monthlyTotals).sort().forEach(month => {
    const data = monthlyTotals[month];
    const total = data.cash + data.due;
    reportText += `🗓️ ${month}: নগদ = ${utils.formatCurrency(data.cash)}, বাকি = ${utils.formatCurrency(data.due)}, মোট = ${utils.formatCurrency(total)}\n`;
  });
  
  alert(reportText);
};

window.exportBackup = backupManager.exportBackup;
window.importBackup = () => document.getElementById("importFile").click();
window.toggleDarkMode = handlers.toggleDarkMode;
window.toggleModal = handlers.toggleModal;
window.scrollToSection = navigation.scrollToSection;
window.scrollToTop = navigation.scrollToTop;

// Start the app
window.addEventListener("DOMContentLoaded", initApp);

// ===== stock adjustment ====
function adjustStock(index) {
  const item = stockManager.items[index];
  const input = prompt(`⚙️ ${item.name} এর পরিমাণ অ্যাডজাস্ট করুন (যেমন: +5 বা -3):`);

  if (input) {
    const adjustValue = parseInt(input);
    if (!isNaN(adjustValue)) {
      item.qty = Math.max(0, parseInt(item.qty) + adjustValue);

      const stockLogs = JSON.parse(localStorage.getItem("stockLogs") || "[]");
      stockLogs.push(`${item.name} এর qty ${adjustValue > 0 ? 'বাড়ানো হয়েছে' : 'কমানো হয়েছে'} (${adjustValue}) - ${new Date().toLocaleDateString()}`);
      localStorage.setItem("stockLogs", JSON.stringify(stockLogs));

      localStorage.setItem("stockItems", JSON.stringify(stockManager.items));
      renderer.renderStock();
    } else {
      alert("❌ ইনপুট সঠিক নয়!");
    }
  }
}

//stock logs 
function toggleStockLogModal() {
  const modal = document.getElementById("stockLogModal");
  const logContainer = document.getElementById("stockLogList");

  if (modal.classList.contains("hidden")) {
    // Show modal
    const logs = JSON.parse(localStorage.getItem("stockLogs")) || [];
    if (logs.length === 0) {
      logContainer.innerHTML = `<p style="text-align:center; color:gray;">📭 কোনো স্টক লগ নেই</p>`;
    } else {
      logContainer.innerHTML = logs.reverse().map(log => `<div class="log-item">🕒 ${log}</div>`).join("");
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } else {
    // Hide modal
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

//----- filter

function toggleStockLogModal() {
  const modal = document.getElementById("stockLogModal");
  const logContainer = document.getElementById("stockLogList");
  const searchInput = document.getElementById("logSearchInput");

  const logs = JSON.parse(localStorage.getItem("stockLogs")) || [];

  // Modal দেখানো হলে
  if (modal.classList.contains("hidden")) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    renderFilteredLogs(logs);

    // ✅ ফিল্টার করার সময় live পরিবর্তন
    searchInput.addEventListener("input", function () {
      const keyword = this.value.toLowerCase();
      const filtered = logs.filter;
      renderFilteredLogs(filtered);
    });

  } else {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

// ✅ আলাদা রেন্ডার ফাংশন
function renderFilteredLogs(logs) {
  const logContainer = document.getElementById("stockLogList");
  if (logs.length === 0) {
    logContainer.innerHTML = `<p style="text-align:center; color:gray;">📭 কোনো স্টক লগ নেই</p>`;
  } else {
    logContainer.innerHTML = logs.reverse().map(log => `<div class="log-item">🕒 ${log}</div>`).join("");
  }
}
//== customer suggestion
function updateCustomerSuggestions() {
  const entries = JSON.parse(localStorage.getItem("entries")) || [];
  const names = [...new Set(entries.map(e => e.name.trim()))];
  const datalist = document.getElementById("customerSuggestions");

  datalist.innerHTML = names.map(name => `<option value="${name}">`).join("");
}
document.addEventListener("DOMContentLoaded", () => {
  updateCustomerSuggestions();
});


