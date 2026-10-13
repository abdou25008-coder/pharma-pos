// مدير مبيعات الأدويه - Engine & Database
const STORAGE_KEY = 'PHARMA_SALES_MANAGER_DB_V2';
const CLOUD_SERVER_STORAGE_KEY = 'PHARMA_CLOUD_SERVER_URL';
const DEFAULT_CLOUD_SERVER_URL = 'https://pharma-pos-4d68a-default-rtdb.firebaseio.com';
let isCloudConnected = false;
let isSyncing = false;

function getCloudServerBaseUrl() {
  try {
    const custom = localStorage.getItem(CLOUD_SERVER_STORAGE_KEY);
    if (custom && custom.trim()) {
      const clean = custom.trim().replace(/\/+$/, '');
      if (clean.includes('console.firebase.google.com') || clean.includes('trycloudflare.com')) {
        localStorage.removeItem(CLOUD_SERVER_STORAGE_KEY);
        return DEFAULT_CLOUD_SERVER_URL;
      }
      return clean;
    }
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes(':4200'))) {
        return origin;
      }
    }
  } catch(e) {}
  return DEFAULT_CLOUD_SERVER_URL;
}

function getCloudApiUrl() {
  const base = getCloudServerBaseUrl();
  if (base.includes('firebaseio.com') || base.includes('firebasedatabase.app')) {
    if (base.endsWith('.json')) return base;
    return base.replace(/\/+$/, '') + '/pharma_db.json';
  }
  return base + '/api/db';
}


const DEFAULT_SUPPLIERS = [
  { id: 1, name: "شركة ابن سينا فارما للتوزيع", phone: "0225100000", repName: "أ. محمد عبد الله" },
  { id: 2, name: "شركة المتحدة للصيادلة (UCP)", phone: "0227100000", repName: "أ. طارق محمود" },
  { id: 3, name: "شركة فارما أوفرسيز", phone: "0224100000", repName: "أ. حسام فوزي" }
];

function toCleanArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
}

function normalizeDatabase(raw) {
  const data = (raw && typeof raw === 'object') ? raw : {};
  data.products = toCleanArray(data.products);
  data.customers = toCleanArray(data.customers);
  data.suppliers = toCleanArray(data.suppliers);
  if (data.suppliers.length === 0) {
    data.suppliers = JSON.parse(JSON.stringify(DEFAULT_SUPPLIERS));
  }
  data.purchaseInvoices = toCleanArray(data.purchaseInvoices).map(inv => ({
    ...inv,
    items: toCleanArray(inv.items)
  }));
  data.salesInvoices = toCleanArray(data.salesInvoices).map(inv => ({
    ...inv,
    items: toCleanArray(inv.items)
  }));
  data.discountAlerts = toCleanArray(data.discountAlerts);
  data.movements = toCleanArray(data.movements);
  return data;
}

function initPharmaDatabase() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return normalizeDatabase(JSON.parse(existing));
    } catch(e) {}
  }

  const initialDB = normalizeDatabase({
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
    suppliers: JSON.parse(JSON.stringify(DEFAULT_SUPPLIERS)),
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
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
  return initialDB;
}

let db = initPharmaDatabase();

function updateCloudBadge(isOnline) {
  isCloudConnected = isOnline;
  const badge = document.getElementById('cloudStatusBadge');
  if (!badge) return;
  badge.style.cursor = 'pointer';
  badge.onclick = openCloudSettingsModal;
  if (isOnline) {
    badge.className = 'cloud-badge cloud-online';
    badge.innerHTML = '☁️ سحابي متصل';
    badge.title = 'متصل بالسحابة المركزية ومزامن بنجاح - انقر لإدارة السحابة';
  } else {
    badge.className = 'cloud-badge cloud-offline';
    badge.innerHTML = '💾 وضع محلي';
    badge.title = 'يعمل على الذاكرة المحلية للجهاز فقط - انقر لربط السحابة والمزامنة';
  }
}

async function syncWithCloud(silent = false) {
  if (isSyncing) return false;
  isSyncing = true;
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 9000) : null;
    const targetUrl = getCloudApiUrl();
    const fetchOptions = {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };
    if (controller) fetchOptions.signal = controller.signal;

    const res = await fetch(targetUrl, fetchOptions);
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const cloudData = await res.json();
      if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
        db = normalizeDatabase(cloudData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        updateCloudBadge(true);
        if (!silent) {
          navigateTo(currentScreen);
          showToast("تم مزامنة البيانات سحابياً بنجاح! ☁️");
        } else if (typeof currentScreen !== 'undefined' && currentScreen === 'home') {
          renderHomeScreen();
        }
        isSyncing = false;
        return true;
      } else if (res.status === 200 && (targetUrl.includes('firebaseio.com') || targetUrl.includes('firebasedatabase.app'))) {
        // قاعدة بيانات Firebase جديدة وفارغة: نرفع لها بياناتنا المحلية لتأسيسها فوراً
        db = normalizeDatabase(db);
        updateCloudBadge(true);
        saveDB();
        if (!silent) {
          showToast("تم ربط وتأسيس سحابة Google Firebase بنجاح! ☁️");
        }
        isSyncing = false;
        return true;
      }
    }
    updateCloudBadge(false);
  } catch (err) {
    console.warn('Cloud sync offline or unreachable:', err);
    updateCloudBadge(false);
  }
  isSyncing = false;
  return false;
}

