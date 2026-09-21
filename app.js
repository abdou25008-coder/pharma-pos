// مدير مبيعات الأدويه - Engine & Database
const STORAGE_KEY = 'PHARMA_SALES_MANAGER_DB_V2';

function initPharmaDatabase() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try { return JSON.parse(existing); } catch(e) {}
  }

  const initialDB = {
    products: [
      {
        id: 1,
        name: "أوجمنتين 1 جم 14 قرص (Augmentin)",
        sku: "AUG-1G-14T",
        stockQuantity: 45,
        officialPrice: 135.0,        // سعر الجمهور الرسمي الثابت
        purchaseDiscountRate: 26.0,  // خصم الشراء الحالي من شركة التوزيع %
        lastPurchaseDiscountRate: 28.0, // كان 28% وتم تخفيضه إلى 26%
        saleDiscountRate: 20.0,      // الخصم الممنوح للعميل %
        unit: "علبة"
      },
      {
        id: 2,
        name: "بنادول إكسترا 24 قرص (Panadol Extra)",
        sku: "PAN-EXT-24T",
        stockQuantity: 80,
        officialPrice: 48.0,
        purchaseDiscountRate: 22.0,
        lastPurchaseDiscountRate: 22.0,
        saleDiscountRate: 18.0,
        unit: "علبة"
      },
      {
        id: 3,
        name: "كونكور 5 مجم 30 قرص (Concor 5mg)",
        sku: "CON-5MG-30T",
        stockQuantity: 25,
        officialPrice: 85.0,
        purchaseDiscountRate: 24.0,
        lastPurchaseDiscountRate: 24.0,
        saleDiscountRate: 19.0,
        unit: "علبة"
      },
      {
        id: 4,
        name: "سولبادين فوار 20 قرص (Solpadeine)",
        sku: "SOL-EFF-20T",
        stockQuantity: 4,
        officialPrice: 62.0,
        purchaseDiscountRate: 25.0,
        lastPurchaseDiscountRate: 27.0, // كان 27%
        saleDiscountRate: 20.0,
        unit: "علبة"
      },
      {
        id: 5,
        name: "كتافلام 50 مجم 20 قرص (Cataflam)",
        sku: "CAT-50MG-20T",
        stockQuantity: 35,
        officialPrice: 51.0,
        purchaseDiscountRate: 25.0,
        lastPurchaseDiscountRate: 25.0,
        saleDiscountRate: 20.0,
        unit: "علبة"
      }
    ],
    customers: [
      { id: 1, name: "د. طارق محمود", phone: "01011223344", address: "المعادي - القاهرة", totalPurchases: 4250 },
      { id: 2, name: "د. أحمد نور", phone: "01122334455", address: "شارع فيصل - الجيزة", totalPurchases: 7890 },
      { id: 3, name: "د. حسام فوزي", phone: "01233445566", address: "مدينة نصر - القاهرة", totalPurchases: 2900 }
    ],
    suppliers: [
      { id: 1, name: "شركة ابن سينا فارما للتوزيع", phone: "0225100000", repName: "أ. محمد عبد الله" },
      { id: 2, name: "شركة المتحدة للصيادلة (UCP)", phone: "0227100000", repName: "أ. طارق محمود" },
      { id: 3, name: "شركة فارما أوفرسيز", phone: "0224100000", repName: "أ. حسام فوزي" }
    ],
    purchaseInvoices: [
      {
        id: 1,
        invoiceNumber: "PUR-8821",
        supplierName: "شركة ابن سينا فارما للتوزيع",
        date: Date.now() - 86400000 * 3,
        totalAmount: 4850,
        totalDiscount: 1261,
        netAmount: 3589,
        itemsCount: 2,
        items: [
          { productName: "أوجمنتين 1 جم 14 قرص (Augmentin)", quantity: 30, officialPrice: 135.0, purchaseDiscountRate: 26.0, itemTotal: 2997.0 },
          { productName: "سولبادين فوار 20 قرص (Solpadeine)", quantity: 15, officialPrice: 62.0, purchaseDiscountRate: 25.0, itemTotal: 697.5 }
        ]
      }
    ],
    salesInvoices: [
      {
        id: 1,
        invoiceNumber: "SAL-10294",
        customerId: 1,
        customerName: "د. طارق محمود",
        customerPhone: "01011223344",
        date: Date.now() - 86400000 * 1,
        grandTotal: 1548.0,
        items: [
          { productId: 1, productName: "أوجمنتين 1 جم 14 قرص (Augmentin)", quantity: 10, officialPrice: 135.0, saleDiscountRate: 20.0, netUnitPrice: 108.0, lineTotal: 1080.0 },
          { productId: 2, productName: "بنادول إكسترا 24 قرص (Panadol Extra)", quantity: 12, officialPrice: 48.0, saleDiscountRate: 18.0, netUnitPrice: 39.36, lineTotal: 472.32 }
        ]
      }
    ],
    discountAlerts: [
      {
        id: 1,
        productId: 1,
        productName: "أوجمنتين 1 جم 14 قرص (Augmentin)",
        oldDiscount: 28.0,
        newDiscount: 26.0,
        diff: -2.0,
        supplierName: "شركة ابن سينا فارما للتوزيع",
        invoiceNumber: "PUR-8821",
        timestamp: Date.now() - 86400000 * 3
      },
      {
        id: 2,
        productId: 4,
        productName: "سولبادين فوار 20 قرص (Solpadeine)",
        oldDiscount: 27.0,
        newDiscount: 25.0,
        diff: -2.0,
        supplierName: "شركة ابن سينا فارما للتوزيع",
        invoiceNumber: "PUR-8821",
        timestamp: Date.now() - 86400000 * 3
      }
    ],
    movements: [
      { id: 1, productId: 1, productName: "أوجمنتين 1 جم 14 قرص", movementType: "PURCHASE_IN", quantity: 30, previousStock: 25, newStock: 55, referenceInvoiceNumber: "PUR-8821", timestamp: Date.now() - 86400000 * 3 },
      { id: 2, productId: 1, productName: "أوجمنتين 1 جم 14 قرص", movementType: "SALE_OUT", quantity: -10, previousStock: 55, newStock: 45, referenceInvoiceNumber: "SAL-10294", timestamp: Date.now() - 86400000 * 1 }
    ]
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
  return initialDB;
}

let db = initPharmaDatabase();

function updateCloudBadge(isOnline) {
  const badge = document.getElementById('cloudStatusBadge');
  if (!badge) return;
  if (isOnline) {
    badge.className = 'cloud-badge cloud-online';
    badge.innerHTML = '☁️ سحابي متصل';
  } else {
    badge.className = 'cloud-badge cloud-offline';
    badge.innerHTML = '💾 وضع محلي';
  }
}

async function syncWithCloud(silent = false) {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const cloudData = await res.json();
      if (cloudData && Array.isArray(cloudData.products)) {
        db = cloudData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        updateCloudBadge(true);
        if (!silent) {
          navigateTo(currentScreen);
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('Cloud sync offline or unreachable:', err);
    updateCloudBadge(false);
  }
  return false;
}

function saveDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  // Sync to Cloud Storage directly
  if (typeof fetch !== 'undefined') {
    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
    }).then(res => {
      if (res.ok) {
        updateCloudBadge(true);
      } else {
        updateCloudBadge(false);
      }
    }).catch(() => {
      updateCloudBadge(false);
    });
  }
}

function resetPharmaDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  db = initPharmaDatabase();
  saveDB();
  navigateTo('home');
  showToast("تم إعادة ضبط بيانات الأدوية بنجاح!");
}

// زر صغير بالأعلى لتحديث التطبيق مباشرة مع مزامنة سحابية
async function refreshAppDirectly() {
  const synced = await syncWithCloud(false);
  if (!synced) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { db = JSON.parse(saved); } catch(e) {}
    }
    navigateTo(currentScreen);
    showToast("تم التحديث محلياً (السحابة غير متصلة)");
  } else {
    showToast("تم المزامنة والتحديث سحابياً بنجاح! ☁️");
  }
}

// Automatically sync from cloud server on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    syncWithCloud(false);
  });
  // Also try immediately
  syncWithCloud(true);
}

// Current state
let currentScreen = 'home';
let currentSalesItems = [];
let parsedPurchaseItems = [];
let selectedCustomerForHistory = null;

const screenContainer = document.getElementById('screenContent');
const topBarTitle = document.getElementById('topBarTitle');
const topBarSubtitle = document.getElementById('topBarSubtitle');
const backBtn = document.getElementById('backBtn');
const modalOverlay = document.getElementById('appModalOverlay');
const modalContent = document.getElementById('appModalContent');

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '85px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = type === 'success' ? '#059669' : '#dc2626';
  toast.style.color = '#fff';
  toast.style.padding = '10px 22px';
  toast.style.borderRadius = '25px';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '700';
  toast.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
  toast.style.zIndex = '99999';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// Modal Form Open / Close
function openAppModal(title, htmlBody, isWide = false) {
  modalContent.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="closeAppModal()">✕</button>
    </div>
    <div>${htmlBody}</div>
  `;
  if (isWide) {
    modalContent.style.maxWidth = '780px';
  } else {
    modalContent.style.maxWidth = '';
  }
  modalOverlay.classList.add('active');
}

function closeAppModal(e) {
  if (e && e.target !== modalOverlay && !e.target.classList.contains('modal-close')) return;
  modalOverlay.classList.remove('active');
  modalContent.style.maxWidth = '';
}

function toggleViewMode() {
  const layout = document.getElementById('appLayout');
  const btn = document.getElementById('viewToggleBtn');
  if (!layout) return;
  const isMobile = layout.classList.toggle('mobile-mode');
  if (isMobile) {
    if (btn) btn.innerHTML = '💻 عرض كمبيوتر';
    showToast("تم التحويل إلى وضع الموبايل (طولي) 📱");
  } else {
    if (btn) btn.innerHTML = '📱 عرض موبايل';
    showToast("تم التحويل إلى وضع الكمبيوتر (عرض الشاشة بالكامل) 💻");
  }
  localStorage.setItem('PHARMA_VIEW_MODE', isMobile ? 'mobile' : 'desktop');
}

function navigateTo(screen) {
  currentScreen = screen;
  if (backBtn) {
    backBtn.style.display = (screen === 'home') ? 'none' : 'flex';
  }

  document.querySelectorAll('.nav-item, .nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === screen);
  });

  switch (screen) {
    case 'home': renderHomeScreen(); break;
    case 'purchase': renderPurchaseScreen(); break;
    case 'purchase_history': renderPurchaseHistoryScreen(); break;
    case 'discount_alerts': renderDiscountAlertsScreen(); break;
    case 'sales': renderSalesScreen(); break;
    case 'inventory': renderInventoryScreen(); break;
    case 'customers': renderCustomersScreen(); break;
    case 'customer_invoices': renderCustomerInvoicesScreen(); break;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// 1. HOME SCREEN
// -------------------------------------------------------------
function renderHomeScreen() {
  topBarTitle.innerText = "مدير مبيعات الأدويه";
  topBarSubtitle.innerText = "منظومة مبيعات وتوزيع الأدوية وإدارة المخزون";

  const totalSales = db.salesInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  const totalPurchases = db.purchaseInvoices.reduce((acc, inv) => acc + (inv.netAmount || 0), 0);
  const productsCount = db.products.length;
  const lowStockCount = db.products.filter(p => p.stockQuantity <= 5).length;
  const alertsCount = db.discountAlerts.length;

  screenContainer.innerHTML = `
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card green">
        <span class="label">إجمالي مبيعات الأدوية</span>
        <span class="val">${totalSales.toLocaleString('ar-EG', {minimumFractionDigits: 2})} ج.م</span>
      </div>
      <div class="stat-card blue">
        <span class="label">إجمالي مشتريات الموردين</span>
        <span class="val">${totalPurchases.toLocaleString('ar-EG', {minimumFractionDigits: 2})} ج.م</span>
      </div>
      <div class="stat-card">
        <span class="label">أصناف الأدوية بالمخزن</span>
        <span class="val">${productsCount} دواء</span>
      </div>
      <div class="stat-card ${lowStockCount > 0 ? 'amber' : ''}">
        <span class="label">نواقص أوشكت على النفاذ</span>
        <span class="val">${lowStockCount} دواء</span>
      </div>
    </div>

    <!-- Discount Alert Banner if any -->
    ${alertsCount > 0 ? `
      <div class="card" style="background:#fef3c7; border-color:#fde68a; cursor:pointer;" onclick="navigateTo('discount_alerts')">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">⚠️</span>
            <div>
              <div style="font-weight:800; font-size:13px; color:#b45309;">تنبيه: تغير في خصومات الأدوية (${alertsCount})</div>
              <div style="font-size:11px; color:#92400e;">تم رصد تغير في خصم المورد لأصناف مثل أوجمنتين وسولبادين</div>
            </div>
          </div>
          <span style="font-size:11px; font-weight:800; color:#b45309;">عرض التحليلات ></span>
        </div>
      </div>
    ` : ''}

    <!-- 5 Main Action Cards -->
    <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-top:4px;">العمليات الأساسية والوظائف</div>

    <div class="action-grid">
      <div class="action-card" style="background:#0284c7;" onclick="navigateTo('purchase')">
        <div class="icon-box">📷</div>
        <div class="info">
          <h3>إضافة فاتورة شراء أدوية (سكانر / صورة)</h3>
          <p>مسح فاتورة المورد، قراءة خصم الشراء، وتحديث رصيد المخزن</p>
        </div>
      </div>

      <div class="action-card" style="background:#059669;" onclick="navigateTo('sales')">
        <div class="icon-box">🏷️</div>
        <div class="info">
          <h3>إصدار فاتورة بيع للعملاء (مع واتساب)</h3>
          <p>سعر الجمهور ثابت، خصم البيع، الحساب التلقائي، ومشاركة واتساب</p>
        </div>
      </div>

      <div class="action-card" style="background:#4f46e5;" onclick="navigateTo('purchase_history')">
        <div class="icon-box">📊</div>
        <div class="info">
          <h3>سجل فواتير الموردين وتحليلات الخصم</h3>
          <p>سجل المشتريات من شركات التوزيع وتنبيهات تغير الخصم</p>
        </div>
      </div>

      <div class="action-card" style="background:#0d9488;" onclick="navigateTo('inventory')">
        <div class="icon-box">💊</div>
        <div class="info">
          <h3>متابعة أرصدة الأدوية وتعديل الجرد</h3>
          <p>رصيد كل دواء وسجل حركته مع زر تعديل الأرصدة يدوياً</p>
        </div>
      </div>

      <div class="action-card" style="background:#6366f1;" onclick="navigateTo('customers')">
        <div class="icon-box">👥</div>
        <div class="info">
          <h3>سجل فواتير العملاء بالمنظومة</h3>
          <p>قائمة العملاء وفواتير كل عميل ومسحوباته السابقة</p>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 2. PURCHASE SCREEN (Pharma Pricing & Fixed Price + Discount)
// -------------------------------------------------------------
function renderPurchaseScreen() {
  topBarTitle.innerText = "فاتورة شراء أدوية جديدة";
  topBarSubtitle.innerText = "سعر الجمهور ثابت وقيمة الخصم هي المتغيرة";

  calculateAndRenderPurchaseUI();
}

function calculateAndRenderPurchaseUI() {
  const totalBefore = parsedPurchaseItems.reduce((acc, item) => acc + (item.quantity * item.officialPrice), 0);
  const totalDisc = parsedPurchaseItems.reduce((acc, item) => acc + ((item.quantity * item.officialPrice) * (item.purchaseDiscountRate / 100)), 0);
  const netGrandTotal = totalBefore - totalDisc;

  screenContainer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:700; font-size:13px;">إدخال فاتورة الشراء من المورد</span>
      <button class="btn btn-outline btn-small" onclick="navigateTo('purchase_history')">
        📋 سجل فواتير الموردين
      </button>
    </div>

    <!-- Scanner Card -->
    <div class="card" style="background:#e0f2fe; border-color:#bae6fd;">
      <div style="font-weight:800; font-size:14px; color:#0369a1; margin-bottom:4px;">مسح الفاتورة واستخراج الأصناف بالذكاء الاصطناعي</div>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">التقط صورة بالكاميرا أو ارفع صورة الفاتورة ليتم قراءة أسعار الجمهور ونسب الخصم والكميات تلقائياً</p>

      <div class="row-2">
        <button type="button" class="btn btn-primary" style="font-size:13px;" onclick="triggerCameraCapture()">
          📷 سكانر الكاميرا
        </button>
        <button type="button" class="btn btn-secondary" style="font-size:13px;" onclick="triggerFileUpload()">
          🖼️ رفع صورة الفاتورة
        </button>
      </div>
      <!-- Hidden file inputs -->
      <input type="file" id="purchaseCameraInput" accept="image/*" capture="environment" style="display:none;" onchange="processUploadedInvoiceImage(event)" />
      <input type="file" id="purchaseFileInput" accept="image/*" style="display:none;" onchange="processUploadedInvoiceImage(event)" />

      <div id="scanStatus" style="font-size:12px; color:#0284c7; margin-top:10px; font-weight:700; display:none;"></div>
    </div>

    <!-- Invoice Header Fields -->
    <div class="card">
      <div class="row-2">
        <div class="form-group">
          <label>رقم فاتورة الشراء</label>
          <input class="input" id="purInvoiceNo" value="PUR-${Math.floor(10000 + Math.random() * 90000)}" />
        </div>
        <div class="form-group">
          <label>المورد / شركة التوزيع</label>
          <select class="input" id="purSupplierName">
            ${db.suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- Parsed Medicine Items -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
        <span style="font-size:13px; font-weight:800;">أصناف الأدوية المستخرجة (${parsedPurchaseItems.length})</span>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-outline btn-small" onclick="openAddMedicineModal()">+ إضافة دواء يدوياً</button>
          ${parsedPurchaseItems.length > 0 ? `
            <button class="btn btn-outline btn-small" style="color:var(--danger); border-color:#fca5a5; font-weight:700;" onclick="clearAllPurchaseItems()" title="مسح كافة الأصناف المستخرجة">
              🗑️ مسح كافة الأصناف
            </button>
          ` : ''}
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px;">
        ${parsedPurchaseItems.length === 0 ? `
          <div style="text-align:center; padding:24px 12px; color:var(--text-muted); background:#f8fafc; border-radius:12px; border:1px dashed var(--border);">
            <div style="font-size:32px; margin-bottom:6px;">🧾</div>
            <div style="font-weight:700; font-size:13px; color:#334155; margin-bottom:4px;">لم يتم إضافة أدوية في هذه الفاتورة بعد</div>
            <p style="font-size:11px; margin-bottom:12px;">قم بالتقاط صورة الفاتورة أو رفعها لقراءة الأصناف والأسعار، أو أضف الأدوية يدوياً</p>
            <button class="btn btn-primary btn-small" onclick="openAddMedicineModal()">+ إضافة دواء يدوياً</button>
          </div>
        ` : parsedPurchaseItems.map((item, idx) => {
          const netUnitPrice = item.officialPrice * (1 - (item.purchaseDiscountRate / 100));
          const lineTotal = item.quantity * netUnitPrice;

          const existing = db.products.find(p => p.name.includes(item.productName) || item.productName.includes(p.name));
          const discountChanged = existing && existing.purchaseDiscountRate !== item.purchaseDiscountRate;

          return `
            <div style="background:#f8fafc; border:1px solid var(--border); border-radius:12px; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:800; font-size:13px;">${item.productName}</span>
                <button class="btn btn-outline btn-small" title="مسح هذا الصنف" onclick="removePurchaseItem(${idx})" style="color:var(--danger); border-color:#fca5a5; padding:3px 8px; font-weight:700;">
                  🗑️ مسح
                </button>
              </div>

              ${discountChanged ? `
                <div style="margin-top:4px; padding:4px 8px; background:#fef3c7; color:#b45309; border-radius:6px; font-size:11px; font-weight:700;">
                  ⚠️ تنبيه تغير الخصم: كان ${existing.purchaseDiscountRate}% وأصبح بالفاتورة ${item.purchaseDiscountRate}%!
                </div>
              ` : ''}

              <div class="row-3" style="margin-top:6px; font-size:11px; color:var(--text-muted);">
                <div>الكمية: <b style="color:#000">${item.quantity} علبة</b></div>
                <div>سعر الجمهور: <b style="color:#000">${item.officialPrice} ج.م</b></div>
                <div>خصم الشراء: <b style="color:#0284c7;">${item.purchaseDiscountRate}%</b></div>
              </div>

              <div class="row-2" style="margin-top:4px; font-size:11px; color:var(--text-muted);">
                <div>صافي تكلفة الشراء للعلبة: <b>${netUnitPrice.toFixed(2)} ج.م</b></div>
                <div>خصم البيع المقترح للعميل: <b style="color:var(--warning);">${item.saleDiscountRate}%</b></div>
              </div>

              <div style="margin-top:6px; font-size:12px; font-weight:800; color:#0284c7; text-align:left;">
                إجمالي الصنف بعد الخصم: ${lineTotal.toFixed(2)} ج.م
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Financial Summary -->
      <div style="margin-top:14px; padding-top:10px; border-top:1px dashed var(--border); font-size:12px; display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-muted);">إجمالي سعر الجمهور الرسمي:</span>
          <span>${totalBefore.toFixed(2)} ج.م</span>
        </div>
        <div style="display:flex; justify-content:space-between; color:var(--danger);">
          <span>إجمالي قيمة خصم الشراء:</span>
          <span>-${totalDisc.toFixed(2)} ج.م</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:15px; color:#0284c7; margin-top:4px;">
          <span>الصافي المستحق للمورد:</span>
          <span>${netGrandTotal.toFixed(2)} ج.م</span>
        </div>
      </div>
    </div>

    <!-- Save Purchase Invoice -->
    <button class="btn btn-primary" style="height:52px; font-size:15px;" onclick="savePurchaseInvoice()">
      💾 حفظ فاتورة الشراء وتحديث أرصدة الأدوية
    </button>
  `;
}

function triggerCameraCapture() {
  const inp = document.getElementById('purchaseCameraInput');
  if (inp) {
    inp.value = '';
    inp.click();
  }
}

function triggerFileUpload() {
  const inp = document.getElementById('purchaseFileInput');
  if (inp) {
    inp.value = '';
    inp.click();
  }
}

function clearAllPurchaseItems() {
  if (parsedPurchaseItems.length === 0) return;
  if (confirm("هل أنت متأكد من مسح وتفريغ كافة الأصناف المستخرجة من هذه الفاتورة؟")) {
    parsedPurchaseItems = [];
    calculateAndRenderPurchaseUI();
    showToast("تم مسح كافة أصناف الفاتورة بنجاح!");
  }
}

// State for OCR Review Modal
let currentOcrReviewItems = [];
let currentOcrImageDataUrl = '';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function processUploadedInvoiceImage(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const status = document.getElementById('scanStatus');
  if (status) {
    status.style.display = 'block';
    status.innerHTML = `⏳ جاري معالجة وقراءة صورة الفاتورة (<b>${escapeHtml(file.name)}</b>) بالذكاء الاصطناعي...`;
  }

  const reader = new FileReader();
  reader.onload = async function(evt) {
    const imageDataUrl = evt.target.result;
    let ocrText = '';

    // Attempt OCR recognition via Tesseract.js
    if (typeof Tesseract !== 'undefined') {
      try {
        const ocrPromise = Tesseract.recognize(
          imageDataUrl,
          'eng+ara',
          {
            logger: m => {
              if (status && m.status === 'recognizing text') {
                const pct = Math.round((m.progress || 0) * 100);
                status.innerHTML = `🔍 جاري التعرف على نصوص الفاتورة (${pct}%)...`;
              }
            }
          }
        );

        // Safety timeout so user is never stuck waiting
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('OCR_TIMEOUT')), 12000));
        const res = await Promise.race([ocrPromise, timeoutPromise]);
        if (res && res.data && res.data.text) {
          ocrText = res.data.text;
        }
      } catch (err) {
        console.warn("Tesseract notice (fallback to interactive review):", err);
      }
    }

    if (status) {
      status.style.display = 'none';
    }

    // Parse extracted text into medicine items
    const extractedRows = parseInvoiceOcrText(ocrText);

    // Open Interactive Review Modal with real image and editable rows
    openInvoiceOcrReviewModal(imageDataUrl, extractedRows, ocrText);
    e.target.value = '';
  };

  reader.onerror = function() {
    if (status) status.style.display = 'none';
    showToast("تعذر قراءة ملف الصورة، يرجى المحاولة بصورة أخرى", "error");
  };

  reader.readAsDataURL(file);
}

function parseInvoiceOcrText(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 2);
  const results = [];

  // 1. Check known medicines from database
  for (const p of db.products) {
    const pNameLower = p.name.toLowerCase();
    const pKeywords = pNameLower.split(/[\s()\-0-9mg]+/).filter(w => w.length >= 3);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = pKeywords.some(kw => line.toLowerCase().includes(kw));
      if (match) {
        // Find numbers around this line
        const combined = line + ' ' + (lines[i + 1] || '');
        const nums = (combined.match(/\d+(\.\d+)?/g) || []).map(n => parseFloat(n)).filter(n => !isNaN(n) && n > 0);
        
        let qty = 10;
        let price = p.officialPrice || 50;
        let disc = p.purchaseDiscountRate || 25;

        const intCandidates = nums.filter(n => Number.isInteger(n) && n >= 1 && n <= 500);
        if (intCandidates.length > 0) qty = intCandidates[0];

        const discCandidates = nums.filter(n => n >= 5 && n <= 45);
        if (discCandidates.length > 0) disc = discCandidates[0];

        const priceCandidates = nums.filter(n => n >= 10 && n <= 2000 && n !== qty && n !== disc);
        if (priceCandidates.length > 0) price = priceCandidates[0];

        if (!results.some(r => r.productName === p.name)) {
          results.push({
            productName: p.name,
            quantity: qty,
            officialPrice: price,
            purchaseDiscountRate: disc,
            saleDiscountRate: Math.max(0, disc - 5)
          });
        }
        break;
      }
    }
  }

  // 2. Extract lines containing medicine-like words and digits
  for (const line of lines) {
    if (/total|صافي|فاتورة|تاريخ|مورد|ضريبة|tax|date|page|صفحة|subtotal|مطلوب/i.test(line)) continue;
    const nums = (line.match(/\d+(\.\d+)?/g) || []).map(n => parseFloat(n)).filter(n => !isNaN(n) && n > 0);
    const hasWord = /[a-zA-Z\u0600-\u06FF]{3,}/.test(line);

    if (hasWord && nums.length >= 1) {
      const cleanName = line.replace(/[\d.,%#$*&()\-+=/\\|]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanName.length >= 3 && !results.some(r => r.productName.toLowerCase().includes(cleanName.toLowerCase()))) {
        let qty = 10;
        let price = 50;
        let disc = 25;

        const intCandidates = nums.filter(n => Number.isInteger(n) && n >= 1 && n <= 500);
        if (intCandidates.length > 0) qty = intCandidates[0];

        const discCandidates = nums.filter(n => n >= 5 && n <= 45);
        if (discCandidates.length > 0) disc = discCandidates[0];

        const priceCandidates = nums.filter(n => n >= 10 && n <= 2000 && n !== qty && n !== disc);
        if (priceCandidates.length > 0) price = priceCandidates[0];

        results.push({
          productName: cleanName,
          quantity: qty,
          officialPrice: price,
          purchaseDiscountRate: disc,
          saleDiscountRate: Math.max(0, disc - 5)
        });
      }
    }
    if (results.length >= 12) break;
  }

  return results;
}

function openInvoiceOcrReviewModal(imageDataUrl, extractedRows, rawOcrText) {
  currentOcrImageDataUrl = imageDataUrl;
  currentOcrReviewItems = extractedRows && extractedRows.length > 0 ? [...extractedRows] : [
    { productName: '', quantity: 10, officialPrice: 50.0, purchaseDiscountRate: 25.0, saleDiscountRate: 20.0 }
  ];

  const count = (extractedRows || []).length;
  const html = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div style="background:#e0f2fe; border:1px solid #bae6fd; border-radius:10px; padding:10px; font-size:12px; color:#0369a1; line-height:1.5;">
        <b>💡 مراجعة وتأكيد بنود الفاتورة:</b>
        ${count > 0 ? 
          `تم التعرف وتحديد <b>(${count})</b> صنف من الصورة. يمكنك مطابقة الأصناف بالصورة أدناه وتعديل أي كمية أو سعر أو خصم، أو إضافة بنود أخرى قبل اعتمادها.` :
          `تم رفع الصورة بنجاح. يمكنك استعراض صورة الفاتورة أدناه وكتابة أو تعديل بنود الأدوية بالجدول مباشرة ثم الضغط على اعتماد.`}
      </div>

      <!-- Image Viewer with toggle zoom -->
      <div style="background:#0f172a; border-radius:12px; overflow:hidden; border:1px solid var(--border); text-align:center;">
        <div style="padding:6px 12px; background:rgba(0,0,0,0.4); color:#fff; font-size:11px; display:flex; justify-content:space-between; align-items:center;">
          <span>📷 صورة الفاتورة المرفوعة</span>
          <span style="font-size:10px; color:#94a3b8; cursor:pointer;" onclick="toggleOcrImageZoom()">🔍 اضغط هنا للتكبير والتصغير</span>
        </div>
        <div id="ocrImgScrollBox" style="max-height:220px; overflow:auto; padding:6px; background:#020617;">
          <img id="ocrPreviewImg" src="${imageDataUrl}" style="max-width:100%; height:auto; object-fit:contain; cursor:zoom-in; border-radius:6px; display:inline-block;" onclick="toggleOcrImageZoom()" title="انقر للتكبير والتصغير" alt="صورة الفاتورة المرفقة" />
        </div>
      </div>

      <!-- Extracted Items Review List -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
          <span style="font-weight:800; font-size:13px; color:var(--text-main);">
            الأصناف المقروءة والمعدة للإضافة:
          </span>
          <button type="button" class="btn btn-outline btn-small" onclick="addOcrReviewRow()" style="border-color:#0284c7; color:#0284c7; font-weight:700; font-size:11px;">
            ➕ إضافة صنف آخر
          </button>
        </div>

        <div id="ocrReviewRowsContainer" style="max-height:270px; overflow-y:auto; padding-right:2px;">
          <!-- Dynamically populated by renderOcrReviewRows() -->
        </div>
      </div>

      <!-- Raw OCR Text (collapsible) -->
      ${rawOcrText ? `
        <details style="font-size:11px; background:#f8fafc; border:1px solid var(--border); border-radius:8px; padding:6px 10px;">
          <summary style="cursor:pointer; font-weight:700; color:var(--text-muted);">
            📜 إظهار النص المقروء بالماسح (OCR Raw Text)
          </summary>
          <pre style="white-space:pre-wrap; word-break:break-all; max-height:100px; overflow-y:auto; font-family:monospace; margin-top:6px; color:#475569; font-size:10px; direction:ltr; text-align:left;">${escapeHtml(rawOcrText)}</pre>
        </details>
      ` : ''}

      <!-- Action Buttons -->
      <div style="display:flex; gap:10px; margin-top:6px;">
        <button type="button" class="btn btn-outline" style="flex:1;" onclick="closeAppModal()">
          إلغاء
        </button>
        <button type="button" class="btn btn-primary" style="flex:2; font-weight:800; font-size:13px;" onclick="confirmOcrReviewedItems()">
          ✅ اعتماد الأصناف وإضافتها للفاتورة
        </button>
      </div>
    </div>
  `;

  openAppModal("مراجعة واعتماد أصناف الفاتورة", html, true);
  renderOcrReviewRows();
}

function toggleOcrImageZoom() {
  const box = document.getElementById('ocrImgScrollBox');
  const img = document.getElementById('ocrPreviewImg');
  if (!box || !img) return;
  if (box.style.maxHeight === 'none') {
    box.style.maxHeight = '220px';
    img.style.cursor = 'zoom-in';
  } else {
    box.style.maxHeight = 'none';
    img.style.cursor = 'zoom-out';
  }
}

function renderOcrReviewRows() {
  const container = document.getElementById('ocrReviewRowsContainer');
  if (!container) return;

  if (currentOcrReviewItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:16px; color:var(--text-muted); background:#f8fafc; border-radius:10px; border:1px dashed var(--border);">
        لا توجد أصناف في الجدول. اضغط على <b>"+ إضافة صنف آخر"</b> لإدخال البنود.
      </div>
    `;
    return;
  }

  container.innerHTML = currentOcrReviewItems.map((item, idx) => {
    const pDisc = parseFloat(item.purchaseDiscountRate) || 0;
    const price = parseFloat(item.officialPrice) || 0;
    const qty = parseFloat(item.quantity) || 1;
    const netCost = price * (1 - (pDisc / 100));
    const lineTotal = qty * netCost;

    return `
      <div style="background:#f8fafc; border:1px solid var(--border); border-radius:10px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; gap:8px;">
          <input type="text" class="input" style="font-weight:700; font-size:13px;" value="${escapeHtml(item.productName)}" placeholder="اسم الدواء أو الصنف" onchange="updateOcrItemField(${idx}, 'productName', this.value)" />
          <button type="button" class="btn btn-outline btn-small" title="حذف هذا الصنف" onclick="deleteOcrReviewRow(${idx})" style="color:#dc2626; border-color:#fca5a5; padding:4px 8px; font-weight:700;">
            🗑️
          </button>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; font-size:11px;">
          <div>
            <label style="color:var(--text-muted); display:block; margin-bottom:2px;">الكمية</label>
            <input type="number" class="input" value="${qty}" min="1" step="1" onchange="updateOcrItemField(${idx}, 'quantity', this.value)" />
          </div>
          <div>
            <label style="color:var(--text-muted); display:block; margin-bottom:2px;">سعر الجمهور</label>
            <input type="number" class="input" value="${price}" min="0" step="0.5" onchange="updateOcrItemField(${idx}, 'officialPrice', this.value)" />
          </div>
          <div>
            <label style="color:var(--text-muted); display:block; margin-bottom:2px;">خصم الشراء %</label>
            <input type="number" class="input" value="${pDisc}" min="0" max="99" step="0.5" onchange="updateOcrItemField(${idx}, 'purchaseDiscountRate', this.value)" />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:11px; color:#0369a1; font-weight:700;">
          <span>تكلفة العلبة: ${netCost.toFixed(2)} ج.م</span>
          <span>الإجمالي: ${lineTotal.toFixed(2)} ج.م</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateOcrItemField(idx, field, val) {
  if (!currentOcrReviewItems[idx]) return;
  if (field === 'quantity' || field === 'officialPrice' || field === 'purchaseDiscountRate') {
    currentOcrReviewItems[idx][field] = parseFloat(val) || 0;
  } else {
    currentOcrReviewItems[idx][field] = val;
  }
  renderOcrReviewRows();
}

function addOcrReviewRow() {
  currentOcrReviewItems.push({
    productName: '',
    quantity: 10,
    officialPrice: 50.0,
    purchaseDiscountRate: 25.0,
    saleDiscountRate: 20.0
  });
  renderOcrReviewRows();
}

function deleteOcrReviewRow(idx) {
  currentOcrReviewItems.splice(idx, 1);
  renderOcrReviewRows();
}

function confirmOcrReviewedItems() {
  const validItems = currentOcrReviewItems
    .map(it => ({
      productName: (it.productName || '').trim(),
      quantity: parseFloat(it.quantity) || 1,
      officialPrice: parseFloat(it.officialPrice) || 0,
      purchaseDiscountRate: parseFloat(it.purchaseDiscountRate) || 0,
      saleDiscountRate: Math.max(0, (parseFloat(it.purchaseDiscountRate) || 0) - 5)
    }))
    .filter(it => it.productName.length > 0 && it.officialPrice > 0);

  if (validItems.length === 0) {
    alert("يرجى التأكد من كتابة اسم الصنف وسعر الجمهور لصنف واحد على الأقل قبل الاعتماد!");
    return;
  }

  validItems.forEach(v => {
    const existingIdx = parsedPurchaseItems.findIndex(p => p.productName.trim().toLowerCase() === v.productName.toLowerCase());
    if (existingIdx >= 0) {
      parsedPurchaseItems[existingIdx].quantity += v.quantity;
      parsedPurchaseItems[existingIdx].officialPrice = v.officialPrice;
      parsedPurchaseItems[existingIdx].purchaseDiscountRate = v.purchaseDiscountRate;
    } else {
      parsedPurchaseItems.push(v);
    }
  });

  closeAppModal();
  calculateAndRenderPurchaseUI();
  showToast(`تم اعتماد وإضافة ${validItems.length} صنف إلى الفاتورة بنجاح!`);
}

function simulateCameraScan() {
  triggerCameraCapture();
}

function handleImageUpload(e) {
  processUploadedInvoiceImage(e);
}

function removePurchaseItem(idx) {
  parsedPurchaseItems.splice(idx, 1);
  calculateAndRenderPurchaseUI();
  showToast("تم مسح الصنف من الفاتورة!");
}

function openAddMedicineModal() {
  const formHtml = `
    <form onsubmit="handleAddMedicineSubmit(event)">
      <div class="form-group">
        <label>اسم الدواء / الصنف *</label>
        <input class="input" id="newMedName" placeholder="مثال: ألفينترن 30 قرص" required />
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>سعر الجمهور الرسمي (ثابت) *</label>
          <input class="input" type="number" step="0.5" id="newMedOfficialPrice" placeholder="مثال: 54.0" required />
        </div>
        <div class="form-group">
          <label>الكمية المشتراة (علب) *</label>
          <input class="input" type="number" id="newMedQty" value="10" required />
        </div>
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>خصم الشراء من المورد % *</label>
          <input class="input" type="number" step="0.5" id="newMedPurchaseDisc" value="25" required />
        </div>
        <div class="form-group">
          <label>خصم البيع للعميل % *</label>
          <input class="input" type="number" step="0.5" id="newMedSaleDisc" value="20" required />
        </div>
      </div>

      <button type="submit" class="btn btn-primary" style="margin-top:10px;">إضافة الدواء للفاتورة</button>
    </form>
  `;
  openAppModal("تسجيل صنف دواء في الفاتورة", formHtml);
}

function handleAddMedicineSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newMedName').value.trim();
  const officialPrice = parseFloat(document.getElementById('newMedOfficialPrice').value) || 0;
  const qty = parseFloat(document.getElementById('newMedQty').value) || 1;
  const pDisc = parseFloat(document.getElementById('newMedPurchaseDisc').value) || 0;
  const sDisc = parseFloat(document.getElementById('newMedSaleDisc').value) || 0;

  parsedPurchaseItems.push({
    productName: name,
    quantity: qty,
    officialPrice: officialPrice,
    purchaseDiscountRate: pDisc,
    saleDiscountRate: sDisc
  });

  closeAppModal();
  calculateAndRenderPurchaseUI();
  showToast("تمت إضافة الدواء بنجاح!");
}

function savePurchaseInvoice() {
  if (parsedPurchaseItems.length === 0) {
    showToast("يرجى إضافة دواء واحد على الأقل للفاتورة!", "error");
    return;
  }

  const invoiceNo = document.getElementById('purInvoiceNo').value || `PUR-${Date.now() % 100000}`;
  const supplier = document.getElementById('purSupplierName').value || "شركة توزيع أدوية";

  const totalBefore = parsedPurchaseItems.reduce((acc, item) => acc + (item.quantity * item.officialPrice), 0);
  const totalDisc = parsedPurchaseItems.reduce((acc, item) => acc + ((item.quantity * item.officialPrice) * (item.purchaseDiscountRate / 100)), 0);
  const netGrandTotal = totalBefore - totalDisc;

  parsedPurchaseItems.forEach(item => {
    let existing = db.products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
    let prevStock = 0;
    let newStock = item.quantity;
    let pId = Date.now() + Math.floor(Math.random() * 1000);

    if (existing) {
      prevStock = existing.stockQuantity;
      newStock = prevStock + item.quantity;
      pId = existing.id;

      if (existing.purchaseDiscountRate > 0 && existing.purchaseDiscountRate !== item.purchaseDiscountRate) {
        db.discountAlerts.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          productId: pId,
          productName: item.productName,
          oldDiscount: existing.purchaseDiscountRate,
          newDiscount: item.purchaseDiscountRate,
          diff: item.purchaseDiscountRate - existing.purchaseDiscountRate,
          supplierName: supplier,
          invoiceNumber: invoiceNo,
          timestamp: Date.now()
        });
      }

      existing.stockQuantity = newStock;
      existing.officialPrice = item.officialPrice;
      existing.lastPurchaseDiscountRate = existing.purchaseDiscountRate;
      existing.purchaseDiscountRate = item.purchaseDiscountRate;
      existing.saleDiscountRate = item.saleDiscountRate;
    } else {
      db.products.push({
        id: pId,
        name: item.productName,
        sku: `MED-${Math.floor(1000 + Math.random() * 9000)}`,
        stockQuantity: newStock,
        officialPrice: item.officialPrice,
        purchaseDiscountRate: item.purchaseDiscountRate,
        lastPurchaseDiscountRate: item.purchaseDiscountRate,
        saleDiscountRate: item.saleDiscountRate,
        unit: "علبة"
      });
    }

    db.movements.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      productId: pId,
      productName: item.productName,
      movementType: "PURCHASE_IN",
      quantity: item.quantity,
      previousStock: prevStock,
      newStock: newStock,
      referenceInvoiceNumber: invoiceNo,
      timestamp: Date.now()
    });
  });

  db.purchaseInvoices.unshift({
    id: Date.now(),
    invoiceNumber: invoiceNo,
    supplierName: supplier,
    date: Date.now(),
    totalAmount: totalBefore,
    totalDiscount: totalDisc,
    netAmount: netGrandTotal,
    itemsCount: parsedPurchaseItems.length,
    items: [...parsedPurchaseItems]
  });

  saveDB();
  parsedPurchaseItems = [];
  showToast("تم حفظ فاتورة الشراء وتحديث أرصدة الأدوية بنجاح!");
  navigateTo('inventory');
}

// -------------------------------------------------------------
// 3. SUPPLIER INVOICES & DISCOUNT CHANGE ANALYTICS
// -------------------------------------------------------------
function renderPurchaseHistoryScreen() {
  topBarTitle.innerText = "سجل الموردين وفواتير الشراء";
  topBarSubtitle.innerText = "فواتير الشراء من شركات التوزيع ومراقبة الخصومات";

  screenContainer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary btn-small" onclick="navigateTo('discount_alerts')">
          ⚠️ تحليلات وتنبيهات الخصم (${db.discountAlerts.length})
        </button>
      </div>
      <button class="btn btn-outline btn-small" onclick="openAddSupplierModal()" style="border-color:#0284c7; color:#0284c7; font-weight:700;">
        🏢 + تسجيل شركة توزيع / مورد جديد
      </button>
    </div>

    <!-- Suppliers List Section -->
    <div style="margin-top:10px;">
      <div style="font-weight:800; font-size:15px; color:#0369a1; margin-bottom:8px;">
        🏢 شركات التوزيع والموردين المسجلين (${db.suppliers.length})
      </div>
      <div class="inventory-grid">
        ${db.suppliers.map(s => `
          <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; font-size:14px; color:#0f172a;">${s.name}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                ${s.phone ? `📱 هاتف: ${s.phone}` : ''} ${s.repName ? ` | 👤 المندوب: ${s.repName}` : ''}
              </div>
            </div>
            <div>
              <button class="btn btn-outline btn-small" title="حذف المورد نهائياً" style="color:#dc2626; border-color:#fca5a5; padding:5px 10px; font-weight:700;" onclick="confirmDeleteSupplier(${s.id})">
                🗑️ حذف
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Purchase Invoices Section -->
    <div style="margin-top:16px;">
      <div style="font-weight:800; font-size:15px; color:var(--text-main); margin-bottom:8px;">
        📥 فواتير الشراء المسجلة من الموردين (${db.purchaseInvoices.length})
      </div>
      <div class="inventory-grid">
        ${db.purchaseInvoices.length === 0 ? '<div class="card" style="text-align:center; color:var(--text-muted); grid-column:1/-1;">لا توجد فواتير شراء مسجلة حتى الآن</div>' : ''}
        ${db.purchaseInvoices.map(inv => `
          <div class="card" style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; cursor:pointer;" onclick="openPurchaseInvoiceDetail(${inv.id})">
              <div>
                <div style="font-weight:800; font-size:14px; color:#0369a1;">📄 ${escapeHtml(inv.invoiceNumber)}</div>
                <div style="font-size:12px; font-weight:700; margin-top:2px;">🏢 ${escapeHtml(inv.supplierName)}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                  📅 ${new Date(inv.date).toLocaleDateString('ar-EG')} | 💊 ${(inv.items || []).length || (inv.itemsCount || 0)} صنف
                </div>
              </div>
              <div style="text-align:left;">
                <span style="font-size:11px; color:var(--text-muted); display:block;">صافي الفاتورة</span>
                <span style="font-weight:800; color:#0284c7; font-size:15px;">${(inv.netAmount || 0).toFixed(2)} ج.م</span>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px dashed var(--border); padding-top:8px;">
              <button class="btn btn-outline btn-small" onclick="openPurchaseInvoiceDetail(${inv.id})" style="padding:4px 10px; font-size:11px;">
                👁️ عرض التفاصيل
              </button>
              <button class="btn btn-outline btn-small" title="حذف الفاتورة وأصنافها نهائياً" onclick="event.stopPropagation(); confirmDeletePurchaseInvoice(${inv.id})" style="color:#dc2626; border-color:#fca5a5; padding:4px 10px; font-size:11px; font-weight:700;">
                🗑️ حذف الفاتورة
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openPurchaseInvoiceDetail(invId) {
  const inv = db.purchaseInvoices.find(i => i.id === invId);
  if (!inv) return;

  const html = `
    <div>
      <div style="padding:10px; background:#e0f2fe; border-radius:10px; margin-bottom:12px;">
        <div style="font-weight:800; color:#0369a1;">رقم الفاتورة: ${escapeHtml(inv.invoiceNumber)}</div>
        <div style="font-size:12px; color:var(--text-muted);">المورد: ${escapeHtml(inv.supplierName)} | التاريخ: ${new Date(inv.date).toLocaleDateString('ar-EG')}</div>
      </div>

      <div style="font-size:12px; font-weight:700; margin-bottom:8px;">الأدوية الواردة بالفاتورة:</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${(inv.items || []).map(it => `
          <div style="padding:8px 10px; background:#f8fafc; border-radius:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; font-size:13px;">${escapeHtml(it.productName)}</div>
              <div style="font-size:11px; color:var(--text-muted);">
                ${it.quantity} علبة | سعر الجمهور: ${it.officialPrice} ج.م | الخصم: ${it.purchaseDiscountRate}%
              </div>
            </div>
            <div style="font-weight:800; color:#0284c7;">
              ${((it.quantity * it.officialPrice) * (1 - (it.purchaseDiscountRate / 100))).toFixed(2)} ج.م
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:14px; padding-top:10px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; font-weight:800; font-size:15px; margin-bottom:14px;">
        <span>الصافي المدفوع:</span>
        <span style="color:#0284c7;">${(inv.netAmount || 0).toFixed(2)} ج.م</span>
      </div>

      <div style="display:flex; gap:10px; border-top:1px solid var(--border); padding-top:12px;">
        <button class="btn btn-outline" style="flex:1;" onclick="closeAppModal()">إغلاق</button>
        <button class="btn btn-danger" style="flex:1; font-size:12px; font-weight:700;" onclick="confirmDeletePurchaseInvoice(${inv.id})">
          🗑️ حذف الفاتورة وأصنافها نهائياً
        </button>
      </div>
    </div>
  `;
  openAppModal("تفاصيل فاتورة شراء المورد", html);
}

function confirmDeletePurchaseInvoice(invId) {
  const inv = db.purchaseInvoices.find(i => i.id === invId);
  if (!inv) return;

  const itemsListHtml = (inv.items || []).map(it => `
    <li style="margin-bottom:4px;">
      <b>${escapeHtml(it.productName)}</b>: ${it.quantity} علبة (سعر الجمهور: ${it.officialPrice} ج.م - خصم الشراء: ${it.purchaseDiscountRate}%)
    </li>
  `).join('');

  const html = `
    <div style="text-align:right; padding:6px 0;">
      <div style="text-align:center; font-size:42px; margin-bottom:8px;">🗑️</div>
      <h3 style="text-align:center; font-size:16px; font-weight:800; color:#dc2626; margin-bottom:10px;">
        تأكيد حذف فاتورة الشراء وأصنافها
      </h3>
      <p style="font-size:13px; color:var(--text-main); margin-bottom:12px; line-height:1.6;">
        هل أنت متأكد من رغبتك في حذف فاتورة الشراء رقم <b>«${escapeHtml(inv.invoiceNumber)}»</b> الخاصة بالمورد <b>«${escapeHtml(inv.supplierName)}»</b> بقيمة <b>${(inv.netAmount || 0).toFixed(2)} ج.م</b>؟
      </p>

      <div style="background:#fee2e2; border:1px solid #fecaca; border-radius:10px; padding:12px; font-size:12px; color:#991b1b; margin-bottom:14px;">
        <div style="font-weight:800; margin-bottom:6px;">⚠️ الأصناف الواردة في هذه الفاتورة (${(inv.items || []).length}):</div>
        <ul style="padding-right:18px; line-height:1.6; max-height:130px; overflow-y:auto;">
          ${itemsListHtml || '<li>لا توجد أصناف مدرجة</li>'}
        </ul>
      </div>

      <div style="background:#f1f5f9; border-radius:8px; padding:10px 12px; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
        <input type="checkbox" id="revertStockOnDelete" checked style="width:18px; height:18px; cursor:pointer;" />
        <label for="revertStockOnDelete" style="font-size:12px; font-weight:700; color:#334155; cursor:pointer;">
          خصم واسترجاع كميات هذه الأصناف من رصيد المخزون الحالي تلقائياً
        </label>
      </div>

      <div style="display:flex; gap:10px;">
        <button class="btn btn-outline" style="flex:1;" onclick="closeAppModal()">إلغاء</button>
        <button class="btn btn-danger" style="flex:1; font-weight:800;" onclick="executeDeletePurchaseInvoice(${inv.id})">
          نعم، حذف الفاتورة نهائياً
        </button>
      </div>
    </div>
  `;
  openAppModal("حذف فاتورة شراء", html);
}

function executeDeletePurchaseInvoice(invId) {
  const invIndex = db.purchaseInvoices.findIndex(i => i.id === invId);
  if (invIndex === -1) {
    closeAppModal();
    return;
  }

  const inv = db.purchaseInvoices[invIndex];
  const revertCheckbox = document.getElementById('revertStockOnDelete');
  const shouldRevert = revertCheckbox ? revertCheckbox.checked : true;

  if (shouldRevert && Array.isArray(inv.items)) {
    inv.items.forEach(item => {
      const prod = db.products.find(p => 
        (p.name && item.productName && p.name.trim().toLowerCase() === item.productName.trim().toLowerCase()) || 
        (p.id && item.productId && p.id === item.productId)
      );
      if (prod) {
        const oldQty = prod.stockQuantity || 0;
        const newQty = Math.max(0, oldQty - (item.quantity || 0));
        prod.stockQuantity = newQty;

        if (Array.isArray(db.movements)) {
          db.movements.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            productId: prod.id,
            productName: prod.name,
            movementType: "PURCHASE_CANCEL",
            quantity: -(item.quantity || 0),
            previousStock: oldQty,
            newStock: newQty,
            referenceInvoiceNumber: inv.invoiceNumber,
            timestamp: Date.now()
          });
        }
      }
    });
  }

  // Remove discount alerts associated with this invoice
  if (Array.isArray(db.discountAlerts)) {
    db.discountAlerts = db.discountAlerts.filter(a => a.invoiceNumber !== inv.invoiceNumber);
  }

  // Remove invoice
  db.purchaseInvoices.splice(invIndex, 1);

  // Sync to Cloud Server and localStorage
  saveDB();

  closeAppModal();
  renderPurchaseHistoryScreen();
  showToast(`تم حذف فاتورة الشراء (${inv.invoiceNumber}) وأصنافها بنجاح ومزامنة السحابة!`);
}

function renderDiscountAlertsScreen() {
  topBarTitle.innerText = "تحليلات وتنبيهات تغير الخصم";
  topBarSubtitle.innerText = "رصد أي اختلاف في نسب خصم الأدوية بين الفواتير";

  screenContainer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:800; font-size:13px;">تنبيهات تغير الخصم من الموردين (${db.discountAlerts.length})</span>
      <button class="btn btn-outline btn-small" onclick="navigateTo('purchase')">
        + إضافة فاتورة شراء
      </button>
    </div>

    ${db.discountAlerts.length === 0 ? `
      <div class="card" style="text-align:center; padding:30px; color:var(--text-muted);">
        ✅ لم يتم رصد أي تغير في نسب خصم الأدوية حتى الآن.
      </div>
    ` : `
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${db.discountAlerts.map(alert => `
          <div class="card" style="border-right: 5px solid ${alert.diff < 0 ? 'var(--danger)' : 'var(--secondary)'}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div style="font-weight:800; font-size:14px;">${alert.productName}</div>
                <div style="font-size:11px; color:var(--text-muted);">المورد: ${alert.supplierName} | فاتورة: ${alert.invoiceNumber}</div>
              </div>
              <span class="badge ${alert.diff < 0 ? 'badge-red' : 'badge-green'}" style="font-size:12px;">
                ${alert.diff < 0 ? `انخفاض (${alert.diff}%)` : `زيادة (+${alert.diff}%)`}
              </span>
            </div>

            <div style="margin-top:8px; padding:8px; background:#f8fafc; border-radius:8px; font-size:12px; display:flex; justify-content:space-around;">
              <div>الخصم السابق: <b>${alert.oldDiscount}%</b></div>
              <div style="color:var(--text-muted);">➔</div>
              <div>الخصم الجديد: <b style="color:${alert.diff < 0 ? 'var(--danger)' : 'var(--secondary)'}">${alert.newDiscount}%</b></div>
            </div>

            <div style="font-size:11px; color:var(--text-muted); margin-top:6px; text-align:left;">
              التاريخ: ${new Date(alert.timestamp).toLocaleDateString('ar-EG')}
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

// -------------------------------------------------------------
// 4. SALES INVOICE SCREEN (العملاء وواتساب)
// -------------------------------------------------------------
let selectedSalesProduct = null;

function renderSalesScreen() {
  topBarTitle.innerText = "إصدار فاتورة بيع أدوية";
  topBarSubtitle.innerText = "سعر الجمهور ثابت وخصم البيع يحدد السعر الصافي";

  calculateAndRenderSalesUI();
}

function calculateAndRenderSalesUI() {
  const subtotalOfficial = currentSalesItems.reduce((acc, it) => acc + (it.quantity * it.officialPrice), 0);
  const totalDiscAmount = currentSalesItems.reduce((acc, it) => acc + ((it.quantity * it.officialPrice) * (it.saleDiscountRate / 100)), 0);
  const grandTotal = currentSalesItems.reduce((acc, it) => acc + it.lineTotal, 0);

  screenContainer.innerHTML = `
    <!-- Header: Invoice No & Customer Selection -->
    <div class="card">
      <div class="row-2">
        <div class="form-group">
          <label>رقم الفاتورة</label>
          <input class="input" id="saleInvoiceNo" value="SAL-${Math.floor(10000 + Math.random() * 90000)}" readonly />
        </div>
        <div class="form-group">
          <label>العميل</label>
          <div style="display:flex; gap:6px;">
            <select class="input" id="saleCustomerSelect">
              ${db.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
            <button class="btn btn-outline btn-small" title="إضافة عميل" onclick="openAddCustomerModal()">+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Medicine Item Picker -->
    <div class="card" style="border:1.5px solid #38bdf8; background:#f0f9ff;">
      <div style="font-weight:800; font-size:13px; color:#0369a1; margin-bottom:8px;">
        اختيار صنف الدواء من القائمة
      </div>

      <div class="form-group">
        <label>اختر الدواء من المخزون:</label>
        <select class="input" id="medicinePicker" onchange="onMedicineSelected(this.value)">
          <option value="">-- اضغط لاختيار الدواء من المخزون --</option>
          ${db.products.map(p => `
            <option value="${p.id}" ${selectedSalesProduct && selectedSalesProduct.id === p.id ? 'selected' : ''}>
              ${p.name} (المتاح: ${p.stockQuantity} علبة | سعر الجمهور: ${p.officialPrice} ج.م)
            </option>
          `).join('')}
        </select>
      </div>

      ${selectedSalesProduct ? `
        <div style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:12px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:12px; color:var(--text-muted);">الرصيد المتاح بالمخزن:</span>
            <span class="badge ${selectedSalesProduct.stockQuantity <= 5 ? 'badge-red' : 'badge-green'}">
              ${selectedSalesProduct.stockQuantity} علبة
            </span>
          </div>

          <div class="row-2">
            <div class="form-group">
              <label>سعر الجمهور الرسمي (ثابت)</label>
              <input class="input" type="number" id="medOfficialPrice" value="${selectedSalesProduct.officialPrice}" readonly style="background:#f1f5f9; font-weight:700;" />
            </div>
            <div class="form-group">
              <label>الخصم الخاص بالبيع %</label>
              <input class="input" type="number" step="0.5" id="medSaleDiscount" value="${selectedSalesProduct.saleDiscountRate}" oninput="recalcCurrentMedicineLineTotal()" />
            </div>
          </div>

          <div class="row-2">
            <div class="form-group">
              <label>الكمية المراد بيعها (علب)</label>
              <input class="input" type="number" id="medQuantity" value="1" min="1" max="${selectedSalesProduct.stockQuantity}" oninput="recalcCurrentMedicineLineTotal()" />
            </div>
            <div class="form-group">
              <label>الإجمالي بعد خصم البيع</label>
              <div id="medLiveTotal" style="padding:10px; background:#dcfce7; color:#15803d; font-weight:800; border-radius:10px; text-align:center; font-size:15px;">
                ${((selectedSalesProduct.officialPrice * 1) * (1 - (selectedSalesProduct.saleDiscountRate / 100))).toFixed(2)} ج.م
              </div>
            </div>
          </div>

          <button class="btn btn-primary" style="margin-top:6px; font-size:13px;" onclick="addItemToSalesInvoice()">
            ➕ إضافة الدواء للفاتورة
          </button>
        </div>
      ` : ''}
    </div>

    <!-- Current Items in Invoice -->
    <div class="card">
      <div style="font-weight:800; font-size:13px; margin-bottom:8px;">
        بنود الفاتورة (${currentSalesItems.length})
      </div>

      ${currentSalesItems.length === 0 ? `
        <div style="text-align:center; padding:18px 0; color:var(--text-muted); font-size:12px;">
          لم يتم إضافة أدوية بعد. اختر دواء من القائمة أعلاه.
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${currentSalesItems.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:#f8fafc; border-radius:8px; border:1px solid var(--border);">
              <div>
                <div style="font-weight:800; font-size:13px;">${item.productName}</div>
                <div style="font-size:11px; color:var(--text-muted);">
                  ${item.quantity} علبة × ${item.officialPrice} ج.م (خصم: ${item.saleDiscountRate}%) | الصافي للعلبة: ${item.netUnitPrice.toFixed(2)} ج.م
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:var(--secondary); font-size:13px;">${item.lineTotal.toFixed(2)} ج.م</span>
                <button onclick="removeSaleItem(${idx})" style="background:none; border:none; color:var(--danger); cursor:pointer; font-weight:800;">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <!-- Grand Total Summary -->
      ${currentSalesItems.length > 0 ? `
        <div style="margin-top:14px; padding-top:10px; border-top:1px dashed var(--border); font-size:12px; display:flex; flex-direction:column; gap:4px;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">إجمالي سعر الجمهور:</span>
            <span>${subtotalOfficial.toFixed(2)} ج.م</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:var(--danger);">
            <span>إجمالي خصومات البيع للعميل:</span>
            <span>-${totalDiscAmount.toFixed(2)} ج.م</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:800; font-size:17px; color:var(--secondary); margin-top:6px;">
            <span>الإجمالي العام للفاتورة:</span>
            <span>${grandTotal.toFixed(2)} ج.م</span>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- WhatsApp Share and Confirm Buttons -->
    <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
      <button class="btn btn-whatsapp" onclick="shareCurrentInvoiceViaWhatsApp()" ${currentSalesItems.length === 0 ? 'disabled style="opacity:0.5;"' : ''}>
        📲 إرسال الفاتورة للعميل عبر واتساب (WhatsApp)
      </button>

      <button class="btn btn-success" style="height:50px; font-size:15px;" onclick="confirmSalesInvoice()" ${currentSalesItems.length === 0 ? 'disabled style="opacity:0.5;"' : ''}>
        ✅ تأكيد الفاتورة وخصم المخزون
      </button>
    </div>
  `;
}

function onMedicineSelected(productId) {
  if (!productId) {
    selectedSalesProduct = null;
  } else {
    selectedSalesProduct = db.products.find(p => p.id == productId) || null;
  }
  calculateAndRenderSalesUI();
}

function recalcCurrentMedicineLineTotal() {
  if (!selectedSalesProduct) return;
  const qty = parseFloat(document.getElementById('medQuantity').value) || 0;
  const officialPrice = selectedSalesProduct.officialPrice;
  const disc = parseFloat(document.getElementById('medSaleDiscount').value) || 0;

  const netPrice = officialPrice * (1 - (disc / 100));
  const total = qty * netPrice;
  const el = document.getElementById('medLiveTotal');
  if (el) el.innerText = `${total.toFixed(2)} ج.م`;
}

function addItemToSalesInvoice() {
  if (!selectedSalesProduct) {
    showToast("يرجى اختيار دواء من القائمة أولاً!", "error");
    return;
  }

  const qty = parseFloat(document.getElementById('medQuantity').value) || 0;
  const officialPrice = selectedSalesProduct.officialPrice;
  const disc = parseFloat(document.getElementById('medSaleDiscount').value) || 0;

  if (qty <= 0) {
    showToast("يرجى إدخال كمية صحيحة أكبر من الصفر!", "error");
    return;
  }

  const alreadyInInvoice = currentSalesItems
    .filter(i => i.productId === selectedSalesProduct.id)
    .reduce((acc, it) => acc + it.quantity, 0);

  if (alreadyInInvoice + qty > selectedSalesProduct.stockQuantity) {
    showToast(`الكمية المطلوبة تتجاوز رصيد المخزن المتاح (${selectedSalesProduct.stockQuantity} علبة)!`, "error");
    return;
  }

  const netUnitPrice = officialPrice * (1 - (disc / 100));
  const lineTotal = qty * netUnitPrice;

  currentSalesItems.push({
    productId: selectedSalesProduct.id,
    productName: selectedSalesProduct.name,
    officialPrice: officialPrice,
    saleDiscountRate: disc,
    quantity: qty,
    netUnitPrice: netUnitPrice,
    lineTotal: lineTotal
  });

  selectedSalesProduct = null;
  calculateAndRenderSalesUI();
  showToast("تمت إضافة الدواء للفاتورة بنجاح!");
}

function removeSaleItem(idx) {
  currentSalesItems.splice(idx, 1);
  calculateAndRenderSalesUI();
}

function generateWhatsAppText(invoiceNo, customerName, items, grandTotal) {
  let text = `*فاتورة بيع أدوية - مدير مبيعات الأدويه*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📄 *رقم الفاتورة:* ${invoiceNo}\n`;
  text += `👤 *العميل:* ${customerName}\n`;
  text += `📅 *التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `*بنود الأدوية:*\n`;

  items.forEach((it, i) => {
    text += `${i + 1}. *${it.productName}*\n`;
    text += `   • الكمية: ${it.quantity} علبة\n`;
    text += `   • سعر الجمهور: ${it.officialPrice} ج.م | الخصم: ${it.saleDiscountRate}%\n`;
    text += `   • صافي العلبة: ${it.netUnitPrice.toFixed(2)} ج.م\n`;
    text += `   • الإجمالي: *${it.lineTotal.toFixed(2)} ج.م*\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *الإجمالي العام للفاتورة: ${grandTotal.toFixed(2)} ج.م*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `شكراً لتعاملكم معنا!`;

  return text;
}

function shareCurrentInvoiceViaWhatsApp() {
  if (currentSalesItems.length === 0) {
    showToast("يرجى إضافة أدوية للفاتورة أولاً!", "error");
    return;
  }

  const invoiceNo = document.getElementById('saleInvoiceNo').value || `SAL-${Date.now() % 100000}`;
  const custId = parseInt(document.getElementById('saleCustomerSelect').value) || 1;
  const customer = db.customers.find(c => c.id === custId) || { name: "عميل عام", phone: "" };
  const grandTotal = currentSalesItems.reduce((acc, it) => acc + it.lineTotal, 0);

  const text = generateWhatsAppText(invoiceNo, customer.name, currentSalesItems, grandTotal);
  const encodedText = encodeURIComponent(text);

  let whatsappUrl = `https://wa.me/?text=${encodedText}`;
  if (customer.phone && customer.phone.length >= 10) {
    const cleanPhone = customer.phone.replace(/^0/, '20');
    whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  window.open(whatsappUrl, '_blank');
  showToast("تم فتح واتساب لمشاركة الفاتورة!");
}

function confirmSalesInvoice() {
  if (currentSalesItems.length === 0) {
    showToast("يرجى إضافة دواء واحد على الأقل للفاتورة!", "error");
    return;
  }

  const invoiceNo = document.getElementById('saleInvoiceNo').value || `SAL-${Date.now() % 100000}`;
  const custId = parseInt(document.getElementById('saleCustomerSelect').value) || 1;
  const customer = db.customers.find(c => c.id === custId) || { name: "عميل عام" };
  const grandTotal = currentSalesItems.reduce((acc, it) => acc + it.lineTotal, 0);

  currentSalesItems.forEach(item => {
    const product = db.products.find(p => p.id === item.productId);
    if (product) {
      const prevStock = product.stockQuantity;
      const newStock = prevStock - item.quantity;
      product.stockQuantity = newStock;

      db.movements.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        productId: product.id,
        productName: product.name,
        movementType: "SALE_OUT",
        quantity: -item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        referenceInvoiceNumber: invoiceNo,
        timestamp: Date.now()
      });
    }
  });

  if (customer.totalPurchases !== undefined) {
    customer.totalPurchases += grandTotal;
  }

  db.salesInvoices.unshift({
    id: Date.now(),
    invoiceNumber: invoiceNo,
    customerId: custId,
    customerName: customer.name,
    customerPhone: customer.phone || "",
    date: Date.now(),
    grandTotal: grandTotal,
    items: [...currentSalesItems]
  });

  saveDB();
  currentSalesItems = [];
  showToast("تم إصدار فاتورة البيع وخصم المخزون بنجاح!");
  navigateTo('inventory');
}

// -------------------------------------------------------------
// 5. INVENTORY & MANUAL STOCK ADJUSTMENT
// -------------------------------------------------------------
let inventorySearchQuery = "";
let showOnlyLowStock = false;

function renderInventoryScreen() {
  topBarTitle.innerText = "أرصدة الأدوية والمخزون";
  topBarSubtitle.innerText = "سعر الجمهور الرسمي والخصومات مع زر تعديل الجرد";

  let filtered = db.products.filter(p => {
    const matchQuery = p.name.includes(inventorySearchQuery) || (p.sku && p.sku.includes(inventorySearchQuery));
    const matchLow = showOnlyLowStock ? p.stockQuantity <= 5 : true;
    return matchQuery && matchLow;
  });

  const totalStockQty = db.products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const totalStockCostVal = db.products.reduce((acc, p) => {
    const netCost = (p.officialPrice || 0) * (1 - (p.purchaseDiscountRate || 0) / 100);
    return acc + ((p.stockQuantity || 0) * netCost);
  }, 0);
  const totalStockPublicVal = db.products.reduce((acc, p) => acc + ((p.stockQuantity || 0) * (p.officialPrice || 0)), 0);

  screenContainer.innerHTML = `
    <!-- Total Inventory Valuation KPI Cards -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-bottom:10px;">
      <div class="card" style="background:#f0fdf4; border-color:#bbf7d0; padding:10px; text-align:center;">
        <span style="font-size:11px; color:#166534; display:block; font-weight:700;">📦 إجمالي رصيد المخزن</span>
        <b style="font-size:16px; color:#15803d; font-weight:800;">${totalStockQty} علبة</b>
      </div>
      <div class="card" style="background:#e0f2fe; border-color:#bae6fd; padding:10px; text-align:center;">
        <span style="font-size:11px; color:#0369a1; display:block; font-weight:700;">💰 رأس مال البضاعة (شراء)</span>
        <b style="font-size:15px; color:#0284c7; font-weight:800;">${totalStockCostVal.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</b>
      </div>
      <div class="card" style="background:#fef3c7; border-color:#fde68a; padding:10px; text-align:center;">
        <span style="font-size:11px; color:#92400e; display:block; font-weight:700;">🏷️ قيمة البضاعة (جمهور)</span>
        <b style="font-size:15px; color:#b45309; font-weight:800;">${totalStockPublicVal.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</b>
      </div>
    </div>

    <!-- Search Bar & Filters -->
    <div class="card" style="padding:10px;">
      <input class="input" placeholder="🔍 بحث باسم الدواء..." value="${inventorySearchQuery}" oninput="inventorySearchQuery=this.value; renderInventoryScreen();" />
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; gap:8px;">
          <button class="btn ${!showOnlyLowStock ? 'btn-primary' : 'btn-outline'}" style="font-size:11px; padding:6px 12px; width:auto;" onclick="showOnlyLowStock=false; renderInventoryScreen();">
            جميع الأدوية (${db.products.length})
          </button>
          <button class="btn ${showOnlyLowStock ? 'btn-danger' : 'btn-outline'}" style="font-size:11px; padding:6px 12px; width:auto;" onclick="showOnlyLowStock=true; renderInventoryScreen();">
            النواقص (أقل من 5)
          </button>
        </div>
        <button class="btn btn-primary btn-small" onclick="openAddNewProductModal()">
          💊 + إضافة صنف دواء جديد
        </button>
      </div>
    </div>

    <!-- Medicines List with Quick Adjust & Delete Buttons -->
    <div class="inventory-grid">
      ${filtered.map(p => {
        const netPurchasePrice = (p.officialPrice || 0) * (1 - (p.purchaseDiscountRate || 0) / 100);
        const totalItemCost = (p.stockQuantity || 0) * netPurchasePrice;
        const totalItemPublic = (p.stockQuantity || 0) * (p.officialPrice || 0);

        return `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-weight:800; font-size:14px;">${p.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">${p.sku}</div>
            </div>

            <div style="display:flex; align-items:center; gap:6px;">
              <span class="badge ${p.stockQuantity <= 5 ? 'badge-red' : 'badge-green'}" style="font-size:13px; padding:4px 8px;">
                ${p.stockQuantity} ${p.unit}
              </span>
              <button class="btn btn-outline btn-small" title="تعديل الرصيد يدوياً" style="padding:4px 8px; font-weight:700; color:#0369a1; border-color:#38bdf8;" onclick="openAdjustStockModal(${p.id})">
                ✏️ تعديل
              </button>
              <button class="btn btn-outline btn-small" title="حذف الصنف نهائياً" style="padding:4px 8px; font-weight:700; color:#dc2626; border-color:#fca5a5;" onclick="confirmDeleteProduct(${p.id})">
                🗑️ حذف
              </button>
            </div>
          </div>

          <div class="row-2" style="margin-top:8px; padding-top:6px; border-top:1px solid var(--border); font-size:11px; color:var(--text-muted);">
            <div>سعر الجمهور الرسمي: <b style="color:#000;">${p.officialPrice} ج.م</b></div>
            <div>صافي سعر الشراء: <b>${netPurchasePrice.toFixed(2)} ج.م</b></div>
          </div>
          <div class="row-2" style="font-size:11px; color:var(--text-muted); margin-top:2px;">
            <div>خصم الشراء: <b style="color:#0284c7;">${p.purchaseDiscountRate}%</b></div>
            <div>خصم البيع: <b style="color:var(--warning);">${p.saleDiscountRate}%</b> (صافي: ${(p.officialPrice * (1 - p.saleDiscountRate/100)).toFixed(2)} ج.م)</div>
          </div>

          <!-- Stock Valuation Section for this specific item -->
          <div style="margin-top:8px; padding:8px 10px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
            <div>
              <span style="font-size:11px; color:#1e40af; font-weight:700; display:block;">💰 إجمالي قيمة رصيد البضاعة (شراء):</span>
              <b style="font-size:14px; color:#0284c7; font-weight:800;">${totalItemCost.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</b>
            </div>
            <div style="text-align:left;">
              <span style="font-size:10px; color:var(--text-muted); display:block;">بسعر الجمهور الرسمي</span>
              <b style="font-size:12px; color:#334155;">${totalItemPublic.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</b>
            </div>
          </div>

          <div style="margin-top:8px; font-size:11px; color:#0284c7; font-weight:700; text-align:left; cursor:pointer;" onclick="openProductMovements(${p.id})">
            عرض سجل حركة الدواء (وارد / صادر) 📜 >
          </div>
        </div>
      `;
      }).join('')}
    </div>
  `;
}

function openAdjustStockModal(productId) {
  const prod = db.products.find(p => p.id === productId);
  if (!prod) return;

  const html = `
    <form onsubmit="handleStockAdjustSubmit(event, ${prod.id})">
      <div style="padding:10px; background:#e0f2fe; border-radius:10px; margin-bottom:12px;">
        <div style="font-weight:800; font-size:14px; color:#0369a1;">${prod.name}</div>
        <div style="font-size:12px; color:var(--text-muted);">الرصيد الفعلي المسجل حالياً: <b>${prod.stockQuantity} ${prod.unit}</b></div>
      </div>

      <div class="form-group">
        <label>الرصيد الفعلي الجديد بعد الجرد (علب) *</label>
        <input class="input" type="number" id="adjustedStockVal" value="${prod.stockQuantity}" required />
      </div>

      <div class="form-group">
        <label>سبب التسوية الجردية / التعديل اليدوي *</label>
        <select class="input" id="adjustReason">
          <option value="تسوية جرد دوري">تسوية جرد دوري بالمخزن</option>
          <option value="توالف / منتهي الصلاحية">أدوية تالفة / منتهية الصلاحية</option>
          <option value="تصحيح خطأ إدخال سابق">تصحيح خطأ إدخال سابق</option>
          <option value="زيادة في التوريد">زيادة في التوريد من المورد</option>
          <option value="أخرى">أخرى</option>
        </select>
      </div>

      <div class="form-group">
        <label>ملاحظات إضافية (اختياري)</label>
        <input class="input" id="adjustNotes" placeholder="اكتب أي توضيح هنا..." />
      </div>

      <button type="submit" class="btn btn-primary" style="margin-top:10px;">حفظ وتعديل الرصيد</button>
    </form>
  `;
  openAppModal("تعديل رصيد الدواء يدوياً (تسوية جردية)", html);
}

function handleStockAdjustSubmit(e, prodId) {
  e.preventDefault();
  const prod = db.products.find(p => p.id === prodId);
  if (!prod) return;

  const newStock = parseFloat(document.getElementById('adjustedStockVal').value);
  const reason = document.getElementById('adjustReason').value;

  if (isNaN(newStock) || newStock < 0) {
    showToast("يرجى إدخال رصيد صحيح!", "error");
    return;
  }

  const prevStock = prod.stockQuantity;
  const diff = newStock - prevStock;
  prod.stockQuantity = newStock;

  db.movements.push({
    id: Date.now(),
    productId: prod.id,
    productName: prod.name,
    movementType: "MANUAL_ADJUST",
    quantity: diff,
    previousStock: prevStock,
    newStock: newStock,
    referenceInvoiceNumber: "تسوية يدوية",
    timestamp: Date.now()
  });

  saveDB();
  closeAppModal();
  renderInventoryScreen();
  showToast(`تم تعديل رصيد ${prod.name} إلى ${newStock} علبة بنجاح!`);
}

function openProductMovements(productId) {
  const prod = db.products.find(p => p.id === productId);
  if (!prod) return;

  const movements = db.movements.filter(m => m.productId === productId).reverse();

  const html = `
    <div>
      <div style="padding:10px; background:#e0f2fe; border-radius:10px; margin-bottom:12px; display:flex; justify-content:space-between;">
        <span>الرصيد الكلي المتوفر:</span>
        <b style="color:#0284c7; font-size:14px;">${prod.stockQuantity} ${prod.unit}</b>
      </div>

      <div style="font-size:12px; font-weight:700; margin-bottom:8px;">سجل الحركات الزمنية:</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${movements.length === 0 ? '<div style="color:var(--text-muted); text-align:center;">لا توجد حركات مسجلة</div>' : ''}
        ${movements.map(m => `
          <div style="padding:10px; background:#f8fafc; border-radius:8px; border:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; color:${m.movementType === 'PURCHASE_IN' ? 'var(--secondary)' : (m.movementType === 'SALE_OUT' ? 'var(--danger)' : '#0284c7')}">
                ${m.movementType === 'PURCHASE_IN' ? `وارد شراء (+${m.quantity})` : (m.movementType === 'SALE_OUT' ? `صادر بيع (${m.quantity})` : `تسوية جردية (${m.quantity > 0 ? '+' : ''}${m.quantity})`)}
              </span>
              <span style="font-size:10px; color:var(--text-muted);">${new Date(m.timestamp).toLocaleDateString('ar-EG')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-top:4px;">
              <span>الرصيد: ${m.previousStock} ➔ <b>${m.newStock}</b></span>
              <span>المرجع: ${m.referenceInvoiceNumber}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  openAppModal(`سجل حركة دواء: ${prod.name}`, html);
}

// -------------------------------------------------------------
// ADD PRODUCT & DELETE PRODUCT CONFIRMATION
// -------------------------------------------------------------
function openAddNewProductModal() {
  const html = `
    <form onsubmit="handleAddNewProductSubmit(event)">
      <div class="form-group">
        <label>اسم الدواء التجاري والشكل الصيدلي *</label>
        <input class="input" id="newProdName" placeholder="مثال: كيتوفان 50 مجم 20 كبسولة" required />
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>الباركود / الكود (SKU)</label>
          <input class="input" id="newProdSku" placeholder="مثال: KET-50-20C" />
        </div>
        <div class="form-group">
          <label>الوحدة</label>
          <input class="input" id="newProdUnit" value="علبة" required />
        </div>
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>سعر الجمهور الرسمي الثابت (ج.م) *</label>
          <input class="input" type="number" step="0.5" id="newProdPrice" placeholder="مثال: 45.0" required />
        </div>
        <div class="form-group">
          <label>الرصيد الابتدائي بالمخزن *</label>
          <input class="input" type="number" id="newProdStock" value="10" required />
        </div>
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>نسبة خصم الشراء من المورد (%) *</label>
          <input class="input" type="number" step="0.5" id="newProdPurDisc" value="25" required />
        </div>
        <div class="form-group">
          <label>نسبة خصم البيع للعميل (%) *</label>
          <input class="input" type="number" step="0.5" id="newProdSaleDisc" value="20" required />
        </div>
      </div>

      <button type="submit" class="btn btn-primary" style="margin-top:14px;">حفظ وإضافة الصنف للمخزن</button>
    </form>
  `;
  openAppModal("إضافة صنف دواء جديد للمنظومة", html);
}

function handleAddNewProductSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newProdName').value.trim();
  const sku = document.getElementById('newProdSku').value.trim() || `MED-${Date.now() % 10000}`;
  const unit = document.getElementById('newProdUnit').value.trim() || "علبة";
  const price = parseFloat(document.getElementById('newProdPrice').value) || 0;
  const stock = parseInt(document.getElementById('newProdStock').value) || 0;
  const purDisc = parseFloat(document.getElementById('newProdPurDisc').value) || 0;
  const saleDisc = parseFloat(document.getElementById('newProdSaleDisc').value) || 0;

  if (!name || price <= 0) {
    showToast("يرجى إدخال اسم الدواء وسعر رسمي صحيح!", "error");
    return;
  }

  const newProduct = {
    id: Date.now(),
    name: name,
    sku: sku,
    stockQuantity: stock,
    officialPrice: price,
    purchaseDiscountRate: purDisc,
    lastPurchaseDiscountRate: purDisc,
    saleDiscountRate: saleDisc,
    unit: unit
  };

  db.products.unshift(newProduct);
  saveDB();
  closeAppModal();
  renderInventoryScreen();
  showToast("تمت إضافة صنف الدواء بنجاح للمخزن!");
}

function confirmDeleteProduct(productId) {
  const prod = db.products.find(p => p.id === productId);
  if (!prod) return;

  const html = `
    <div style="text-align:center; padding:10px 0;">
      <div style="font-size:42px; margin-bottom:8px;">⚠️</div>
      <h3 style="font-size:16px; font-weight:800; color:#dc2626; margin-bottom:8px;">تأكيد حذف صنف الدواء</h3>
      <p style="font-size:14px; color:var(--text-main); margin-bottom:12px;">
        هل أنت متأكد من رغبتك في حذف <b>«${prod.name}»</b> نهائياً؟
      </p>
      <div style="background:#fee2e2; border:1px solid #fecaca; border-radius:10px; padding:12px; font-size:12px; color:#991b1b; margin-bottom:18px; text-align:right; line-height:1.6;">
        • الرصيد الحالي بالمخزن: <b>${prod.stockQuantity} ${prod.unit}</b><br>
        • سعر الجمهور الرسمي: <b>${prod.officialPrice} ج.م</b><br>
        • سيتم حذف الصنف ومزامنة التغيير سحابياً مباشرة.
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-outline" style="flex:1;" onclick="closeAppModal()">إلغاء</button>
        <button class="btn btn-danger" style="flex:1;" onclick="executeDeleteProduct(${prod.id})">نعم، تأكيد الحذف</button>
      </div>
    </div>
  `;
  openAppModal("حذف صنف دواء", html);
}

function executeDeleteProduct(productId) {
  const initialCount = db.products.length;
  db.products = db.products.filter(p => p.id !== productId);
  if (db.products.length < initialCount) {
    saveDB();
    closeAppModal();
    renderInventoryScreen();
    showToast("تم حذف صنف الدواء بنجاح سحابياً!");
  } else {
    closeAppModal();
  }
}

function confirmDeleteCustomer(customerId) {
  const cust = db.customers.find(c => c.id === customerId);
  if (!cust) return;

  const html = `
    <div style="text-align:center; padding:10px 0;">
      <div style="font-size:42px; margin-bottom:8px;">⚠️</div>
      <h3 style="font-size:16px; font-weight:800; color:#dc2626; margin-bottom:8px;">تأكيد حذف العميل</h3>
      <p style="font-size:14px; color:var(--text-main); margin-bottom:12px;">
        هل أنت متأكد من رغبتك في حذف العميل <b>«${cust.name}»</b>؟
      </p>
      <div style="background:#fee2e2; border:1px solid #fecaca; border-radius:10px; padding:12px; font-size:12px; color:#991b1b; margin-bottom:18px; text-align:right; line-height:1.6;">
        • رقم الهاتف: <b>${cust.phone}</b><br>
        • العنوان: <b>${cust.address}</b><br>
        • إجمالي المسحوبات: <b>${(cust.totalPurchases || 0).toLocaleString('ar-EG')} ج.م</b>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-outline" style="flex:1;" onclick="closeAppModal()">إلغاء</button>
        <button class="btn btn-danger" style="flex:1;" onclick="executeDeleteCustomer(${cust.id})">نعم، حذف العميل</button>
      </div>
    </div>
  `;
  openAppModal("حذف عميل", html);
}

function executeDeleteCustomer(customerId) {
  const initialCount = db.customers.length;
  db.customers = db.customers.filter(c => c.id !== customerId);
  if (db.customers.length < initialCount) {
    saveDB();
    closeAppModal();
    renderCustomersScreen();
    showToast("تم حذف العميل بنجاح ومزامنة السحابة!");
  } else {
    closeAppModal();
  }
}

// -------------------------------------------------------------
// 6. CUSTOMERS (العملاء)
// -------------------------------------------------------------
let customerSearchQuery = "";

function renderCustomersScreen() {
  topBarTitle.innerText = "سجل فواتير العملاء بالمنظومة";
  topBarSubtitle.innerText = "قائمة العملاء وسجل فواتير البيع السابقة";

  const filtered = db.customers.filter(c => c.name.includes(customerSearchQuery) || c.phone.includes(customerSearchQuery));

  screenContainer.innerHTML = `
    <!-- Search & Add Customer Button -->
    <div class="card" style="padding:10px;">
      <input class="input" placeholder="🔍 بحث باسم العميل أو رقم الهاتف..." value="${customerSearchQuery}" oninput="customerSearchQuery=this.value; renderCustomersScreen();" />
      <button class="btn btn-primary" style="margin-top:8px; font-size:12px; padding:8px;" onclick="openAddCustomerModal()">
        👥 + تسجيل عميل جديد
      </button>
    </div>

    <!-- Customers List -->
    <div class="inventory-grid">
      ${filtered.map(c => `
        <div class="card" style="cursor:pointer;" onclick="openCustomerInvoices(${c.id})">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-weight:800; font-size:15px; color:#0f172a;">${c.name}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">📱 ${c.phone} | 📍 ${c.address}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="text-align:left;">
                <span style="font-size:11px; color:var(--text-muted); display:block;">إجمالي المسحوبات</span>
                <span style="font-weight:800; color:var(--secondary); font-size:14px;">${(c.totalPurchases || 0).toLocaleString('ar-EG')} ج.م</span>
              </div>
              <button class="btn btn-outline btn-small" title="حذف العميل نهائياً" style="color:#dc2626; border-color:#fca5a5; padding:4px 8px; font-weight:700;" onclick="event.stopPropagation(); confirmDeleteCustomer(${c.id})">
                🗑️ حذف
              </button>
            </div>
          </div>
          <div style="margin-top:8px; padding-top:6px; border-top:1px solid var(--border); font-size:11px; color:#0284c7; font-weight:700; text-align:left;">
            عرض سجل فواتير العميل (${db.salesInvoices.filter(i => i.customerId === c.id).length}) >
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function openAddCustomerModal() {
  const html = `
    <form onsubmit="handleAddCustomerSubmit(event)">
      <div class="form-group">
        <label>اسم العميل *</label>
        <input class="input" id="newCustName" placeholder="مثال: د. محمد علي" required />
      </div>

      <div class="form-group">
        <label>رقم الهاتف / الواتساب *</label>
        <input class="input" type="tel" id="newCustPhone" placeholder="مثال: 01012345678" required />
      </div>

      <div class="form-group">
        <label>العنوان / المنطقة *</label>
        <input class="input" id="newCustAddress" placeholder="مثال: الدقي - شارع التحرير" required />
      </div>

      <button type="submit" class="btn btn-primary" style="margin-top:10px;">حفظ وتسجيل العميل</button>
    </form>
  `;
  openAppModal("تسجيل عميل جديد بالمنظومة", html);
}

function handleAddCustomerSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newCustName').value.trim();
  const phone = document.getElementById('newCustPhone').value.trim();
  const address = document.getElementById('newCustAddress').value.trim();

  db.customers.push({
    id: Date.now(),
    name: name,
    phone: phone,
    address: address,
    totalPurchases: 0
  });

  saveDB();
  closeAppModal();
  renderCustomersScreen();
  showToast("تم تسجيل العميل بنجاح!");
}

function openAddSupplierModal() {
  const html = `
    <form onsubmit="handleAddSupplierSubmit(event)">
      <div class="form-group">
        <label>اسم شركة التوزيع / المورد *</label>
        <input class="input" id="newSuppName" placeholder="مثال: شركة المتحدة للصيادلة" required />
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>رقم الهاتف</label>
          <input class="input" type="tel" id="newSuppPhone" placeholder="0225..." />
        </div>
        <div class="form-group">
          <label>اسم المندوب</label>
          <input class="input" id="newSuppRep" placeholder="أ. حسام" />
        </div>
      </div>

      <button type="submit" class="btn btn-primary" style="margin-top:10px;">حفظ المورد</button>
    </form>
  `;
  openAppModal("تسجيل شركة توزيع / مورد جديد", html);
}

function handleAddSupplierSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newSuppName').value.trim();
  const phone = document.getElementById('newSuppPhone').value.trim();
  const rep = document.getElementById('newSuppRep').value.trim();

  db.suppliers.push({
    id: Date.now(),
    name: name,
    phone: phone,
    repName: rep
  });

  saveDB();
  closeAppModal();
  renderPurchaseHistoryScreen();
  showToast("تمت إضافة المورد بنجاح!");
}

function confirmDeleteSupplier(supplierId) {
  const supp = db.suppliers.find(s => s.id === supplierId);
  if (!supp) return;

  const html = `
    <div style="text-align:center; padding:10px 0;">
      <div style="font-size:42px; margin-bottom:8px;">⚠️</div>
      <h3 style="font-size:16px; font-weight:800; color:#dc2626; margin-bottom:8px;">تأكيد حذف شركة التوزيع / المورد</h3>
      <p style="font-size:14px; color:var(--text-main); margin-bottom:12px;">
        هل أنت متأكد من رغبتك في حذف المورد <b>«${supp.name}»</b>؟
      </p>
      <div style="background:#fee2e2; border:1px solid #fecaca; border-radius:10px; padding:12px; font-size:12px; color:#991b1b; margin-bottom:18px; text-align:right; line-height:1.6;">
        ${supp.phone ? `• رقم الهاتف: <b>${supp.phone}</b><br>` : ''}
        ${supp.repName ? `• اسم المندوب: <b>${supp.repName}</b><br>` : ''}
        • سيتم حذف بيانات المورد من قائمة الموردين ومزامنة التغيير سحابياً.
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-outline" style="flex:1;" onclick="closeAppModal()">إلغاء</button>
        <button class="btn btn-danger" style="flex:1;" onclick="executeDeleteSupplier(${supp.id})">نعم، حذف المورد</button>
      </div>
    </div>
  `;
  openAppModal("حذف مورد", html);
}

function executeDeleteSupplier(supplierId) {
  const initialCount = db.suppliers.length;
  db.suppliers = db.suppliers.filter(s => s.id !== supplierId);
  if (db.suppliers.length < initialCount) {
    saveDB();
    closeAppModal();
    renderPurchaseHistoryScreen();
    showToast("تم حذف المورد بنجاح ومزامنة السحابة!");
  } else {
    closeAppModal();
  }
}

function openCustomerInvoices(customerId) {
  selectedCustomerForHistory = db.customers.find(c => c.id === customerId);
  navigateTo('customer_invoices');
}

function renderCustomerInvoicesScreen() {
  if (!selectedCustomerForHistory) {
    navigateTo('customers');
    return;
  }

  topBarTitle.innerText = `سجل فواتير: ${selectedCustomerForHistory.name}`;
  topBarSubtitle.innerText = `الهاتف: ${selectedCustomerForHistory.phone} | إجمالي المسحوبات: ${selectedCustomerForHistory.totalPurchases} ج.م`;

  const invoices = db.salesInvoices.filter(i => i.customerId === selectedCustomerForHistory.id);

  screenContainer.innerHTML = `
    <div class="card" style="background:#e0f2fe; border-color:#bae6fd;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:800; font-size:15px; color:#0369a1;">${selectedCustomerForHistory.name}</div>
          <div style="font-size:11px; color:var(--text-muted);">📱 ${selectedCustomerForHistory.phone} | 📍 ${selectedCustomerForHistory.address}</div>
        </div>
        <div style="text-align:left;">
          <span style="font-size:11px; color:var(--text-muted); display:block;">إجمالي المسحوبات</span>
          <span style="font-weight:800; color:var(--secondary); font-size:15px;">${selectedCustomerForHistory.totalPurchases.toLocaleString('ar-EG')} ج.م</span>
        </div>
      </div>
    </div>

    <div style="font-weight:800; font-size:13px; margin-top:4px;">فواتير العميل السابقة (${invoices.length})</div>

    ${invoices.length === 0 ? `
      <div style="text-align:center; padding:30px 0; color:var(--text-muted); font-size:13px;">
        لا توجد فواتير بيع مسجلة لهذا العميل حتى الآن.
      </div>
    ` : `
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${invoices.map(inv => `
          <div class="card" style="cursor:pointer;" onclick="openSalesInvoiceDetail(${inv.id})">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:800; font-size:14px; color:#0369a1;">${inv.invoiceNumber}</div>
                <div style="font-size:11px; color:var(--text-muted);">${new Date(inv.date).toLocaleDateString('ar-EG')}</div>
              </div>
              <div style="text-align:left;">
                <span style="font-weight:800; color:var(--secondary); font-size:15px;">${inv.grandTotal.toFixed(2)} ج.م</span>
                <span style="font-size:11px; color:#0284c7; display:block;">عرض الأصناف وواتساب ></span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

function openSalesInvoiceDetail(invId) {
  const inv = db.salesInvoices.find(i => i.id === invId);
  if (!inv) return;

  const text = generateWhatsAppText(inv.invoiceNumber, inv.customerName, inv.items, inv.grandTotal);
  const encodedText = encodeURIComponent(text);
  const cleanPhone = (inv.customerPhone || '').replace(/^0/, '20');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

  const html = `
    <div>
      <div style="padding:10px; background:#f0fdf4; border-radius:10px; margin-bottom:12px;">
        <div style="font-weight:800; color:var(--secondary);">رقم الفاتورة: ${inv.invoiceNumber}</div>
        <div style="font-size:12px; color:var(--text-muted);">العميل: ${inv.customerName} | التاريخ: ${new Date(inv.date).toLocaleDateString('ar-EG')}</div>
      </div>

      <div style="font-size:12px; font-weight:700; margin-bottom:8px;">الأدوية في الفاتورة:</div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${inv.items.map(it => `
          <div style="padding:8px 10px; background:#f8fafc; border-radius:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; font-size:13px;">${it.productName}</div>
              <div style="font-size:11px; color:var(--text-muted);">
                ${it.quantity} علبة × سعر الجمهور: ${it.officialPrice} ج.م (خصم: ${it.saleDiscountRate}%)
              </div>
            </div>
            <div style="font-weight:800; color:var(--secondary); font-size:13px;">
              ${it.lineTotal.toFixed(2)} ج.م
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:14px; padding-top:10px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; font-weight:800; font-size:16px;">
        <span>الإجمالي العام:</span>
        <span style="color:var(--secondary);">${inv.grandTotal.toFixed(2)} ج.م</span>
      </div>

      <a href="${waUrl}" target="_blank" class="btn btn-whatsapp" style="margin-top:14px; text-decoration:none;">
        📲 إرسال الفاتورة للعميل عبر واتساب
      </a>
    </div>
  `;
  openAppModal("تفاصيل فاتورة البيع", html);
}

// Back navigation
backBtn.addEventListener('click', () => {
  if (currentScreen === 'customer_invoices') navigateTo('customers');
  else if (currentScreen === 'purchase_history' || currentScreen === 'discount_alerts') navigateTo('purchase');
  else navigateTo('home');
});

// Initialize View Mode (Desktop vs Mobile)
const savedMode = localStorage.getItem('PHARMA_VIEW_MODE');
if (savedMode === 'mobile' && window.innerWidth > 768) {
  const layout = document.getElementById('appLayout');
  const btn = document.getElementById('viewToggleBtn');
  if (layout) layout.classList.add('mobile-mode');
  if (btn) btn.innerHTML = '💻 عرض كمبيوتر';
}

// Launch on home
navigateTo('home');