function saveDB() {
  db = normalizeDatabase(db);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  // Sync to Central Cloud Storage directly
  if (typeof fetch !== 'undefined') {
    const targetUrl = getCloudApiUrl();
    const isFirebase = targetUrl.includes('firebaseio.com') || targetUrl.includes('firebasedatabase.app');
    fetch(targetUrl, {
      method: isFirebase ? 'PUT' : 'POST',
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
  if (!confirm("هل أنت متأكد من رغبتك في إعادة ضبط البيانات الافتراضية؟")) return;
  localStorage.removeItem(STORAGE_KEY);
  db = initPharmaDatabase();
  saveDB();
  navigateTo('home');
  showToast("تم إعادة ضبط بيانات الأدوية بنجاح!");
}

// زر بالأعلى لتحديث التطبيق مباشرة مع مزامنة سحابية
async function refreshAppDirectly() {
  showToast("جارٍ تحديث ومزامنة البيانات... ⏳");
  const synced = await syncWithCloud(false);
  if (!synced) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { db = normalizeDatabase(JSON.parse(saved)); } catch(e) {}
    }
    navigateTo(currentScreen);
    showToast("تم التحديث محلياً (السحابة غير متصلة) 💾");
  }
}

// نافذة إدارة المزامنة السحابية والنسخ الاحتياطي
function openCloudSettingsModal() {
  const currentBaseUrl = getCloudServerBaseUrl();
  const isDefault = (currentBaseUrl === DEFAULT_CLOUD_SERVER_URL);
  const productsCount = db.products ? db.products.length : 0;
  const purchasesCount = db.purchaseInvoices ? db.purchaseInvoices.length : 0;
  const salesCount = db.salesInvoices ? db.salesInvoices.length : 0;

  const html = `
    <div style="font-family: inherit; color: var(--text-main); line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 18px;">
        <div style="font-size: 36px; margin-bottom: 4px;">☁️</div>
        <h3 style="margin: 0; font-size: 18px; font-weight: 800;">إدارة المزامنة السحابية والنسخ الاحتياطي</h3>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">
          ربط جميع أجهزتك (كمبيوتر، هاتف، تابلت) بقاعدة بيانات واحدة مركزية
        </p>
      </div>

      <!-- Live Status Card -->
      <div style="background: ${isCloudConnected ? '#ecfdf5' : '#fef3c7'}; border: 1.5px solid ${isCloudConnected ? '#10b981' : '#f59e0b'}; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">${isCloudConnected ? '🟢' : '🟡'}</span>
            <div>
              <div style="font-weight: 800; font-size: 14px; color: ${isCloudConnected ? '#065f46' : '#92400e'};">
                ${isCloudConnected ? 'متصل بالسحابة المركزية ومزامن بنجاح' : 'يعمل على الذاكرة المحلية للجهاز فقط'}
              </div>
              <div style="font-size: 11px; color: ${isCloudConnected ? '#047857' : '#b45309'}; word-break: break-all; margin-top: 2px;">
                الرابط المستخدم: <code style="direction:ltr; display:inline-block;">${currentBaseUrl}</code>
              </div>
            </div>
          </div>
          <button class="btn btn-small btn-primary" onclick="testCloudConnectionModal()" style="font-size: 12px; padding: 6px 14px;">
            ⚡ اختبار الاتصال
          </button>
        </div>
      </div>

      <!-- Device Data Summary -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-around; text-align: center;">
        <div>
          <div style="font-size: 11px; color: #64748b;">الأصناف المسجلة</div>
          <div style="font-size: 16px; font-weight: 800; color: #0284c7;">${productsCount} دواء</div>
        </div>
        <div style="border-right: 1px solid #cbd5e1;"></div>
        <div>
          <div style="font-size: 11px; color: #64748b;">فواتير الشراء</div>
          <div style="font-size: 16px; font-weight: 800; color: #059669;">${purchasesCount} فاتورة</div>
        </div>
        <div style="border-right: 1px solid #cbd5e1;"></div>
        <div>
          <div style="font-size: 11px; color: #64748b;">فواتير البيع</div>
          <div style="font-size: 16px; font-weight: 800; color: #4f46e5;">${salesCount} فاتورة</div>
        </div>
      </div>

      <!-- Cloud URL Configuration -->
      <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #1e293b;">
          🌐 عنوان خادم السحابة المركزي (Cloud Server URL):
        </label>
        <div style="display: flex; gap: 8px;">
          <input type="url" id="customCloudUrlInput" value="${currentBaseUrl}" 
                 placeholder="https://..." 
                 dir="ltr"
                 style="flex: 1; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 12px; font-family: monospace;">
          <button class="btn btn-primary" onclick="saveCustomCloudServerUrl()" style="padding: 10px 14px; font-size: 12px; white-space: nowrap;">
            💾 حفظ واعتماد
          </button>
        </div>
        ${!isDefault ? `
          <button class="btn btn-outline btn-small" onclick="resetToDefaultCloudServerUrl()" style="margin-top: 8px; font-size: 11px; color: #64748b;">
            🔄 استعادة الرابط السحابي الافتراضي
          </button>
        ` : ''}
        <p style="font-size: 11px; color: #64748b; margin: 6px 0 0 0;">
          💡 هذا الرابط هو المسؤول عن توحيد الأرصدة والمبيعات وفواتير الشراء بين جميع أجهزتك.
        </p>
      </div>

      <!-- Two-way Sync Actions -->
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #1e293b;">
          🔄 إجراءات المزامنة الفورية بين الأجهزة:
        </label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <button class="btn btn-outline" onclick="forcePullFromCloud()" style="padding: 12px 10px; font-size: 12px; font-weight: 700; border-color: #0284c7; color: #0284c7; display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="font-size: 18px;">⬇️</span>
            <span>سحب البيانات من السحابة</span>
            <span style="font-size: 10px; font-weight: normal; color: #64748b;">تحديث هذا الجهاز بأحدث البيانات</span>
          </button>
          <button class="btn btn-outline" onclick="forcePushToCloud()" style="padding: 12px 10px; font-size: 12px; font-weight: 700; border-color: #059669; color: #059669; display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="font-size: 18px;">⬆️</span>
            <span>رفع بيانات الجهاز للسحابة</span>
            <span style="font-size: 10px; font-weight: normal; color: #64748b;">اعتماد بيانات هذا الجهاز للجميع</span>
          </button>
        </div>
      </div>

      <!-- Offline JSON Backup & Restore -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 14px; margin-bottom: 14px;">
        <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #1e293b;">
          🗂️ النسخ الاحتياطي التام (بدون إنترنت - ملف محلي):
        </label>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">
          يمكنك تنزيل ملف نسخة احتياطية لبيانات الصيدلية بالكامل على هاتفك أو جهازك، ونقلها أو استرجاعها في أي وقت.
        </p>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline" onclick="exportDatabaseBackup()" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border-color: #475569; color: #334155;">
            📥 تنزيل نسخة JSON
          </button>
          <button class="btn btn-outline" onclick="triggerRestoreBackup()" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border-color: #475569; color: #334155;">
            📤 استرجاع من ملف JSON
          </button>
          <input type="file" id="restoreBackupFileInput" accept=".json" style="display:none;" onchange="handleRestoreBackupFile(event)">
        </div>
      </div>

      <div style="text-align: center; margin-top: 10px;">
        <button class="btn btn-outline" onclick="closeAppModal()" style="min-width: 140px; padding: 10px 20px;">
          إغلاق النافذة
        </button>
      </div>
    </div>
  `;

  openAppModal("إدارة المزامنة السحابية والنسخ الاحتياطي", html, true);
}

async function testCloudConnectionModal() {
  showToast("جارٍ اختبار الاتصال بالسحابة... ⏳");
  const synced = await syncWithCloud(true);
  if (synced) {
    showToast("الاتصال بالسحابة سليم ويعمل بنجاح 🟢");
  } else {
    showToast("تعذر الاتصال بالسيرفر السحابي، تأكد من صحة الرابط أو عمل الخادم ⚠️");
  }
  openCloudSettingsModal();
}

function saveCustomCloudServerUrl() {
  const input = document.getElementById('customCloudUrlInput');
  if (!input) return;
  let val = input.value.trim().replace(/\/+$/, '');
  if (!val) {
    showToast("يرجى إدخال رابط سيرفر صالح!");
    return;
  }
  if (val.includes('console.firebase.google.com')) {
    alert("⚠️ انتبه: لقد قمت بنسخ رابط شريط المتصفح (لوحة تحكم Firebase Console) وليس رابط قاعدة البيانات!\n\nرابط السحابة الحقيقي موجود داخل صفحة Firebase تحت تبويب (Data) ومكتوب فوق شجرة البيانات بجوار رمز النسخ 🔗، وينتهي بـ firebaseio.com أو firebasedatabase.app.\n\nيرجى التوجه لتبويب Data ونسخ الرابط من داخل الصفحة.");
    return;
  }
  localStorage.setItem(CLOUD_SERVER_STORAGE_KEY, val);
  showToast("تم حفظ رابط السيرفر السحابي بنجاح! ☁️");
  testCloudConnectionModal();
}

function resetToDefaultCloudServerUrl() {
  localStorage.removeItem(CLOUD_SERVER_STORAGE_KEY);
  showToast("تمت استعادة الرابط السحابي الافتراضي");
  openCloudSettingsModal();
  syncWithCloud(false);
}

async function forcePullFromCloud() {
  if (!confirm("هل أنت متأكد من سحب البيانات من السحابة؟ سيتم تحديث هذا الجهاز بنسخة السحابة.")) return;
  showToast("جارٍ سحب البيانات من السحابة... ⏳");
  const ok = await syncWithCloud(false);
  if (ok) {
    showToast("تم سحب أحدث بيانات من السحابة بنجاح! 🎉");
    closeAppModal();
  } else {
    showToast("فشل السحب: السيرفر السحابي غير متاح حالياً ⚠️");
  }
}

async function forcePushToCloud() {
  if (!confirm("هل أنت متأكد من رفع بيانات هذا الجهاز للسحابة؟ ستصبح هذه البيانات هي المعتمدة لجميع الأجهزة.")) return;
  showToast("جارٍ رفع وتصدير البيانات للسحابة... ⏳");
  try {
    const targetUrl = getCloudApiUrl();
    const isFirebase = targetUrl.includes('firebaseio.com') || targetUrl.includes('firebasedatabase.app');
    const res = await fetch(targetUrl, {
      method: isFirebase ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
    });
    if (res.ok) {
      updateCloudBadge(true);
      showToast("تم رفع البيانات للسحابة المركزية بنجاح! ☁️");
      closeAppModal();
    } else {
      showToast("فشل الرفع: استجاب السيرفر بخطأ " + res.status);
    }
  } catch(e) {
    showToast("فشل الرفع: تعذر الوصول للسيرفر السحابي ⚠️");
  }
}

function exportDatabaseBackup() {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pharma_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("تم تنزيل ملف النسخة الاحتياطية بنجاح 📥");
  } catch(e) {
    showToast("حدث خطأ أثناء تنزيل النسخة الاحتياطية");
  }
}

function triggerRestoreBackup() {
  const input = document.getElementById('restoreBackupFileInput');
  if (input) {
    input.value = '';
    input.click();
  }
}

function handleRestoreBackupFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || !Array.isArray(parsed.products)) {
        throw new Error("ملف النسخة الاحتياطية غير صالح، تنقصه بيانات الأدوية");
      }
      if (confirm(`تم قراءة النسخة الاحتياطية بنجاح!\nتحتوي على: ${parsed.products.length} دواء و ${parsed.salesInvoices ? parsed.salesInvoices.length : 0} فاتورة بيع.\nهل تريد استرجاعها الآن؟`)) {
        db = normalizeDatabase(parsed);
        saveDB();
        navigateTo(currentScreen);
        closeAppModal();
        showToast("تم استرجاع النسخة الاحتياطية بنجاح وتحديث السحابة! 🎉");
      }
    } catch(err) {
      alert("خطأ في قراءة ملف النسخة الاحتياطية: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Automatically sync from cloud server on page load and visibility change
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    syncWithCloud(true);
  });
  // Auto-sync when user returns to tab / app
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncWithCloud(true);
    }
  });
  // Periodically check every 45 seconds if tab is active
  setInterval(() => {
    if (!document.hidden) {
      syncWithCloud(true);
    }
  }, 45000);
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
  db = normalizeDatabase(db);
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

      <div class="action-card" style="background:#0369a1; cursor:pointer;" onclick="openCloudSettingsModal()">
        <div class="icon-box">☁️</div>
        <div class="info">
          <h3>المزامنة السحابية والنسخ الاحتياطي (ربط الأجهزة)</h3>
          <p>ربط الهاتف والكمبيوتر بسيرفر موحد، رفع وسحب البيانات، وحفظ نسخة JSON</p>
        </div>
      </div>
    </div>
  `;
}


// -------------------------------------------------------------
// -------------------------------------------------------------
// 2. PURCHASE SCREEN (Pharma Pricing & Fixed Price + Discount)
// -------------------------------------------------------------
let currentPurchaseInvoiceNo = "";
let currentPurchaseSupplier = "";
let selectedPurchaseProduct = null;

function renderPurchaseScreen() {
  topBarTitle.innerText = "فاتورة شراء أدوية جديدة";
  topBarSubtitle.innerText = "سعر الجمهور ثابت وقيمة الخصم هي المتغيرة";

  if (!currentPurchaseInvoiceNo) {
    currentPurchaseInvoiceNo = `PUR-${Math.floor(10000 + Math.random() * 90000)}`;
  }
  if (!currentPurchaseSupplier && db.suppliers && db.suppliers.length > 0) {
    currentPurchaseSupplier = db.suppliers[0].name;
  }

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
          <input class="input" id="purInvoiceNo" value="${currentPurchaseInvoiceNo}" oninput="currentPurchaseInvoiceNo = this.value" />
        </div>
        <div class="form-group">
          <label>المورد / شركة التوزيع</label>
          <select class="input" id="purSupplierName" onchange="currentPurchaseSupplier = this.value">
            ${db.suppliers.map(s => `<option value="${s.name}" ${s.name === currentPurchaseSupplier ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- Quick Medicine Picker From Registered Products -->
    <div class="card" style="border:1.5px solid #0284c7; background:#f0f9ff;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
        <span style="font-weight:800; font-size:13px; color:#0369a1;">
          💊 اختيار من الأدوية المسجلة مسبقاً بالمخزن
        </span>
        <button class="btn btn-outline btn-small" style="font-size:11px;" onclick="openAddMedicineModal()">
          ➕ تسجيل دواء جديد غير مسجل
        </button>
      </div>

      <div class="form-group">
        <label style="font-size:12px; font-weight:700;">اختر الدواء من المخزون الحالي (${db.products.length} صنف):</label>
        <select class="input" id="purchaseMedicinePicker" onchange="onPurchaseMedicineSelected(this.value)">
          <option value="">-- اضغط لاختيار الصنف من المخزن --</option>
          ${db.products.map(p => `
            <option value="${p.id}" ${selectedPurchaseProduct && selectedPurchaseProduct.id === p.id ? 'selected' : ''}>
              ${p.name} (الرصيد: ${p.stockQuantity} علبة | سعر الجمهور: ${p.officialPrice} ج.م | الخصم: ${p.purchaseDiscountRate}%)
            </option>
          `).join('')}
        </select>
      </div>

      ${selectedPurchaseProduct ? `
        <div style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:12px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
            <div>
              <span style="font-weight:800; font-size:14px; color:#0f172a;">${selectedPurchaseProduct.name}</span>
              <span class="badge badge-blue" style="margin-right:6px;">صنف مسجل بالمخزن</span>
            </div>
            <span class="badge ${selectedPurchaseProduct.stockQuantity <= 5 ? 'badge-red' : 'badge-green'}">
              الرصيد الحالي بالمخزن: ${selectedPurchaseProduct.stockQuantity} علبة
            </span>
          </div>

          <div class="row-2">
            <div class="form-group">
              <label>سعر الجمهور الرسمي (ج.م)</label>
              <input class="input" type="number" step="0.5" id="purMedOfficialPrice" value="${selectedPurchaseProduct.officialPrice}" oninput="recalcPurchaseLineTotal()" />
            </div>
            <div class="form-group">
              <label>الكمية المشتراة بالفاتورة (علب) *</label>
              <input class="input" type="number" id="purMedQuantity" value="10" min="1" oninput="recalcPurchaseLineTotal()" />
            </div>
          </div>

          <div class="row-2">
            <div class="form-group">
              <label>خصم الشراء من المورد %</label>
              <input class="input" type="number" step="0.5" id="purMedPurchaseDiscount" value="${selectedPurchaseProduct.purchaseDiscountRate}" oninput="recalcPurchaseLineTotal()" />
            </div>
            <div class="form-group">
              <label>خصم البيع المقترح للعميل %</label>
              <input class="input" type="number" step="0.5" id="purMedSaleDiscount" value="${selectedPurchaseProduct.saleDiscountRate}" />
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:8px 12px; margin-top:8px;">
            <div style="font-size:12px; color:#166534;">
              صافي تكلفة العلبة: <b id="purLiveNetUnit">${(selectedPurchaseProduct.officialPrice * (1 - (selectedPurchaseProduct.purchaseDiscountRate / 100))).toFixed(2)} ج.م</b>
            </div>
            <div style="font-size:13px; font-weight:800; color:#15803d;">
              إجمالي الصنف: <span id="purLiveLineTotal">${(10 * selectedPurchaseProduct.officialPrice * (1 - (selectedPurchaseProduct.purchaseDiscountRate / 100))).toFixed(2)} ج.م</span>
            </div>
          </div>

          <button class="btn btn-primary" style="margin-top:10px; font-size:13px;" onclick="addSelectedProductToPurchaseInvoice()">
            ➕ إضافة هذا الصنف لفاتورة الشراء
          </button>
        </div>
      ` : ''}
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

// =============================================================
// PURCHASE MEDICINE PICKER & MODAL (الأصناف المسجلة وإلغاء التكرار)
// =============================================================

function onPurchaseMedicineSelected(productId) {
  if (!productId) {
    selectedPurchaseProduct = null;
  } else {
    selectedPurchaseProduct = db.products.find(p => p.id == productId) || null;
  }
  calculateAndRenderPurchaseUI();
}

function recalcPurchaseLineTotal() {
  if (!selectedPurchaseProduct) return;
  const officialPrice = parseFloat(document.getElementById('purMedOfficialPrice').value) || 0;
  const qty = parseFloat(document.getElementById('purMedQuantity').value) || 0;
  const pDisc = parseFloat(document.getElementById('purMedPurchaseDiscount').value) || 0;

  const netUnitPrice = officialPrice * (1 - (pDisc / 100));
  const lineTotal = qty * netUnitPrice;

  const netEl = document.getElementById('purLiveNetUnit');
  const lineEl = document.getElementById('purLiveLineTotal');
  if (netEl) netEl.innerText = `${netUnitPrice.toFixed(2)} ج.م`;
  if (lineEl) lineEl.innerText = `${lineTotal.toFixed(2)} ج.م`;
}

function addSelectedProductToPurchaseInvoice() {
  if (!selectedPurchaseProduct) {
    showToast("يرجى اختيار دواء من القائمة أولاً!", "error");
    return;
  }

  const officialPrice = parseFloat(document.getElementById('purMedOfficialPrice').value) || selectedPurchaseProduct.officialPrice;
  const qty = parseFloat(document.getElementById('purMedQuantity').value) || 1;
  const pDisc = parseFloat(document.getElementById('purMedPurchaseDiscount').value) || selectedPurchaseProduct.purchaseDiscountRate;
  const sDisc = parseFloat(document.getElementById('purMedSaleDiscount').value) || selectedPurchaseProduct.saleDiscountRate;

  if (qty <= 0) {
    showToast("يرجى إدخال كمية صحيحة أكبر من الصفر!", "error");
    return;
  }

  const existingIdx = parsedPurchaseItems.findIndex(p => 
    (p.productId && p.productId === selectedPurchaseProduct.id) || 
    p.productName.trim().toLowerCase() === selectedPurchaseProduct.name.trim().toLowerCase()
  );

  if (existingIdx >= 0) {
    parsedPurchaseItems[existingIdx].quantity += qty;
    parsedPurchaseItems[existingIdx].officialPrice = officialPrice;
    parsedPurchaseItems[existingIdx].purchaseDiscountRate = pDisc;
    parsedPurchaseItems[existingIdx].saleDiscountRate = sDisc;
    parsedPurchaseItems[existingIdx].productId = selectedPurchaseProduct.id;
    showToast(`تم زيادة كمية (${selectedPurchaseProduct.name}) بالفاتورة إلى ${parsedPurchaseItems[existingIdx].quantity} علبة!`);
  } else {
    parsedPurchaseItems.push({
      productId: selectedPurchaseProduct.id,
      productName: selectedPurchaseProduct.name,
      quantity: qty,
      officialPrice: officialPrice,
      purchaseDiscountRate: pDisc,
      saleDiscountRate: sDisc
    });
    showToast(`تمت إضافة (${selectedPurchaseProduct.name}) للفاتورة بنجاح!`);
  }

  selectedPurchaseProduct = null;
  calculateAndRenderPurchaseUI();
}

let addMedModalMode = "existing"; // "existing" or "new"
let addMedModalSelectedProductId = null;
let addMedModalSearchQuery = "";

function openAddMedicineModal() {
  addMedModalMode = "existing";
  addMedModalSelectedProductId = null;
  addMedModalSearchQuery = "";
  renderAddMedicineModalContent();
}

function setAddMedModalMode(mode) {
  addMedModalMode = mode;
  if (mode === "new") {
    addMedModalSelectedProductId = null;
  }
  renderAddMedicineModalContent();
}

function filterModalRegisteredMeds(query) {
  addMedModalSearchQuery = query;
  const listEl = document.getElementById('modalProductsListContainer');
  if (!listEl) return;
  listEl.innerHTML = buildModalProductsListHTML();
}

function buildModalProductsListHTML() {
  const filtered = addMedModalSearchQuery
    ? db.products.filter(p => p.name.toLowerCase().includes(addMedModalSearchQuery.trim().toLowerCase()))
    : db.products;

  if (filtered.length === 0) {
    return `
      <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:12px;">
        لم يتم العثور على أدوية مطابقة. يمكنك التبديل إلى زر <b>«دواء جديد غير مسجل»</b> لإضافته.
      </div>
    `;
  }

  return filtered.map(p => {
    const isSelected = addMedModalSelectedProductId === p.id;
    return `
      <div onclick="selectModalProduct(${p.id})" style="
        padding:8px 10px;
        border-radius:8px;
        border:1.5px solid ${isSelected ? '#0284c7' : 'var(--border)'};
        background:${isSelected ? '#f0f9ff' : '#ffffff'};
        cursor:pointer;
        display:flex;
        justify-content:space-between;
        align-items:center;
        transition:all 0.15s;
        margin-bottom:6px;
      ">
        <div>
          <div style="font-weight:700; font-size:13px; color:#0f172a;">${p.name}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
            سعر الجمهور: <b>${p.officialPrice} ج.م</b> | خصم الشراء السابق: <b>${p.purchaseDiscountRate}%</b>
          </div>
        </div>
        <div style="text-align:left;">
          <span class="badge ${p.stockQuantity <= 5 ? 'badge-red' : 'badge-green'}" style="font-size:11px;">
            الرصيد: ${p.stockQuantity} علبة
          </span>
          ${isSelected ? `<span style="color:#0284c7; font-weight:800; font-size:12px; display:block; margin-top:2px;">✓ تم الاختيار</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function selectModalProduct(productId) {
  addMedModalSelectedProductId = productId;
  const p = db.products.find(x => x.id === productId);
  if (!p) return;

  const listEl = document.getElementById('modalProductsListContainer');
  if (listEl) listEl.innerHTML = buildModalProductsListHTML();

  const nameInput = document.getElementById('newMedName');
  const priceInput = document.getElementById('newMedOfficialPrice');
  const pDiscInput = document.getElementById('newMedPurchaseDisc');
  const sDiscInput = document.getElementById('newMedSaleDisc');
  const qtyInput = document.getElementById('newMedQty');
  const badgeEl = document.getElementById('modalSelectedProductBadge');

  if (nameInput) nameInput.value = p.name;
  if (priceInput) priceInput.value = p.officialPrice;
  if (pDiscInput) pDiscInput.value = p.purchaseDiscountRate;
  if (sDiscInput) sDiscInput.value = p.saleDiscountRate;
  if (badgeEl) {
    badgeEl.style.display = 'block';
    badgeEl.innerHTML = `✓ تم اختيار: <b>${p.name}</b> (الرصيد الحالي بالمخزن: ${p.stockQuantity} علبة)`;
  }
  if (qtyInput) qtyInput.focus();
}

function renderAddMedicineModalContent() {
  const isExisting = addMedModalMode === "existing";
  const selectedProd = addMedModalSelectedProductId ? db.products.find(p => p.id === addMedModalSelectedProductId) : null;

  const html = `
    <div>
      <!-- Mode Toggle Buttons -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; background:#f1f5f9; padding:4px; border-radius:10px; margin-bottom:12px;">
        <button type="button" class="btn ${isExisting ? 'btn-primary' : 'btn-outline'}" style="font-size:12px; padding:8px 6px;" onclick="setAddMedModalMode('existing')">
          💊 من الأدوية المسجلة (${db.products.length})
        </button>
        <button type="button" class="btn ${!isExisting ? 'btn-primary' : 'btn-outline'}" style="font-size:12px; padding:8px 6px;" onclick="setAddMedModalMode('new')">
          ➕ دواء جديد غير مسجل
        </button>
      </div>

      ${isExisting ? `
        <!-- Search and Selection of Existing Products -->
        <div style="margin-bottom:12px;">
          <label style="font-size:12px; font-weight:700; color:#0369a1; display:block; margin-bottom:4px;">
            🔍 ابحث في قائمة الأدوية المسجلة مسبقاً بالمخزن:
          </label>
          <input class="input" id="searchRegisteredMedsInput" placeholder="اكتب للبحث الفوري بالاسم..." value="${escapeHtml(addMedModalSearchQuery)}" oninput="filterModalRegisteredMeds(this.value)" style="margin-bottom:8px; border-color:#38bdf8;" />
          
          <div id="modalProductsListContainer" style="max-height:160px; overflow-y:auto; border:1px solid var(--border); border-radius:8px; padding:6px; background:#f8fafc;">
            ${buildModalProductsListHTML()}
          </div>
        </div>

        <div id="modalSelectedProductBadge" style="display:${selectedProd ? 'block' : 'none'}; background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:8px 12px; border-radius:8px; font-size:12px; margin-bottom:10px;">
          ${selectedProd ? `✓ تم اختيار: <b>${selectedProd.name}</b> (الرصيد الحالي بالمخزن: ${selectedProd.stockQuantity} علبة)` : ''}
        </div>
      ` : `
        <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:8px 12px; margin-bottom:12px; font-size:12px; color:#92400e;">
          ℹ️ <b>دواء جديد:</b> سيتم إنشاء بطاقة صنف جديدة لهذا الدواء في المخزن عند حفظ الفاتورة.
        </div>
      `}

      <!-- Form Inputs -->
      <form onsubmit="handleAddMedicineSubmit(event)">
        <div class="form-group">
          <label>اسم الدواء / الصنف *</label>
          <input class="input" id="newMedName" value="${selectedProd ? selectedProd.name : ''}" placeholder="مثال: ألفينترن 30 قرص" ${isExisting ? 'readonly style="background:#f1f5f9; font-weight:800;"' : 'required'} />
        </div>

        <div class="row-2">
          <div class="form-group">
            <label>سعر الجمهور الرسمي (ثابت) *</label>
            <input class="input" type="number" step="0.5" id="newMedOfficialPrice" value="${selectedProd ? selectedProd.officialPrice : ''}" placeholder="مثال: 54.0" required />
          </div>
          <div class="form-group">
            <label>الكمية المشتراة (علب) *</label>
            <input class="input" type="number" id="newMedQty" value="10" min="1" required />
          </div>
        </div>

        <div class="row-2">
          <div class="form-group">
            <label>خصم الشراء من المورد % *</label>
            <input class="input" type="number" step="0.5" id="newMedPurchaseDisc" value="${selectedProd ? selectedProd.purchaseDiscountRate : '25'}" required />
          </div>
          <div class="form-group">
            <label>خصم البيع المقترح للعميل % *</label>
            <input class="input" type="number" step="0.5" id="newMedSaleDisc" value="${selectedProd ? selectedProd.saleDiscountRate : '20'}" required />
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top:10px;">
          ➕ إضافة الدواء لفاتورة الشراء
        </button>
      </form>
    </div>
  `;

  openAppModal("تسجيل صنف دواء في الفاتورة", html);
}

function handleAddMedicineSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newMedName').value.trim();
  const officialPrice = parseFloat(document.getElementById('newMedOfficialPrice').value) || 0;
  const qty = parseFloat(document.getElementById('newMedQty').value) || 1;
  const pDisc = parseFloat(document.getElementById('newMedPurchaseDisc').value) || 0;
  const sDisc = parseFloat(document.getElementById('newMedSaleDisc').value) || 0;

  if (!name) {
    showToast("يرجى اختيار دواء أو إدخال اسم الدواء!", "error");
    return;
  }

  let pId = null;
  if (addMedModalMode === "existing" && addMedModalSelectedProductId) {
    pId = addMedModalSelectedProductId;
  } else {
    // Check if name matches any existing product in db.products
    const match = db.products.find(p => p.name.trim().toLowerCase() === name.toLowerCase());
    if (match) {
      pId = match.id;
    }
  }

  const existingIdx = parsedPurchaseItems.findIndex(p => 
    (pId && p.productId === pId) || 
    p.productName.trim().toLowerCase() === name.toLowerCase()
  );

  if (existingIdx >= 0) {
    parsedPurchaseItems[existingIdx].quantity += qty;
    parsedPurchaseItems[existingIdx].officialPrice = officialPrice;
    parsedPurchaseItems[existingIdx].purchaseDiscountRate = pDisc;
    parsedPurchaseItems[existingIdx].saleDiscountRate = sDisc;
    if (pId) parsedPurchaseItems[existingIdx].productId = pId;
    showToast(`تم تحديث كمية (${name}) بالفاتورة إلى ${parsedPurchaseItems[existingIdx].quantity} علبة!`);
  } else {
    parsedPurchaseItems.push({
      productId: pId,
      productName: name,
      quantity: qty,
      officialPrice: officialPrice,
      purchaseDiscountRate: pDisc,
      saleDiscountRate: sDisc
    });
    showToast(`تمت إضافة (${name}) للفاتورة بنجاح!`);
  }

  closeAppModal();
  calculateAndRenderPurchaseUI();
}

function savePurchaseInvoice() {
  if (parsedPurchaseItems.length === 0) {
    showToast("يرجى إضافة دواء واحد على الأقل للفاتورة!", "error");
    return;
  }

  const invoiceNo = document.getElementById('purInvoiceNo') ? document.getElementById('purInvoiceNo').value : (currentPurchaseInvoiceNo || `PUR-${Date.now() % 100000}`);
  const supplier = document.getElementById('purSupplierName') ? document.getElementById('purSupplierName').value : (currentPurchaseSupplier || "شركة توزيع أدوية");

  const totalBefore = parsedPurchaseItems.reduce((acc, item) => acc + (item.quantity * item.officialPrice), 0);
  const totalDisc = parsedPurchaseItems.reduce((acc, item) => acc + ((item.quantity * item.officialPrice) * (item.purchaseDiscountRate / 100)), 0);
  const netGrandTotal = totalBefore - totalDisc;

  parsedPurchaseItems.forEach(item => {
    let existing = (item.productId && db.products.find(p => p.id === item.productId)) ||
                   db.products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
    let prevStock = 0;
    let newStock = item.quantity;
    let pId = item.productId || (Date.now() + Math.floor(Math.random() * 1000));

    if (existing) {
      prevStock = existing.stockQuantity || 0;
      newStock = prevStock + item.quantity;
      pId = existing.id;

      if (existing.purchaseDiscountRate > 0 && existing.purchaseDiscountRate !== item.purchaseDiscountRate) {
        db.discountAlerts.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          productId: pId,
          productName: existing.name,
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
      productName: existing ? existing.name : item.productName,
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
  currentPurchaseInvoiceNo = "";
  currentPurchaseSupplier = "";
  selectedPurchaseProduct = null;
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
// 4. SALES INVOICE SCREEN (العملاء وواتساب والـ PDF)
// -------------------------------------------------------------
let selectedSalesProduct = null;
let currentSalesInvoiceNo = "";
let currentSalesCustomerId = 1;

function renderSalesScreen() {
  topBarTitle.innerText = "إصدار فاتورة بيع أدوية";
  topBarSubtitle.innerText = "سعر الجمهور ثابت وخصم البيع يحدد السعر الصافي";

  if (!currentSalesInvoiceNo) {
    currentSalesInvoiceNo = `SAL-${Math.floor(10000 + Math.random() * 90000)}`;
  }
  if (db.customers.length > 0 && !db.customers.some(c => c.id == currentSalesCustomerId)) {
    currentSalesCustomerId = db.customers[0].id;
  }

  calculateAndRenderSalesUI();
}

function calculateAndRenderSalesUI() {
  if (db.customers.length > 0 && !db.customers.some(c => c.id == currentSalesCustomerId)) {
    currentSalesCustomerId = db.customers[0].id;
  }
  const subtotalOfficial = currentSalesItems.reduce((acc, it) => acc + (it.quantity * it.officialPrice), 0);
  const totalDiscAmount = currentSalesItems.reduce((acc, it) => acc + ((it.quantity * it.officialPrice) * (it.saleDiscountRate / 100)), 0);
  const grandTotal = currentSalesItems.reduce((acc, it) => acc + it.lineTotal, 0);

  screenContainer.innerHTML = `
    <!-- Header: Invoice No & Customer Selection -->
    <div class="card">
      <div class="row-2">
        <div class="form-group">
          <label>رقم الفاتورة</label>
          <input class="input" id="saleInvoiceNo" value="${currentSalesInvoiceNo}" readonly />
        </div>
        <div class="form-group">
          <label>العميل</label>
          <div style="display:flex; gap:6px;">
            <select class="input" id="saleCustomerSelect" onchange="currentSalesCustomerId = Number(this.value);">
              ${db.customers.map(c => `<option value="${c.id}" ${c.id == currentSalesCustomerId ? 'selected' : ''}>${c.name}</option>`).join('')}
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
                <div style="font-weight:800; font-size:13px;">
                  <span style="display:inline-block; background:#e0f2fe; color:#0369a1; padding:1px 8px; border-radius:6px; margin-left:6px; font-size:12px;">${item.quantity} علبة</span>
                  ${item.productName}
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                  سعر الجمهور: ${item.officialPrice} ج.م (خصم: ${item.saleDiscountRate}%) | الصافي للعلبة: ${item.netUnitPrice.toFixed(2)} ج.م
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

    <!-- Sales Invoice Actions (PDF & WhatsApp & Confirm) -->
    <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <button class="btn btn-pdf" onclick="downloadCurrentSalesDraftPDF()" ${currentSalesItems.length === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} title="تحميل فاتورة PDF منسقة للعميل">
          📄 تحميل فاتورة PDF
        </button>
        <button class="btn btn-whatsapp" onclick="shareCurrentSalesDraftPDFToWhatsApp()" ${currentSalesItems.length === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} title="إرسال ملف PDF عبر واتساب">
          📲 إرسال PDF عبر واتساب
        </button>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 2fr; gap:8px;">
        <button class="btn btn-outline" onclick="previewCurrentSalesDraftModal()" ${currentSalesItems.length === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} title="معاينة وطباعة الفاتورة">
          👁️ معاينة وطباعة
        </button>
        <button class="btn btn-success" style="font-size:15px; height:48px;" onclick="confirmSalesInvoice()" ${currentSalesItems.length === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          ✅ تأكيد الفاتورة وخصم المخزون
        </button>
      </div>
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
  text += `*بنود الأدوية (العدد - الصنف):*\n`;

  items.forEach((it) => {
    text += `▪ *العدد: ${it.quantity} علبة* — *${it.productName}*\n`;
    text += `   • سعر الجمهور: ${it.officialPrice} ج.م | الخصم: ${it.saleDiscountRate}%\n`;
    text += `   • صافي العلبة: ${it.netUnitPrice.toFixed(2)} ج.م | الإجمالي: *${it.lineTotal.toFixed(2)} ج.م*\n\n`;
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

  shareCurrentSalesDraftPDFToWhatsApp();
}

// =============================================================
// PDF INVOICE REPORTING & WHATSAPP SHARING (Direct 2D Canvas Engine)
// =============================================================

function formatInvoiceDate(timestamp) {
  try {
    const d = new Date(timestamp || Date.now());
    return d.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return new Date().toLocaleDateString('ar-EG');
  }
}

function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function renderInvoiceToCanvas(inv) {
  const items = toCleanArray(inv.items);
  const subtotalOfficial = items.reduce((acc, it) => acc + ((Number(it.quantity) || 0) * (Number(it.officialPrice) || 0)), 0);
  const grandTotal = Number(inv.grandTotal) || items.reduce((acc, it) => acc + (Number(it.lineTotal) || 0), 0);
  const totalDiscAmount = Math.max(0, subtotalOfficial - grandTotal);
  const totalUnits = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

  const W = 1240;
  const rowH = 54;
  const H = Math.max(1750, 440 + (items.length * rowH) + 460);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const FONT = "'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";

  // 1. White Page Background & Border Frame
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  drawRoundedRect(ctx, 28, 28, W - 56, H - 56, 12, '#ffffff', '#cbd5e1', 2);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(30, 30, W - 60, 10);

  // 2. Header Section (Right: Branding, Left: Official Invoice Badge)
  drawRoundedRect(ctx, W - 132, 62, 72, 72, 16, '#e0f2fe', '#7dd3fc', 2);
  ctx.font = '38px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('💊', W - 96, 111);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.font = '800 32px ' + FONT;
  ctx.fillStyle = '#0369a1';
  ctx.fillText('مدير مبيعات الأدويه', W - 150, 96);

  ctx.font = '700 17px ' + FONT;
  ctx.fillStyle = '#64748b';
  ctx.fillText('منظومة توزيع الأدوية والمخزون الصيدلي الذكية', W - 150, 128);

  // Left Header Badge & Number
  drawRoundedRect(ctx, 60, 58, 245, 44, 10, '#0284c7', null);
  ctx.textAlign = 'center';
  ctx.font = '800 20px ' + FONT;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('فاتورة مبيعات رسمية', 182, 87);

  ctx.textAlign = 'left';
  ctx.direction = 'ltr';
  ctx.font = '800 20px ' + FONT;
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Invoice: #' + (inv.invoiceNumber || 'SAL-000'), 60, 128);

  ctx.direction = 'rtl';
  ctx.textAlign = 'left';
  ctx.font = '700 15px ' + FONT;
  ctx.fillStyle = '#475569';
  ctx.fillText('التاريخ: ' + formatInvoiceDate(inv.date), 60, 156);

  // Header Bottom Divider
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 178);
  ctx.lineTo(W - 60, 178);
  ctx.stroke();

  // 3. Customer & Meta Info Box
  drawRoundedRect(ctx, 60, 198, W - 120, 136, 12, '#f8fafc', '#cbd5e1', 1.5);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(480, 214);
  ctx.lineTo(480, 318);
  ctx.stroke();

  // Right side: Customer Details
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.font = '700 15px ' + FONT;
  ctx.fillStyle = '#64748b';
  ctx.fillText('بيانات العميل / الصيدلية المستلمة:', W - 85, 228);

  ctx.font = '800 24px ' + FONT;
  ctx.fillStyle = '#0f172a';
  ctx.fillText('العميل: ' + (inv.customerName || 'عميل نقدي عام'), W - 85, 266);

  const phoneStr = inv.customerPhone ? ('رقم الهاتف: ' + inv.customerPhone) : 'رقم الهاتف: —';
  const addrStr = inv.customerAddress ? ('   |   العنوان: ' + inv.customerAddress) : '';
  ctx.font = '700 16px ' + FONT;
  ctx.fillStyle = '#334155';
  ctx.fillText(phoneStr + addrStr, W - 85, 304);

  // Left side: Invoice Status & Counts
  drawRoundedRect(ctx, 275, 214, 180, 34, 8, '#dcfce7', '#86efac', 1);
  ctx.textAlign = 'center';
  ctx.font = '800 15px ' + FONT;
  ctx.fillStyle = '#15803d';
  ctx.fillText('✓ فاتورة معتمدة', 365, 237);

  ctx.textAlign = 'right';
  ctx.font = '700 16px ' + FONT;
  ctx.fillStyle = '#334155';
  ctx.fillText('عدد الأصناف بالفاتورة: ' + items.length + ' صنف', 455, 278);
  ctx.fillText('إجمالي عدد العبوات: ' + totalUnits + ' علبة', 455, 308);

  // 4. Items Table Header (Starts on the right with Quantity/Count instead of serial number)
  // Columns RTL:
  // [1040..1180] العدد / الكمية (center 1110)
  // [610..1040] اسم الصنف / الدواء (right 1022)
  // [470..610] سعر الجمهور (center 540)
  // [355..470] الخصم % (center 412.5)
  // [215..355] صافي العلبة (center 285)
  // [60..215] الإجمالي الصافي (center 137.5)
  const tableY = 356;
  const headerH = 52;
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(60, tableY, 1120, headerH);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  [215, 355, 470, 610, 1040].forEach(vx => {
    ctx.beginPath();
    ctx.moveTo(vx, tableY);
    ctx.lineTo(vx, tableY + headerH);
    ctx.stroke();
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 17px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText('العدد / الكمية', 1110, tableY + 33);
  ctx.textAlign = 'right';
  ctx.fillText('اسم الصنف / الدواء', 1022, tableY + 33);
  ctx.textAlign = 'center';
  ctx.fillText('سعر الجمهور', 540, tableY + 33);
  ctx.fillText('الخصم %', 412.5, tableY + 33);
  ctx.fillText('صافي العلبة', 285, tableY + 33);
  ctx.fillText('الإجمالي الصافي', 137.5, tableY + 33);

  // 5. Items Table Rows
  let curY = tableY + headerH;
  items.forEach((it, idx) => {
    ctx.fillStyle = (idx % 2 === 0) ? '#ffffff' : '#f1f5f9';
    ctx.fillRect(60, curY, 1120, rowH);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, curY, 1120, rowH);

    [215, 355, 470, 610, 1040].forEach(vx => {
      ctx.beginPath();
      ctx.moveTo(vx, curY);
      ctx.lineTo(vx, curY + rowH);
      ctx.stroke();
    });

    const textY = curY + 34;
    const qty = Number(it.quantity) || 0;
    const offPrice = Number(it.officialPrice) || 0;
    const discRate = Number(it.saleDiscountRate) || 0;
    const netUnit = Number(it.netUnitPrice) || (offPrice * (1 - discRate / 100));
    const lineTot = Number(it.lineTotal) || (qty * netUnit);

    // Col 1 (Rightmost): Quantity / Count
    ctx.textAlign = 'center';
    ctx.font = '800 18px ' + FONT;
    ctx.fillStyle = '#0369a1';
    ctx.fillText(qty + ' علبة', 1110, textY);

    // Col 2: Product Name
    ctx.textAlign = 'right';
    ctx.font = '800 17px ' + FONT;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(String(it.productName || ''), 1022, textY, 396);

    // Col 3: Official Price
    ctx.textAlign = 'center';
    ctx.font = '700 16px ' + FONT;
    ctx.fillStyle = '#475569';
    ctx.fillText(offPrice.toFixed(2) + ' ج.م', 540, textY);

    // Col 4: Discount %
    ctx.font = '800 16px ' + FONT;
    ctx.fillStyle = '#b45309';
    ctx.fillText(discRate.toFixed(1) + '%', 412.5, textY);

    // Col 5: Net Unit Price
    ctx.font = '800 16px ' + FONT;
    ctx.fillStyle = '#0369a1';
    ctx.fillText(netUnit.toFixed(2) + ' ج.م', 285, textY);

    // Col 6: Line Total
    ctx.font = '800 17px ' + FONT;
    ctx.fillStyle = '#059669';
    ctx.fillText(lineTot.toFixed(2) + ' ج.م', 137.5, textY);

    curY += rowH;
  });

  // 6. Financial Summary Box
  const totalsY = curY + 28;
  drawRoundedRect(ctx, 60, totalsY, 500, 178, 12, '#f8fafc', '#cbd5e1', 1.5);

  ctx.textAlign = 'right';
  ctx.font = '700 17px ' + FONT;
  ctx.fillStyle = '#475569';
  ctx.fillText('إجمالي سعر الجمهور الرسمي:', 536, totalsY + 38);
  ctx.textAlign = 'left';
  ctx.font = '800 18px ' + FONT;
  ctx.fillStyle = '#0f172a';
  ctx.fillText(subtotalOfficial.toFixed(2) + ' ج.م', 84, totalsY + 38);

  ctx.textAlign = 'right';
  ctx.font = '700 17px ' + FONT;
  ctx.fillStyle = '#dc2626';
  ctx.fillText('إجمالي خصم المبيعات الممنوح:', 536, totalsY + 76);
  ctx.textAlign = 'left';
  ctx.font = '800 18px ' + FONT;
  ctx.fillStyle = '#dc2626';
  ctx.fillText('-' + totalDiscAmount.toFixed(2) + ' ج.م', 84, totalsY + 76);

  drawRoundedRect(ctx, 76, totalsY + 98, 468, 64, 10, '#ecfdf5', '#10b981', 2);
  ctx.textAlign = 'right';
  ctx.font = '800 20px ' + FONT;
  ctx.fillStyle = '#065f46';
  ctx.fillText('الصافي النهائي المستحق:', 524, totalsY + 138);
  ctx.textAlign = 'left';
  ctx.font = '800 24px ' + FONT;
  ctx.fillStyle = '#059669';
  ctx.fillText(grandTotal.toFixed(2) + ' ج.م', 96, totalsY + 138);

  // 7. Signatures & Stamp Footer
  const sigY = Math.max(totalsY + 235, H - 220);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, sigY - 24);
  ctx.lineTo(W - 60, sigY - 24);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '700 16px ' + FONT;
  ctx.fillStyle = '#334155';
  ctx.fillText('توقيع المحاسب / مسؤول البيع', W - 240, sigY + 10);
  ctx.fillText('توقيع العميل / المستلم', W / 2, sigY + 10);
  ctx.fillText('ختم الصيدلية / المؤسسة', 240, sigY + 10);

  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(W - 350, sigY + 65);
  ctx.lineTo(W - 130, sigY + 65);
  ctx.moveTo((W / 2) - 110, sigY + 65);
  ctx.lineTo((W / 2) + 110, sigY + 65);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(240, sigY + 58, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = '700 12px ' + FONT;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('الختم الرسمي', 240, sigY + 63);

  // Bottom Note
  ctx.font = '700 14px ' + FONT;
  ctx.fillStyle = '#64748b';
  ctx.fillText('تم إصدار هذا التقرير آلياً عبر منظومة «مدير مبيعات الأدويه» • شكراً لحسن تعاملكم وثقتكم بنا', W / 2, H - 48);

  return canvas;
}

function buildDirectPdfFromCanvas(canvas) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64 = dataUrl.split(',')[1];
  const binStr = atob(base64);
  const imgBytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    imgBytes[i] = binStr.charCodeAt(i);
  }

  const pageW = 595.28;
  const pageH = Number((pageW * (canvas.height / canvas.width)).toFixed(2));
  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;

  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let byteLength = 0;

  function pushStr(str) {
    const arr = encoder.encode(str);
    chunks.push(arr);
    byteLength += arr.length;
  }
  function pushBytes(arr) {
    chunks.push(arr);
    byteLength += arr.length;
  }
  function startObj(id) {
    offsets[id] = byteLength;
    pushStr(`${id} 0 obj\n`);
  }

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  startObj(1);
  pushStr('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  startObj(2);
  pushStr('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  startObj(3);
  pushStr(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);

  startObj(4);
  pushStr(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`);
  pushBytes(imgBytes);
  pushStr('\nendstream\nendobj\n');

  startObj(5);
  pushStr(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  const xrefOffset = byteLength;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    pushStr(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}

function buildInvoicePrintableHTML(inv) {
  const canvas = renderInvoiceToCanvas(inv);
  const imgDataUrl = canvas.toDataURL('image/png');
  return `
    <div id="invoiceReportA4Container" style="width:100%; max-width:780px; margin:0 auto; background:#ffffff; text-align:center;">
      <img src="${imgDataUrl}" alt="فاتورة مبيعات ${inv.invoiceNumber}" style="width:100%; height:auto; display:block; border:1px solid #cbd5e1; border-radius:8px;" />
    </div>
  `;
}

async function generateInvoicePDFBlob(inv) {
  if (document.fonts && document.fonts.ready) {
    try {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 600))]);
    } catch (e) {}
  }

  const canvas = renderInvoiceToCanvas(inv);

  if (typeof html2pdf !== 'undefined') {
    try {
      const opt = {
        margin: [6, 6, 6, 6],
        filename: `فاتورة_مبيعات_${inv.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      const blob = await html2pdf().set(opt).from(canvas, 'canvas').outputPdf('blob');
      if (blob && blob.size > 1000) {
        return blob;
      }
    } catch (e) {
      console.warn('html2pdf canvas pipeline fallback:', e);
    }
  }

  return buildDirectPdfFromCanvas(canvas);
}

async function downloadSalesInvoicePDF(inv) {
  if (!inv || !inv.items || inv.items.length === 0) {
    showToast("الفاتورة فارغة ولا تحتوي على أصناف!", "error");
    return;
  }

  showToast("⏳ جاري إنشاء وتنسيق تقرير الفاتورة بصيغة PDF...", "info");
  try {
    const pdfBlob = await generateInvoicePDFBlob(inv);
    const fileName = `فاتورة_مبيعات_${inv.invoiceNumber}.pdf`;
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    showToast("✅ تم تنزيل تقرير الفاتورة PDF بنجاح!", "success");
  } catch (err) {
    console.error(err);
    showToast("تعذر إنشاء ملف PDF تلقائياً، جاري فتح الطباعة المباشرة", "error");
    printSalesInvoiceA4(inv);
  }
}

async function shareSalesInvoicePDFViaWhatsApp(inv) {
  if (!inv || !inv.items || inv.items.length === 0) {
    showToast("الفاتورة فارغة ولا تحتوي على أدوية!", "error");
    return;
  }

  showToast("⏳ جاري تجهيز تقرير الفاتورة PDF للمشاركة عبر واتساب...", "info");
  try {
    const pdfBlob = await generateInvoicePDFBlob(inv);
    const fileName = `فاتورة_مبيعات_${inv.invoiceNumber}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Check if browser supports Web Share API with files (Android / iOS)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `فاتورة مبيعات ${inv.invoiceNumber}`,
        text: `مرفق لسيادتكم تقرير فاتورة مبيعات الأدوية رقم (${inv.invoiceNumber}) - صافي الفاتورة: ${Number(inv.grandTotal).toFixed(2)} ج.م`
      });
      showToast("✅ تم فتح نافذة المشاركة بنجاح لإرسال الـ PDF عبر واتساب!");
      return;
    }

    // Fallback for Desktop or devices without direct file sharing:
    // 1. Download the PDF file directly to device:
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

    // 2. Open WhatsApp with pre-filled professional notification:
    const cleanPhone = (inv.customerPhone || '').replace(/^0/, '20');
    const waText = `السلام عليكم ورحمة الله وبركاته،\nمرفق لسيادتكم تقرير فاتورة مبيعات الأدوية رقم (${inv.invoiceNumber})\n💰 صافي الفاتورة: ${Number(inv.grandTotal).toFixed(2)} ج.م\nتم تحميل ملف الفاتورة بصيغة (PDF) منسق رسمياً إلى جهازك، يرجى الاطلاع على المرفق.\nشكراً لتعاملكم الراقي معنا!`;
    const encodedText = encodeURIComponent(waText);
    const waUrl = cleanPhone.length >= 10 
      ? `https://wa.me/${cleanPhone}?text=${encodedText}` 
      : `https://wa.me/?text=${encodedText}`;

    window.open(waUrl, '_blank');

    // 3. Informative instruction modal:
    openAppModal("📲 تم تجهيز الفاتورة وفتح واتساب", `
      <div style="text-align:center; padding:10px 4px;">
        <div style="font-size:46px; margin-bottom:8px;">📄✨</div>
        <h3 style="color:#059669; font-weight:800; margin-bottom:8px;">تم تنزيل ملف الفاتورة PDF بنجاح!</h3>
        <p style="font-size:13px; color:#475569; line-height:1.6; margin-bottom:14px;">
          تم حفظ ملف <b>${fileName}</b> في جهازك، وتم فتح محادثة واتساب الخاصة بالعميل.<br>
          ما عليك سوى الضغط على علامة <b>المرفقات (📎)</b> في واتساب وإرسال ملف الفاتورة للعميل مباشرة.
        </p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <a href="${waUrl}" target="_blank" class="btn btn-whatsapp" style="text-decoration:none;">
            💬 إعادة فتح واتساب للعميل
          </a>
          <button class="btn btn-primary" onclick="closeAppModal()">
            حسناً، فهمت
          </button>
        </div>
      </div>
    `);
  } catch (err) {
    console.error(err);
    showToast("تعذر إنشاء تقرير PDF: " + err.message, "error");
  }
}

function printSalesInvoiceA4(inv) {
  if (!inv || !inv.items || inv.items.length === 0) {
    showToast("الفاتورة فارغة!", "error");
    return;
  }

  const canvas = renderInvoiceToCanvas(inv);
  const imgDataUrl = canvas.toDataURL('image/png');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast("يرجى السماح بالنوافذ المنبثقة لإتمام الطباعة!", "error");
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة مبيعات ${inv.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; text-align: center; }
        img { width: 100%; max-width: 210mm; height: auto; display: block; margin: 0 auto; }
        @media print {
          @page { size: A4 portrait; margin: 5mm; }
        }
      </style>
    </head>
    <body>
      <img src="${imgDataUrl}" onload="window.focus(); window.print();" />
    </body>
    </html>
  `);
  printWindow.document.close();
}

let currentPreviewingInvoice = null;

function previewSalesInvoiceModal(inv) {
  if (!inv || !inv.items || inv.items.length === 0) {
    showToast("الفاتورة فارغة!", "error");
    return;
  }

  currentPreviewingInvoice = inv;
  const html = `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
        <button class="btn btn-pdf btn-small" onclick="downloadSalesInvoicePDF(currentPreviewingInvoice)">
          📥 تحميل PDF
        </button>
        <button class="btn btn-whatsapp btn-small" onclick="shareSalesInvoicePDFViaWhatsApp(currentPreviewingInvoice)">
          📲 إرسال PDF واتساب
        </button>
        <button class="btn btn-outline btn-small" onclick="printSalesInvoiceA4(currentPreviewingInvoice)">
          🖨️ طباعة الفاتورة
        </button>
      </div>

      <div style="max-height:65vh; overflow-y:auto; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc; padding:6px;">
        ${buildInvoicePrintableHTML(inv)}
      </div>
    </div>
  `;
  openAppModal(`معاينة فاتورة مبيعات (${inv.invoiceNumber})`, html, true);
}

function getCurrentSalesDraftInvoice() {
  const invoiceNo = document.getElementById('saleInvoiceNo') ? document.getElementById('saleInvoiceNo').value : (currentSalesInvoiceNo || `SAL-${Date.now() % 100000}`);
  const selectEl = document.getElementById('saleCustomerSelect');
  const custId = (selectEl && selectEl.value) ? Number(selectEl.value) : currentSalesCustomerId;
  const customer = db.customers.find(c => c.id == custId) || db.customers[0] || { id: 1, name: "عميل عام", phone: "", address: "" };
  const grandTotal = currentSalesItems.reduce((acc, it) => acc + it.lineTotal, 0);

  return {
    id: Date.now(),
    invoiceNumber: invoiceNo,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone || "",
    customerAddress: customer.address || "",
    date: Date.now(),
    grandTotal: grandTotal,
    items: [...currentSalesItems]
  };
}

function downloadCurrentSalesDraftPDF() {
  if (currentSalesItems.length === 0) {
    showToast("يرجى إضافة أدوية للفاتورة أولاً!", "error");
    return;
  }
  downloadSalesInvoicePDF(getCurrentSalesDraftInvoice());
}

function shareCurrentSalesDraftPDFToWhatsApp() {
  if (currentSalesItems.length === 0) {
    showToast("يرجى إضافة أدوية للفاتورة أولاً!", "error");
    return;
  }
  shareSalesInvoicePDFViaWhatsApp(getCurrentSalesDraftInvoice());
}

function previewCurrentSalesDraftModal() {
  if (currentSalesItems.length === 0) {
    showToast("يرجى إضافة أدوية للفاتورة أولاً!", "error");
    return;
  }
  previewSalesInvoiceModal(getCurrentSalesDraftInvoice());
}

let lastCompletedSalesInvoice = null;

function openSalesInvoiceSuccessModal(inv) {
  lastCompletedSalesInvoice = inv;
  const html = `
    <div style="text-align:center; padding:6px 0;">
      <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:10px; color:#15803d; font-weight:800; font-size:16px;">
        <span style="background:#dcfce7; width:32px; height:32px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;">✓</span>
        <span>تم حفظ وإصدار فاتورة البيع بنجاح!</span>
      </div>

      <!-- Live Visual Invoice Report Preview -->
      <div style="max-height:48vh; overflow-y:auto; border:1.5px solid #cbd5e1; border-radius:10px; background:#f8fafc; padding:6px; margin-bottom:12px;">
        ${buildInvoicePrintableHTML(inv)}
      </div>

      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <button class="btn btn-whatsapp" style="font-size:13px;" onclick="shareSalesInvoicePDFViaWhatsApp(lastCompletedSalesInvoice)">
            📲 إرسال PDF واتساب
          </button>
          <button class="btn btn-pdf" style="font-size:13px;" onclick="downloadSalesInvoicePDF(lastCompletedSalesInvoice)">
            📄 تحميل الفاتورة PDF
          </button>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <button class="btn btn-outline" onclick="printSalesInvoiceA4(lastCompletedSalesInvoice)">
            🖨️ طباعة الفاتورة A4
          </button>
          <button class="btn btn-primary" onclick="closeAppModal(); navigateTo('sales');">
            ➕ فاتورة بيع جديدة
          </button>
        </div>
      </div>
    </div>
  `;
  openAppModal(`تقرير فاتورة المبيعات (#${inv.invoiceNumber})`, html, true);
}

function confirmSalesInvoice() {
  if (currentSalesItems.length === 0) {
    showToast("يرجى إضافة دواء واحد على الأقل للفاتورة!", "error");
    return;
  }

  const invoiceNo = document.getElementById('saleInvoiceNo') ? document.getElementById('saleInvoiceNo').value : (currentSalesInvoiceNo || `SAL-${Date.now() % 100000}`);
  const selectEl = document.getElementById('saleCustomerSelect');
  const custId = (selectEl && selectEl.value) ? Number(selectEl.value) : currentSalesCustomerId;
  const customer = db.customers.find(c => c.id == custId) || db.customers[0] || { id: 1, name: "عميل عام", phone: "", address: "" };
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

  const savedInvoice = {
    id: Date.now(),
    invoiceNumber: invoiceNo,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone || "",
    customerAddress: customer.address || "",
    date: Date.now(),
    grandTotal: grandTotal,
    items: [...currentSalesItems]
  };

  db.salesInvoices.unshift(savedInvoice);

  saveDB();
  currentSalesItems = [];
  currentSalesInvoiceNo = `SAL-${Math.floor(10000 + Math.random() * 90000)}`;
  calculateAndRenderSalesUI();

  showToast("تم إصدار وحفظ فاتورة البيع وخصم المخزون بنجاح!", "success");
  openSalesInvoiceSuccessModal(savedInvoice);
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
  const totalStockNetSaleVal = db.products.reduce((acc, p) => {
    const netSale = (p.officialPrice || 0) * (1 - (p.saleDiscountRate || 0) / 100);
    return acc + ((p.stockQuantity || 0) * netSale);
  }, 0);
  const totalExpectedProfit = totalStockNetSaleVal - totalStockCostVal;

  screenContainer.innerHTML = `
    <!-- Total Inventory Valuation KPI Cards -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:8px; margin-bottom:10px;">
      <div class="card" style="background:#f0fdf4; border-color:#bbf7d0; padding:10px; text-align:center;">
        <span style="font-size:11px; color:#166534; display:block; font-weight:700;">📦 إجمالي رصيد المخزن</span>
        <b style="font-size:16px; color:#15803d; font-weight:800;">${totalStockQty} علبة</b>
      </div>
      <div class="card" style="background:#e0f2fe; border-color:#bae6fd; padding:10px; text-align:center;">
        <span style="font-size:11px; color:#0369a1; display:block; font-weight:700;">💰 رأس مال البضاعة (شراء)</span>
        <b style="font-size:15px; color:#0284c7; font-weight:800;">${totalStockCostVal.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</b>
      </div>
      <div class="card" style="background:#fef3c7; border-color:#fde68a; padding:10px; text-align:center;">
        <span style="font-size:11px; color:#92400e; display:block; font-weight:700;">📈 صافي قيمة البضاعة بالأرباح التقريبية</span>
        <b style="font-size:15px; color:#b45309; font-weight:800; display:block;">${totalStockNetSaleVal.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</b>
        <span style="font-size:11px; color:#15803d; font-weight:800; display:inline-block; margin-top:2px; background:#dcfce7; padding:1px 8px; border-radius:6px;">
          الربح التقريبي: +${totalExpectedProfit.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م
        </span>
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
        const netSalePrice = (p.officialPrice || 0) * (1 - (p.saleDiscountRate || 0) / 100);
        const totalItemCost = (p.stockQuantity || 0) * netPurchasePrice;
        const totalItemNetSale = (p.stockQuantity || 0) * netSalePrice;
        const totalItemProfit = totalItemNetSale - totalItemCost;

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
            <div>خصم البيع: <b style="color:var(--warning);">${p.saleDiscountRate}%</b> (صافي: ${netSalePrice.toFixed(2)} ج.م)</div>
          </div>

          <!-- Stock Valuation Section for this specific item -->
          <div style="margin-top:8px; padding:8px 10px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
            <div>
              <span style="font-size:11px; color:#1e40af; font-weight:700; display:block;">💰 إجمالي تكلفة البضاعة (شراء):</span>
              <b style="font-size:14px; color:#0284c7; font-weight:800;">${totalItemCost.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</b>
            </div>
            <div style="text-align:left;">
              <span style="font-size:10px; color:#166534; font-weight:700; display:block;">📈 صافي القيمة بالربح (خصم بيع ${p.saleDiscountRate}%)</span>
              <b style="font-size:13px; color:#15803d; font-weight:800;">${totalItemNetSale.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</b>
              <span style="font-size:10px; color:#059669; font-weight:800; display:block;">(الربح التقريبي: +${totalItemProfit.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م)</span>
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

let currentDetailInvoice = null;

function openSalesInvoiceDetail(invId) {
  const inv = db.salesInvoices.find(i => i.id === invId);
  if (!inv) return;
  currentDetailInvoice = inv;

  const text = generateWhatsAppText(inv.invoiceNumber, inv.customerName, inv.items, inv.grandTotal);
  const encodedText = encodeURIComponent(text);
  const cleanPhone = (inv.customerPhone || '').replace(/^0/, '20');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

  const html = `
    <div>
      <div style="padding:10px 14px; background:#f0fdf4; border-radius:10px; margin-bottom:12px; border:1px solid #bbf7d0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:800; color:var(--secondary); font-size:15px;">فاتورة رقم: #${inv.invoiceNumber}</span>
          <span class="badge badge-green">معتمدة ومسددة</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
          العميل: <b>${inv.customerName}</b> | التاريخ: ${formatInvoiceDate(inv.date)}
        </div>
        ${inv.customerPhone ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">الهاتف: <span style="direction:ltr; display:inline-block;">${inv.customerPhone}</span></div>` : ''}
      </div>

      <div style="font-size:12px; font-weight:800; margin-bottom:8px; color:var(--text-main);">الأدوية في الفاتورة (${inv.items.length}):</div>
      <div style="display:flex; flex-direction:column; gap:6px; max-height:200px; overflow-y:auto; padding:2px;">
        ${inv.items.map(it => `
          <div style="padding:8px 10px; background:#f8fafc; border-radius:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; font-size:13px;">
                <span style="display:inline-block; background:#e0f2fe; color:#0369a1; padding:1px 8px; border-radius:6px; margin-left:6px; font-size:12px; font-weight:800;">${it.quantity} علبة</span>
                ${it.productName}
              </div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                سعر الجمهور: ${Number(it.officialPrice).toFixed(2)} ج.م (خصم: ${Number(it.saleDiscountRate).toFixed(1)}%)
              </div>
            </div>
            <div style="font-weight:800; color:var(--secondary); font-size:13px;">
              ${Number(it.lineTotal).toFixed(2)} ج.م
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; font-weight:800; font-size:16px;">
        <span>الإجمالي الصافي:</span>
        <span style="color:var(--secondary);">${Number(inv.grandTotal).toFixed(2)} ج.م</span>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:14px;">
        <button class="btn btn-whatsapp" onclick="shareSalesInvoicePDFViaWhatsApp(currentDetailInvoice)">
          📲 إرسال تقرير PDF للعميل عبر واتساب
        </button>
        <button class="btn btn-pdf" onclick="downloadSalesInvoicePDF(currentDetailInvoice)">
          📄 تحميل تقرير الفاتورة PDF
        </button>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <button class="btn btn-outline" onclick="printSalesInvoiceA4(currentDetailInvoice)">
            🖨️ طباعة A4
          </button>
          <button class="btn btn-outline" onclick="previewSalesInvoiceModal(currentDetailInvoice)">
            👁️ معاينة الفاتورة
          </button>
        </div>
        <a href="${waUrl}" target="_blank" class="btn btn-outline" style="text-decoration:none; font-size:11px; color:#64748b;">
          💬 إرسال نص الفاتورة القديم لواتساب (بدون PDF)
        </a>
      </div>
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
