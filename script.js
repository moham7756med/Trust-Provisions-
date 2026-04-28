// ╔══════════════════════════════════════════════════════════╗
// ║        تموينات الثقة للمواد الغذائية - ذمار           ║
// ║        Developed by: عبد الوهاب عبد الواحد الريمي      ║
// ║        https://abdul-s-page.vercel.app/                ║
// ╚══════════════════════════════════════════════════════════╝

// ==================== الثوابت والإعدادات ====================
const STORE_INFO = { 
    name: 'تموينات الثقة للمواد الغذائية', 
    city: 'ذمار', 
    address: 'خط الحسينية', 
    phone: '775647152', 
    fullPhone: '967775647152' 
};

const DESIGNER_CODE = 'Thiqaat@2024#Dhamar';
const DEVELOPER_URL = 'https://abdul-s-page.vercel.app/';
const DEVELOPER_NAME = 'عبد الوهاب عبد الواحد الريمي';
const MAX_ADMIN_ACCOUNTS = 2;

// ==================== حالة المستخدم ====================
let currentUser = null;
let isAdminLoggedIn = false;

// ==================== PWA ====================
let deferredPrompt;
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { 
        navigator.serviceWorker.register('sw.js').catch(() => {}); 
    });
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); 
        deferredPrompt = e;
        setTimeout(() => { 
            if (!isAppInstalled() && !localStorage.getItem('pwa-banner-dismissed')) {
                document.getElementById('pwaInstallBanner').style.display = 'block'; 
            }
        }, 3000);
    });
    window.addEventListener('appinstalled', () => {
        document.getElementById('pwaInstallBanner').style.display = 'none'; 
        deferredPrompt = null;
        localStorage.setItem('pwa-installed', 'true'); 
        showToast('✅ تم تثبيت التطبيق!');
    });
}

function isAppInstalled() { 
    return window.matchMedia('(display-mode: standalone)').matches || 
           navigator.standalone || 
           localStorage.getItem('pwa-installed') === 'true'; 
}

if (isAppInstalled()) {
    document.getElementById('pwaInstallBanner').style.display = 'none';
}

// ==================== قاعدة البيانات ====================
const DB_NAME = 'ThiqaatDhamarDB'; 
const DB_VERSION = 4; 
let db;

const LOCAL_IMAGES = [
    'red lentils.png','white beans.png','Diwan Rice.png','Peas of bliss.png','ground wheat.png',
    'Ear of wheat flour.png','Gwizi Tuna.png','Beans of happiness.png','Luxury rice.png','local wheat.png',
    'Cake Pop.png','Big break.png','Big stars.png','Biscuits are born.png','Sinbad the Coconut Mini.png',
    'Tops biscuits.png','Finger break.png','Bourbon biscuits.png','Great mountain power.png',
    'The power of a small mountain.png','Delsey large ginger.png','Lions strength barley.png',
    'Delsey Red Big.png','Delsey Red Little.png','Dream Red Small.png','Dream yellow Small.png',
    'Dream Black Small.png','large premium juice.png','Rani Guava.png','Rani Mango.png',
    'Rani Orange Granules Juice.png','Rani Fuka Mushkil.png','Fruit cocktail juice.png',
    'Mango Caesar Juice.png','Pineapple Caesar Juice.png','Rani juice glass.png','small Shamlan water.png',
    'small autumn water.png','small sharp water.png','Sana a water is small.png','Wadi Al Ain water.png',
    'My countrys water is small.png','small cow s milk.png','large cow s milk.png','Yemeni milk (large).png',
    'large banana milk.png','Premium milk, small.png','Right of Rawab.png','Cream oil 4 lbs.png',
    'Lunar oil.png','Qamaria gheee.png','olive oil.png','Mixed spices.png','Rajavi Circuit.png',
    'Hawij Marq.png','Her disgust.png','cardamom.png','clove.png','black seed.png','black pepper.png',
    'Premium Yemeni coffee.png','local honey.png','affection.png','Hadhramaut Spices.png','local ghee.png',
    'Yemeni red dates.png','local barley.png','black local raisins.png','Local chewing gum.png','Yemeni dates.png'
];

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { 
            db = request.result; 
            updateDBStatus(true); 
            resolve(db); 
        };
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('products')) { 
                const s = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true }); 
                s.createIndex('category', 'category', { unique: false }); 
            }
            if (!db.objectStoreNames.contains('cart')) { 
                const s = db.createObjectStore('cart', { keyPath: 'id', autoIncrement: true }); 
                s.createIndex('productId', 'productId', { unique: false }); 
            }
            if (!db.objectStoreNames.contains('settings')) { 
                db.createObjectStore('settings', { keyPath: 'key' }); 
            }
            if (!db.objectStoreNames.contains('offers')) { 
                const s = db.createObjectStore('offers', { keyPath: 'id', autoIncrement: true }); 
                s.createIndex('productId', 'productId', { unique: false }); 
                s.createIndex('endDate', 'endDate', { unique: false }); 
            }
            if (!db.objectStoreNames.contains('users')) { 
                const s = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true }); 
                s.createIndex('phone', 'phone', { unique: true }); 
                s.createIndex('email', 'email', { unique: true }); 
                s.createIndex('role', 'role', { unique: false }); 
            }
        };
    });
}

function updateDBStatus(c) { 
    const icon = document.getElementById('dbStatusIconBtn');
    if (icon && icon.querySelector('img')) {
        const img = icon.querySelector('img');
        img.style.filter = c ? 'none' : 'grayscale(100%) brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5)';
        img.style.opacity = c ? '1' : '0.6';
    }
}

// ==================== عمليات المستخدمين ====================
async function addUser(user) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['users'], 'readwrite'); 
        const store = tx.objectStore('users');
        const request = store.add(user);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllUsers() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['users'], 'readonly'); 
        const store = tx.objectStore('users');
        const request = store.getAll(); 
        request.onsuccess = () => resolve(request.result); 
        request.onerror = () => reject(request.error);
    });
}

async function getUserByPhone(phone) {
    const users = await getAllUsers();
    return users.find(u => u.phone === phone);
}

async function getUserByEmail(email) {
    const users = await getAllUsers();
    return users.find(u => u.email === email);
}

async function deleteUser(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['users'], 'readwrite'); 
        const store = tx.objectStore('users');
        const request = store.delete(id); 
        request.onsuccess = () => resolve(); 
        request.onerror = () => reject(request.error);
    });
}

async function getAdminCount() {
    const users = await getAllUsers();
    return users.filter(u => u.role === 'admin').length;
}

// ==================== عمليات المنتجات ====================
async function addProduct(p) { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['products'],'readwrite'); 
        const s = tx.objectStore('products'); 
        const r = s.add(p); 
        r.onsuccess = () => res(r.result); 
        r.onerror = () => rej(r.error); 
    }); 
}

async function getAllProducts() { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['products'],'readonly'); 
        const s = tx.objectStore('products'); 
        const r = s.getAll(); 
        r.onsuccess = () => res(r.result); 
        r.onerror = () => rej(r.error); 
    }); 
}

async function deleteProduct(id) { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['products'],'readwrite'); 
        const s = tx.objectStore('products'); 
        const r = s.delete(id); 
        r.onsuccess = () => res(); 
        r.onerror = () => rej(r.error); 
    }); 
}

// ==================== عمليات العروض ====================
async function addOffer(o) { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['offers'],'readwrite'); 
        const s = tx.objectStore('offers'); 
        const r = s.add(o); 
        r.onsuccess = () => res(r.result); 
        r.onerror = () => rej(r.error); 
    }); 
}

async function getAllOffers() { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['offers'],'readonly'); 
        const s = tx.objectStore('offers'); 
        const r = s.getAll(); 
        r.onsuccess = () => res(r.result); 
        r.onerror = () => rej(r.error); 
    }); 
}

async function deleteOffer(id) { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['offers'],'readwrite'); 
        const s = tx.objectStore('offers'); 
        const r = s.delete(id); 
        r.onsuccess = () => res(); 
        r.onerror = () => rej(r.error); 
    }); 
}

async function getActiveOffers() { 
    const offers = await getAllOffers(); 
    const today = new Date().toISOString().split('T')[0]; 
    return offers.filter(o => o.startDate <= today && o.endDate >= today); 
}

function calcDiscountedPrice(op, dp) { 
    return Math.round(op * (1 - dp / 100)); 
}

// ==================== عمليات السلة ====================
async function addToCart(product) {
    const activeOffers = await getActiveOffers(); 
    const productOffer = activeOffers.find(o => o.productId === product.id);
    let fp = product.price, discountPercent = 0;
    if (productOffer) { 
        discountPercent = productOffer.discountPercent; 
        fp = calcDiscountedPrice(product.price, discountPercent); 
    }
    return new Promise((res, rej) => { 
        const tx = db.transaction(['cart'],'readwrite'); 
        const s = tx.objectStore('cart');
        const r = s.add({ 
            productId: product.id, 
            name: product.name, 
            price: product.price, 
            finalPrice: fp, 
            discountPercent: discountPercent, 
            category: product.category, 
            image: product.image, 
            quantity: 1, 
            addedAt: new Date().toISOString() 
        });
        r.onsuccess = () => res(r.result); 
        r.onerror = () => rej(r.error); 
    });
}

async function getCartItems() { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['cart'],'readonly'); 
        const s = tx.objectStore('cart'); 
        const r = s.getAll(); 
        r.onsuccess = () => res(r.result); 
        r.onerror = () => rej(r.error); 
    }); 
}

async function clearCart() { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['cart'],'readwrite'); 
        const s = tx.objectStore('cart'); 
        const r = s.clear(); 
        r.onsuccess = () => res(); 
        r.onerror = () => rej(r.error); 
    }); 
}

async function removeFromCart(id) { 
    return new Promise((res, rej) => { 
        const tx = db.transaction(['cart'],'readwrite'); 
        const s = tx.objectStore('cart'); 
        const r = s.delete(id); 
        r.onsuccess = () => res(); 
        r.onerror = () => rej(r.error); 
    }); 
}

// ==================== الثيم ====================
async function saveThemeSetting(d) { 
    return new Promise((res) => { 
        const tx = db.transaction(['settings'],'readwrite'); 
        const s = tx.objectStore('settings'); 
        s.put({key:'theme',value:d?'dark':'light'}); 
        tx.oncomplete = () => res(); 
    }); 
}

async function getThemeSetting() { 
    return new Promise((res) => { 
        const tx = db.transaction(['settings'],'readonly'); 
        const s = tx.objectStore('settings'); 
        const r = s.get('theme'); 
        r.onsuccess = () => res(r.result?.value || 'light'); 
    }); 
}

// ==================== المنتجات الافتراضية ====================
async function seedProducts() {
    const existing = await getAllProducts();
    if (existing.length === 0) {
        const defaults = [
            { name: 'عدس أحمر', price: 750, category: 'بقوليات', image: LOCAL_IMAGES[0] },
            { name: 'فاصوليا بيضاء', price: 750, category: 'بقوليات', image: LOCAL_IMAGES[1] },
            { name: 'رز بسمتي مزة الديوان', price: 3900, category: 'بقوليات', image: LOCAL_IMAGES[2] },
            { name: 'بازليا الهناء', price: 300, category: 'بقوليات', image: LOCAL_IMAGES[3] },
            { name: 'مطحوان', price: 'غير متوفر لان', category: 'بقوليات', image: LOCAL_IMAGES[4] },
            { name: 'دقيق سنابل', price: 'غير متوفر لان', category: 'بقوليات', image: LOCAL_IMAGES[5] },
            { name: 'تونة غويزي', price: 1200, category: 'بقوليات', image: LOCAL_IMAGES[6] },
            { name: 'فول مدمس الهناء', price: 250, category: 'بقوليات', image: LOCAL_IMAGES[7] },
            { name: 'رز بسمتي حبة طويل الفخامة', price: 3700, category: 'بقوليات', image: LOCAL_IMAGES[8] },
            { name: 'قمح', price: 'غير متوفر لان', category: 'بقوليات', image: LOCAL_IMAGES[9] },
            { name: 'كيك بوب', price: 150, category: 'حلويات', image: LOCAL_IMAGES[10] },
            { name: 'شوكولاتة بريك big', price: 150, category: 'حلويات', image: LOCAL_IMAGES[11] },
            { name: 'نجوم كبير', price: 100, category: 'حلويات', image: LOCAL_IMAGES[12] },
            { name: 'بسكوت ابو ولد', price: 200, category: 'حلويات', image: LOCAL_IMAGES[13] },
            { name: 'سندباد صغبر', price: 50, category: 'حلويات', image: LOCAL_IMAGES[14] },
            { name: 'بسكوت توبس', price: 100, category: 'حلويات', image: LOCAL_IMAGES[15] },
            { name: 'شوكولاتة بريك اصبع', price: 150, category: 'حلويات', image: LOCAL_IMAGES[16] },
            { name: 'بسكوت بروبون لاصلي', price: 150, category: 'حلويات', image: LOCAL_IMAGES[17] },
            { name: 'قوة جبل كبير صنعاء', price: 300, category: 'غازية', image: LOCAL_IMAGES[18] },
            { name: 'قوة جبل صغير صنعاء', price: 200, category: 'غازية', image: LOCAL_IMAGES[19] },
            { name: 'ديلسي زنجبيل صغير', price: 150, category: 'غازية', image: LOCAL_IMAGES[20] },
            { name: 'قوة اسد شعير', price: 250, category: 'غازية', image: LOCAL_IMAGES[21] },
            { name: 'ديلسي احمر كبير', price: 200, category: 'غازية', image: LOCAL_IMAGES[22] },
            { name: 'ديلسي احمر صغير', price: 150, category: 'غازية', image: LOCAL_IMAGES[23] },
            { name: 'دريم احمر صغير', price: 100, category: 'غازية', image: LOCAL_IMAGES[24] },
            { name: 'دريم اصفر صغير', price: 100, category: 'غازية', image: LOCAL_IMAGES[25] },
            { name: 'دريم كولا صغير', price: 100, category: 'غازية', image: LOCAL_IMAGES[26] },
            { name: 'عصير فاخر كبير', price: 800, category: 'عصيرات', image: LOCAL_IMAGES[27] },
            { name: 'عصير راني جوافة', price: 250, category: 'عصيرات', image: LOCAL_IMAGES[28] },
            { name: 'عصير راني مانجو', price: 250, category: 'عصيرات', image: LOCAL_IMAGES[29] },
            { name: 'عصير راني برتقال', price: 250, category: 'عصيرات', image: LOCAL_IMAGES[30] },
            { name: 'عصير راني مشكل فواكة', price: 250, category: 'عصيرات', image: LOCAL_IMAGES[31] },
            { name: 'عصير راني كوكتيل', price: 250, category: 'عصيرات', image: LOCAL_IMAGES[32] },
            { name: 'عصير سيزر مانجو', price: 350, category: 'عصيرات', image: LOCAL_IMAGES[33] },
            { name: 'عصير سيزر اناناس', price: 350, category: 'عصيرات', image: LOCAL_IMAGES[34] },
            { name: 'عصير راني زجاج مانجو', price: 200, category: 'عصيرات', image: LOCAL_IMAGES[35] },
            { name: 'مياه شملان صغير', price: 100, category: 'مياه', image: LOCAL_IMAGES[36] },
            { name: 'مياه خريف', price: 100, category: 'مياه', image: LOCAL_IMAGES[37] },
            { name: 'مياه حدة صغير', price: 100, category: 'مياه', image: LOCAL_IMAGES[38] },
            { name: 'مياه صنعاء صغير', price: 100, category: 'مياه', image: LOCAL_IMAGES[39] },
            { name: 'مياه وادي العين', price: 100, category: 'مياه', image: LOCAL_IMAGES[40] },
            { name: 'مياه بلادي صغير', price: 100, category: 'مياه', image: LOCAL_IMAGES[41] },
            { name: 'حليب بقري صغير', price: 200, category: 'ألبان', image: LOCAL_IMAGES[42] },
            { name: 'حليب بقري كبير', price: 350, category: 'ألبان', image: LOCAL_IMAGES[43] },
            { name: 'حليب يماني كبير', price: 250, category: 'ألبان', image: LOCAL_IMAGES[44] },
            { name: 'حليب بالموز كبير', price: 250, category: 'ألبان', image: LOCAL_IMAGES[45] },
            { name: 'حليب شاهي ممتاز', price: 250, category: 'ألبان', image: LOCAL_IMAGES[46] },
            { name: 'حقين رواب', price: 250, category: 'ألبان', image: LOCAL_IMAGES[47] },
            { name: 'زيت كريم كبير (4 لتر)', price: 4000, category: 'زيوت', image: LOCAL_IMAGES[48] },
            { name: 'زيت القمرية صغير', price: 1000, category: 'زيوت', image: LOCAL_IMAGES[49] },
            { name: 'سمن القمرية', price: 1500, category: 'زيوت', image: LOCAL_IMAGES[50] },
            { name: 'زيت الزيتون', price: 500, category: 'زيوت', image: LOCAL_IMAGES[51] },
            { name: 'بهارات مشكلة', price: 'غير متوفر لان', category: 'بهارات', image: LOCAL_IMAGES[52] },
            { name: 'حلبة', price: 300, category: 'بهارات', image: LOCAL_IMAGES[53] },
            { name: 'حويج مرق', price: 'ك:3000', category: 'بهارات', image: LOCAL_IMAGES[54] },
            { name: 'قرفة', price: 'ك:3000', category: 'بهارات', image: LOCAL_IMAGES[55] },
            { name: 'هيل', price: 'غير متوفر لان', category: 'بهارات', image: LOCAL_IMAGES[56] },
            { name: 'قرنفل', price: 'ك:7000', category: 'بهارات', image: LOCAL_IMAGES[57] },
            { name: 'حبة سواد', price: 'ك:3500', category: 'بهارات', image: LOCAL_IMAGES[58] },
            { name: 'فلفل اسود', price: 'غير متوفر لان', category: 'بهارات', image: LOCAL_IMAGES[59] },
            { name: 'بن يمني فاخر', price: 'ك:5000', category: 'يمني', image: LOCAL_IMAGES[60] },
            { name: 'عسل يمني طبيعي', price: 25000, category: 'يمني', image: LOCAL_IMAGES[61] },
            { name: 'حناء', price: 'ك:3500', category: 'يمني', image: LOCAL_IMAGES[62] },
            { name: 'بهارات حضرموت', price: 'غير متوفر لان', category: 'يمني', image: LOCAL_IMAGES[63] },
            { name: 'سمن بلدي يمني', price: 4000, category: 'يمني', image: LOCAL_IMAGES[64] },
            { name: 'تمر يمني(حمرا)', price: 'غير متوفر لان', category: 'يمني', image: LOCAL_IMAGES[65] },
            { name: 'شعير بلدي', price: 'غير متوفر لان', category: 'يمني', image: LOCAL_IMAGES[66] },
            { name: 'زبيب اسود', price: 'غير متوفر لان', category: 'يمني', image: LOCAL_IMAGES[67] },
            { name: 'لوبان يمني', price: 'غير متوفر لان', category: 'يمني', image: LOCAL_IMAGES[68] },
            { name: 'تمر يمني', price: 600, category: 'يمني', image: LOCAL_IMAGES[69] }
        ];
        for (const p of defaults) await addProduct(p);
        showToast('✅ تم إضافة المنتجات الافتراضية 🇾🇪');
    }
}

// ==================== عرض المنتجات ====================
function renderProductScroll(cid, products, offers) {
    const c = document.getElementById(cid); 
    if (!c) return;
    if (products.length === 0) { 
        c.innerHTML = '<div style="width:100%;text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-box-open"></i> لا توجد منتجات</div>'; 
        return; 
    }
    c.innerHTML = products.map(p => {
        const img = p.image || 'Trust Provisions.png'; 
        const offer = offers.find(o => o.productId === p.id);
        let pd = '', ob = '';
        if (offer && typeof p.price === 'number') { 
            const dp = calcDiscountedPrice(p.price, offer.discountPercent); 
            pd = `<span class="original-price">${p.price.toLocaleString()} ر.ي</span><span class="discount-percent">-${offer.discountPercent}%</span><br>${dp.toLocaleString()} ر.ي`; 
            ob = `<span class="offer-badge">🔥 عرض ${offer.discountPercent}%</span>`; 
        } else {
            pd = `${typeof p.price === 'number' ? p.price.toLocaleString() : p.price} ر.ي`;
        }
        return `<div class="product-card ${offer?'offer-active':''}" onclick="quickAddToCart(${p.id})"><div class="product-image"><img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='Trust Provisions.png'">${ob}</div><span class="category-badge">${p.category}</span><h4>${p.name}</h4><div class="product-price">${pd}</div><small class="add-to-cart-hint"><i class="fas fa-plus-circle"></i> اضغط للإضافة</small></div>`;
    }).join('');
}

function renderProductGrid(container, products, offers) {
    if (products.length === 0) { 
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-box-open" style="font-size:3rem;opacity:0.5;"></i><p>مافيش منتجات</p></div>'; 
        return; 
    }
    container.innerHTML = products.map(p => {
        const img = p.image || 'Trust Provisions.png'; 
        const offer = offers.find(o => o.productId === p.id);
        let pd = '', ob = '';
        if (offer && typeof p.price === 'number') { 
            const dp = calcDiscountedPrice(p.price, offer.discountPercent); 
            pd = `<span class="original-price">${p.price.toLocaleString()} ر.ي</span><span class="discount-percent">-${offer.discountPercent}%</span><br>${dp.toLocaleString()} ر.ي`; 
            ob = `<span class="offer-badge">🔥 عرض ${offer.discountPercent}%</span>`; 
        } else {
            pd = `${typeof p.price === 'number' ? p.price.toLocaleString() : p.price} ر.ي`;
        }
        return `<div class="product-card ${offer?'offer-active':''}" onclick="quickAddToCart(${p.id})"><div class="product-image"><img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='Trust Provisions.png'">${ob}</div><span class="category-badge">${p.category}</span><h4>${p.name}</h4><div class="product-price">${pd}</div><small class="add-to-cart-hint"><i class="fas fa-plus-circle"></i> اضغط للإضافة</small></div>`;
    }).join('');
}

async function renderAllProducts() {
    const products = await getAllProducts(); 
    const offers = await getActiveOffers();
    renderProductScroll('legumesGrainsContainer', products.filter(p => p.category === 'بقوليات'), offers);
    renderProductScroll('sweetsContainer', products.filter(p => p.category === 'حلويات'), offers);
    renderProductScroll('softDrinksContainer', products.filter(p => p.category === 'غازية'), offers);
    renderProductScroll('juicesContainer', products.filter(p => p.category === 'عصيرات'), offers);
    renderProductScroll('waterContainer', products.filter(p => p.category === 'مياه'), offers);
    renderProductScroll('dairyContainer', products.filter(p => p.category === 'ألبان'), offers);
    renderProductScroll('oilsContainer', products.filter(p => p.category === 'زيوت'), offers);
    renderProductScroll('spicesContainer', products.filter(p => p.category === 'بهارات'), offers);
    renderProductScroll('yemeniContainer', products.filter(p => p.category === 'يمني'), offers);
}

async function renderProducts(cf = 'all') {
    const container = document.getElementById('productsContainer'); 
    const products = await getAllProducts(); 
    const offers = await getActiveOffers();
    const filtered = cf === 'all' ? products : products.filter(p => p.category === cf);
    renderProductGrid(container, filtered, offers);
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalCategories').textContent = new Set(products.map(p => p.category)).size;
}

// ==================== العروض ====================
async function renderOffers() {
    const container = document.getElementById('activeOffersContainer'); 
    const products = await getAllProducts(); 
    const offers = await getActiveOffers();
    if (offers.length === 0) { 
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-tags" style="font-size:3rem;opacity:0.5;"></i><p>لا توجد عروض نشطة</p></div>'; 
        return; 
    }
    container.innerHTML = offers.map(o => {
        const p = products.find(x => x.id === o.productId); 
        if (!p || typeof p.price !== 'number') return '';
        const dp = calcDiscountedPrice(p.price, o.discountPercent); 
        const img = p.image || 'Trust Provisions.png';
        return `<div class="offer-card"><div class="offer-header"><div class="offer-image"><img src="${img}" alt="${p.name}" onerror="this.src='Trust Provisions.png'"></div><div class="offer-info"><h4>${p.name}</h4><span class="category-badge">${p.category}</span><div class="offer-price-section"><span class="offer-original-price">${p.price.toLocaleString()} ر.ي</span><span class="offer-discount-badge">-${o.discountPercent}%</span></div><div class="offer-discounted-price">${dp.toLocaleString()} ر.ي</div></div></div><div class="offer-footer"><span class="offer-expiry"><i class="fas fa-hourglass-half"></i> ينتهي: ${new Date(o.endDate).toLocaleDateString('ar-SA')}</span><button class="btn-small btn" onclick="quickAddToCart(${p.id})"><i class="fas fa-cart-plus"></i> أضف للسلة</button></div></div>`;
    }).join('');
    if (isAdminLoggedIn) { 
        await renderAdminOffersList(); 
        await populateOfferProductSelect(); 
    }
}

async function renderAdminOffersList() {
    const container = document.getElementById('adminOffersList'); 
    const products = await getAllProducts(); 
    const offers = await getAllOffers();
    if (offers.length === 0) { 
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">لا توجد عروض</p>'; 
        return; 
    }
    container.innerHTML = offers.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(o => {
        const p = products.find(x => x.id === o.productId); 
        const pn = p ? p.name : 'منتج محذوف';
        const isActive = o.startDate <= new Date().toISOString().split('T')[0] && o.endDate >= new Date().toISOString().split('T')[0];
        return `<div class="cart-item" style="padding:12px;opacity:${isActive?'1':'0.6'};"><div style="flex:1;"><strong>${pn}</strong><br><small>خصم ${o.discountPercent}% | ${new Date(o.startDate).toLocaleDateString('ar-SA')} - ${new Date(o.endDate).toLocaleDateString('ar-SA')}</small><br><small style="color:${isActive?'var(--success)':'var(--text-muted)'};"><i class="fas fa-${isActive?'check-circle':'clock'}"></i> ${isActive?'نشط':'منتهي'}</small></div><i class="fas fa-trash-alt" style="color:var(--danger);cursor:pointer;padding:8px;" onclick="deleteOfferFromAdmin(${o.id})"></i></div>`;
    }).join('');
}

async function populateOfferProductSelect() {
    const select = document.getElementById('offerProductSelect'); 
    const products = await getAllProducts(); 
    const offers = await getActiveOffers();
    const offeredIds = offers.map(o => o.productId); 
    const available = products.filter(p => !offeredIds.includes(p.id) && typeof p.price === 'number');
    select.innerHTML = '<option value="">-- اختر منتج --</option>' + available.map(p => `<option value="${p.id}">${p.name} - ${p.price.toLocaleString()} ر.ي</option>`).join('');
}

async function addNewOffer() {
    if (!isAdminLoggedIn) return;
    const pid = parseInt(document.getElementById('offerProductSelect').value);
    const discountPercent = parseInt(document.getElementById('offerDiscountPercent').value);
    const sd = document.getElementById('offerStartDate').value;
    const ed = document.getElementById('offerEndDate').value;
    if (!pid || !discountPercent || !sd || !ed) { showToast('⚠️ الرجاء تعبئة جميع الحقول'); return; }
    if (discountPercent < 1 || discountPercent > 99) { showToast('⚠️ نسبة الخصم بين 1 و 99'); return; }
    if (sd > ed) { showToast('⚠️ تاريخ النهاية بعد البداية'); return; }
    const products = await getAllProducts(); 
    const product = products.find(p => p.id === pid);
    await addOffer({ productId: pid, productName: product.name, discountPercent, startDate: sd, endDate: ed, createdAt: new Date().toISOString() });
    document.getElementById('offerDiscountPercent').value = ''; 
    await renderOffers(); 
    await renderProducts(document.getElementById('categoryFilter').value); 
    await renderAllProducts();
    showToast(`✅ تم إضافة عرض ${discountPercent}%`);
}

window.deleteOfferFromAdmin = async function(id) { 
    if (confirm('حذف العرض؟')) { 
        await deleteOffer(id); 
        await renderOffers(); 
        await renderProducts(document.getElementById('categoryFilter').value); 
        await renderAllProducts(); 
        showToast('✓ تم حذف العرض'); 
    } 
};

async function clearExpiredOffers() {
    const offers = await getAllOffers(); 
    const today = new Date().toISOString().split('T')[0]; 
    const expired = offers.filter(o => o.endDate < today);
    if (expired.length === 0) { showToast('ℹ️ لا توجد عروض منتهية'); return; }
    if (confirm(`حذف ${expired.length} عرض؟`)) { 
        for (const o of expired) await deleteOffer(o.id); 
        await renderOffers(); 
        await renderProducts(document.getElementById('categoryFilter').value); 
        await renderAllProducts(); 
        showToast(`🗑️ تم حذف ${expired.length} عرض`); 
    }
}

// ==================== السلة ====================
window.quickAddToCart = async function(pid) { 
    const products = await getAllProducts(); 
    const p = products.find(x => x.id === pid); 
    if (p) { 
        if (typeof p.price !== 'number') { showToast(`⚠️ ${p.name} غير متوفر`); return; } 
        await addToCart(p); 
        showToast(`✓ تمت إضافة ${p.name}`); 
        updateCartCount(); 
    } 
};

async function renderCart() {
    const container = document.getElementById('cartContainer'); 
    const items = await getCartItems();
    if (items.length === 0) { 
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-shopping-basket" style="font-size:3rem;opacity:0.5;"></i><p>السلة فاضية</p></div>'; 
        document.querySelector('#cartTotal span:last-child').textContent = '0 ر.ي'; 
        return; 
    }
    let total = 0;
    container.innerHTML = items.map(item => { 
        const it = item.finalPrice * (item.quantity || 1); 
        total += it;
        let pp = ''; 
        if (item.discountPercent > 0) {
            pp = `<span style="text-decoration:line-through;color:var(--text-muted);font-size:0.9rem;">${item.price.toLocaleString()} ر.ي</span><span style="background:var(--offer-badge);color:white;padding:2px 6px;border-radius:12px;font-size:0.7rem;margin:0 4px;">-${item.discountPercent}%</span><br>${item.finalPrice.toLocaleString()} ر.ي`; 
        } else {
            pp = `${item.price.toLocaleString()} ر.ي`;
        }
        return `<div class="cart-item"><div class="cart-image"><img src="${item.image || 'Trust Provisions.png'}" alt="${item.name}" onerror="this.src='Trust Provisions.png'"></div><div class="item-info"><h4>${item.name}</h4><span>الكمية: ${item.quantity||1}</span><div>${pp}</div></div><div class="price">${it.toLocaleString()} ر.ي</div><i class="fas fa-trash-alt" style="color:var(--danger);cursor:pointer;padding:8px;" onclick="removeCartItem(${item.id})"></i></div>`;
    }).join('');
    document.querySelector('#cartTotal span:last-child').textContent = `${total.toLocaleString()} ر.ي`;
}

window.removeCartItem = async function(id) { 
    await removeFromCart(id); 
    await renderCart(); 
    updateCartCount(); 
    showToast('✓ تم حذف المنتج'); 
};

async function updateCartCount() { 
    document.getElementById('cartCount').textContent = (await getCartItems()).length; 
}

// ==================== إدارة المنتجات ====================
async function renderAdminProductList() {
    if (!isAdminLoggedIn) return; 
    const container = document.getElementById('adminProductList'); 
    const products = await getAllProducts();
    if (products.length === 0) { 
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">لا توجد منتجات</p>'; 
        return; 
    }
    container.innerHTML = products.map(p => `<div class="cart-item" style="padding:12px;"><div class="cart-image" style="width:50px;height:50px;"><img src="${p.image||'Trust Provisions.png'}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='Trust Provisions.png'"></div><div class="item-info"><strong>${p.name}</strong><br><small>${p.category} - ${typeof p.price==='number'?p.price.toLocaleString():p.price} ر.ي</small></div><i class="fas fa-trash-alt" style="color:var(--danger);cursor:pointer;padding:8px;" onclick="deleteProductFromAdmin(${p.id})"></i></div>`).join('');
}

window.deleteProductFromAdmin = async function(id) { 
    if (confirm('حذف المنتج؟')) { 
        await deleteProduct(id); 
        await renderProducts(document.getElementById('categoryFilter').value); 
        await renderAllProducts(); 
        await renderAdminProductList(); 
        await populateOfferProductSelect(); 
        showToast('✓ تم حذف المنتج'); 
    } 
};

// ==================== عرض المستخدمين ====================
async function renderRegisteredUsers() {
    if (!isAdminLoggedIn) return; 
    const container = document.getElementById('registeredUsersList'); 
    const users = await getAllUsers();
    if (users.length === 0) { 
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">لا يوجد مستخدمون</p>'; 
        return; 
    }
    container.innerHTML = users.map(u => `<div class="cart-item" style="padding:12px;"><div style="flex:1;"><strong>${u.name}</strong> <span class="user-badge" style="background:${u.role==='admin'?'var(--gold)':'var(--info)'};color:${u.role==='admin'?'#000':'#fff'};">${u.role==='admin'?'مالك':'مستخدم'}</span><br><small>📱 ${u.phone} | ✉️ ${u.email}</small><br><small>📅 ${new Date(u.createdAt).toLocaleDateString('ar-SA')}</small></div><i class="fas fa-trash-alt" style="color:var(--danger);cursor:pointer;padding:8px;" onclick="deleteUserFromAdmin(${u.id})"></i></div>`).join('');
}

window.deleteUserFromAdmin = async function(id) { 
    if (confirm('حذف المستخدم؟')) { 
        await deleteUser(id); 
        await renderRegisteredUsers(); 
        showToast('✓ تم حذف المستخدم'); 
    } 
};

// ==================== واجهة المستخدم ====================
function updateUIForUser() {
    const authBtns = document.getElementById('userAuthButtons'); 
    const logoutBtn = document.getElementById('userLogoutBtn');
    const userCard = document.getElementById('currentUserCard'); 
    const adminTab = document.getElementById('adminTab');
    
    if (currentUser) {
        authBtns.style.display = 'none'; 
        logoutBtn.style.display = 'block';
        userCard.innerHTML = `<div class="user-info-card"><div class="user-avatar">${currentUser.name.charAt(0)}</div><div class="user-details"><h4>${currentUser.name} ${currentUser.role==='admin'?'👑':''}</h4><small>📱 ${currentUser.phone} | ✉️ ${currentUser.email}</small></div><span class="user-badge" style="background:${currentUser.role==='admin'?'var(--gold)':'var(--info)'};color:${currentUser.role==='admin'?'#000':'#fff'};">${currentUser.role==='admin'?'مالك':'مستخدم'}</span></div>`;
        if (currentUser.role === 'admin') { 
            adminTab.style.display = 'block'; 
            isAdminLoggedIn = true; 
        } else { 
            adminTab.style.display = 'none'; 
            isAdminLoggedIn = false; 
        }
        updateUserDataDisplay();
    } else {
        authBtns.style.display = 'flex'; 
        logoutBtn.style.display = 'none'; 
        userCard.innerHTML = '';
        adminTab.style.display = 'none'; 
        isAdminLoggedIn = false;
        document.getElementById('userDataDisplay').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-user" style="font-size:3rem;opacity:0.5;"></i><p>يرجى تسجيل الدخول لعرض بياناتك</p></div>';
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-section="infoSection"]').classList.add('active');
        document.querySelectorAll('.profile-section').forEach(s => s.classList.remove('active'));
        document.getElementById('infoSection').classList.add('active');
    }
}

function updateUserDataDisplay() {
    if (!currentUser) return;
    document.getElementById('userDataDisplay').innerHTML = `
        <div class="profile-card"><div style="font-size:4rem;color:var(--accent);margin-bottom:16px;"><i class="fas fa-user-circle"></i></div>
        <h3>${currentUser.name}</h3><p><i class="fas fa-phone"></i> ${currentUser.phone}</p><p><i class="fas fa-envelope"></i> ${currentUser.email}</p>
        <p><span class="user-badge" style="background:${currentUser.role==='admin'?'var(--gold)':'var(--info)'};color:${currentUser.role==='admin'?'#000':'#fff'};">${currentUser.role==='admin'?'مالك المتجر':'عميل'}</span></p>
        <p style="color:var(--text-muted);font-size:0.85rem;">تاريخ التسجيل: ${new Date(currentUser.createdAt).toLocaleDateString('ar-SA')}</p></div>`;
}

// ==================== النوافذ ====================
function showUserLogin() { 
    document.getElementById('userLoginModal').classList.add('show'); 
    document.getElementById('loginUserPhone').value = ''; 
    document.getElementById('loginUserEmail').value = ''; 
    document.getElementById('userLoginError').classList.remove('show'); 
}

function showUserRegister() { 
    document.getElementById('userLoginModal').classList.remove('show'); 
    document.getElementById('userRegisterModal').classList.add('show'); 
    document.getElementById('regUserName').value = ''; 
    document.getElementById('regUserPhone').value = ''; 
    document.getElementById('regUserEmail').value = ''; 
    document.getElementById('userRegisterError').classList.remove('show'); 
}

function showAdminLogin() { 
    document.getElementById('adminLoginModal').classList.add('show'); 
    document.getElementById('adminDesignerCode').value = ''; 
    document.getElementById('adminFullName').value = ''; 
    document.getElementById('adminPhone').value = ''; 
    document.getElementById('adminEmail').value = ''; 
    document.getElementById('adminLoginError').classList.remove('show'); 
}

// ==================== الثيم والإشعارات ====================
async function initTheme() { 
    const t = await getThemeSetting(); 
    const d = t === 'dark'; 
    document.body.classList.toggle('dark-mode', d); 
    updateThemeIcon(d);
}

function updateThemeIcon(isDark) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.src = isDark ? 'day.png' : 'Lily.png';
        themeIcon.alt = isDark ? 'الوضع النهاري' : 'الوضع الليلي';
    }
}

async function toggleTheme() { 
    const d = document.body.classList.toggle('dark-mode'); 
    updateThemeIcon(d);
    await saveThemeSetting(d); 
    showToast(d ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري'); 
}

function showToast(m) { 
    const c = document.getElementById('toastContainer'); 
    const t = document.createElement('div'); 
    t.className = 'toast'; 
    t.innerHTML = m; 
    c.appendChild(t); 
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 200); }, 2000); 
}

// ==================== التهيئة الرئيسية ====================
async function initApp() {
    await openDB(); 
    await initTheme(); 
    await seedProducts();
    await renderProducts(); 
    await renderAllProducts(); 
    await renderOffers(); 
    await updateCartCount();
    if (isAdminLoggedIn) { 
        await renderAdminProductList(); 
        await populateOfferProductSelect(); 
        await renderAdminOffersList(); 
        await renderRegisteredUsers(); 
    }
    
    const today = new Date(); 
    const nw = new Date(today); 
    nw.setDate(today.getDate() + 7);
    document.getElementById('offerStartDate').value = today.toISOString().split('T')[0];
    document.getElementById('offerEndDate').value = nw.toISOString().split('T')[0];
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) { 
        currentUser = JSON.parse(savedUser); 
        updateUIForUser(); 
        if (isAdminLoggedIn) { 
            await renderAdminProductList(); 
            await populateOfferProductSelect(); 
            await renderAdminOffersList(); 
            await renderRegisteredUsers(); 
        } 
    }

    // === جميع مستمعي الأحداث ===
    
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // PWA
    document.getElementById('pwaInstallBtn').addEventListener('click', async () => { 
        if (deferredPrompt) { 
            deferredPrompt.prompt(); 
            const r = await deferredPrompt.userChoice; 
            deferredPrompt = null; 
            document.getElementById('pwaInstallBanner').style.display = 'none'; 
            if (r.outcome === 'accepted') localStorage.setItem('pwa-installed', 'true'); 
        } else {
            showToast('📱 افتح قائمة المتصفح واختر "تثبيت التطبيق"'); 
        }
    });
    document.getElementById('pwaDismissBtn').addEventListener('click', () => { 
        document.getElementById('pwaInstallBanner').style.display = 'none'; 
        localStorage.setItem('pwa-banner-dismissed', 'true'); 
    });
    
    document.getElementById('categoryFilter').addEventListener('change', e => renderProducts(e.target.value));
    document.getElementById('refreshProductsBtn').addEventListener('click', async () => { 
        await renderProducts(document.getElementById('categoryFilter').value); 
        await renderAllProducts(); 
        if (isAdminLoggedIn) await renderAdminProductList(); 
        showToast('🔄 تم التحديث'); 
    });
    
    // تسجيل مستخدم
    document.getElementById('userRegisterSubmit').addEventListener('click', async () => {
        const name = document.getElementById('regUserName').value.trim();
        const phone = document.getElementById('regUserPhone').value.trim();
        const email = document.getElementById('regUserEmail').value.trim();
        if (!name || !phone || !email) { 
            document.getElementById('userRegisterErrorMsg').textContent = 'يرجى تعبئة جميع الحقول'; 
            document.getElementById('userRegisterError').classList.add('show'); 
            return; 
        }
        const existingPhone = await getUserByPhone(phone);
        const existingEmail = await getUserByEmail(email);
        if (existingPhone) { 
            document.getElementById('userRegisterErrorMsg').textContent = 'رقم الهاتف مسجل مسبقاً'; 
            document.getElementById('userRegisterError').classList.add('show'); 
            return; 
        }
        if (existingEmail) { 
            document.getElementById('userRegisterErrorMsg').textContent = 'البريد الإلكتروني مسجل مسبقاً'; 
            document.getElementById('userRegisterError').classList.add('show'); 
            return; 
        }
        const newUser = { name, phone, email, role: 'user', createdAt: new Date().toISOString() };
        await addUser(newUser);
        document.getElementById('userRegisterModal').classList.remove('show');
        currentUser = newUser; 
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForUser(); 
        showToast('✅ تم إنشاء الحساب بنجاح');
    });
    
    // دخول مستخدم
    document.getElementById('userLoginSubmit').addEventListener('click', async () => {
        const phone = document.getElementById('loginUserPhone').value.trim();
        const email = document.getElementById('loginUserEmail').value.trim();
        if (!phone || !email) { 
            document.getElementById('userLoginErrorMsg').textContent = 'يرجى إدخال رقم الهاتف والبريد الإلكتروني'; 
            document.getElementById('userLoginError').classList.add('show'); 
            return; 
        }
        const user = await getUserByPhone(phone);
        if (!user || user.email !== email) { 
            document.getElementById('userLoginErrorMsg').textContent = 'لم يتم العثور على حساب بهذه البيانات'; 
            document.getElementById('userLoginError').classList.add('show'); 
            return; 
        }
        document.getElementById('userLoginModal').classList.remove('show');
        currentUser = user; 
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForUser(); 
        showToast(`✅ مرحباً ${user.name}`);
        if (isAdminLoggedIn) { 
            await renderAdminProductList(); 
            await populateOfferProductSelect(); 
            await renderAdminOffersList(); 
            await renderRegisteredUsers(); 
        }
    });
    
    // دخول المالك
    document.getElementById('adminLoginSubmit').addEventListener('click', async () => {
        const code = document.getElementById('adminDesignerCode').value.trim();
        const name = document.getElementById('adminFullName').value.trim();
        const phone = document.getElementById('adminPhone').value.trim();
        const email = document.getElementById('adminEmail').value.trim();
        
        if (code !== DESIGNER_CODE) { 
            document.getElementById('adminLoginErrorMsg').textContent = 'الرمز الخاص غير صحيح'; 
            document.getElementById('adminLoginError').classList.add('show'); 
            return; 
        }
        if (!name || !phone || !email) { 
            document.getElementById('adminLoginErrorMsg').textContent = 'يرجى تعبئة جميع الحقول'; 
            document.getElementById('adminLoginError').classList.add('show'); 
            return; 
        }
        
        const adminCount = await getAdminCount();
        const existingUser = await getUserByPhone(phone);
        
        if (existingUser) {
            if (existingUser.role === 'admin') {
                document.getElementById('adminLoginModal').classList.remove('show');
                currentUser = existingUser; 
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForUser(); 
                showToast(`✅ مرحباً مالك تموينات الثقة - ${existingUser.name}`);
                if (isAdminLoggedIn) { 
                    await renderAdminProductList(); 
                    await populateOfferProductSelect(); 
                    await renderAdminOffersList(); 
                    await renderRegisteredUsers(); 
                }
                return;
            } else {
                document.getElementById('adminLoginErrorMsg').textContent = 'هذا الرقم مسجل كمستخدم عادي وليس كمالك';
                document.getElementById('adminLoginError').classList.add('show'); 
                return;
            }
        }
        
        if (adminCount >= MAX_ADMIN_ACCOUNTS) { 
            document.getElementById('adminLoginErrorMsg').textContent = `الحد الأقصى لحسابات المالك هو ${MAX_ADMIN_ACCOUNTS} فقط`; 
            document.getElementById('adminLoginError').classList.add('show'); 
            return; 
        }
        
        const newAdmin = { name, phone, email, role: 'admin', createdAt: new Date().toISOString() };
        await addUser(newAdmin);
        document.getElementById('adminLoginModal').classList.remove('show');
        currentUser = newAdmin; 
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForUser(); 
        showToast(`👑 تم تسجيل المالك ${name} بنجاح`);
        if (isAdminLoggedIn) { 
            await renderAdminProductList(); 
            await populateOfferProductSelect(); 
            await renderAdminOffersList(); 
            await renderRegisteredUsers(); 
        }
    });
    
    // أزرار الإلغاء
    document.getElementById('adminLoginCancel').addEventListener('click', () => document.getElementById('adminLoginModal').classList.remove('show'));
    document.getElementById('userRegisterCancel').addEventListener('click', () => document.getElementById('userRegisterModal').classList.remove('show'));
    document.getElementById('userLoginCancel').addEventListener('click', () => document.getElementById('userLoginModal').classList.remove('show'));
    
    // أزرار الواجهة
    document.getElementById('showRegisterBtn').addEventListener('click', showUserRegister);
    document.getElementById('showLoginBtn').addEventListener('click', showUserLogin);
    document.getElementById('logoutUserBtn').addEventListener('click', () => {
        currentUser = null; 
        localStorage.removeItem('currentUser'); 
        updateUIForUser();
        document.querySelectorAll('.admin-subsection').forEach(s => s.style.display = 'none');
        document.getElementById('productsManage').style.display = 'block';
        showToast('👋 تم تسجيل الخروج');
    });
    
    // روابط
    document.querySelectorAll('.modal-link span').forEach(el => {
        el.addEventListener('click', function() { 
            if (this.textContent.includes('سجل الآن')) showUserRegister(); 
        });
    });
    
    // إغلاق النوافذ
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) { 
            if (e.target === this) this.classList.remove('show'); 
        });
    });
    
    // تبويبات حسابي
    document.querySelectorAll('#profileTabs .profile-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const section = this.dataset.section;
            if (section === 'adminSection' && !isAdminLoggedIn) { 
                showToast('🔒 هذا القسم للمالك فقط'); 
                return; 
            }
            document.querySelectorAll('#profileTabs .profile-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('#profilePage .profile-section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
            if (section === 'adminSection' && isAdminLoggedIn) { 
                renderAdminProductList(); 
                populateOfferProductSelect(); 
                renderAdminOffersList(); 
                renderRegisteredUsers(); 
            }
        });
    });
    
    // تبويبات الإدارة
    document.querySelectorAll('[data-admin]').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('[data-admin]').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.admin-subsection').forEach(s => s.style.display = 'none');
            const target = document.getElementById(this.dataset.admin);
            if (target) { target.style.display = 'block'; }
            if (this.dataset.admin === 'offersManage') { 
                populateOfferProductSelect(); 
                renderAdminOffersList(); 
            }
            if (this.dataset.admin === 'usersManage') renderRegisteredUsers();
        });
    });
    
    // إضافة منتج
    document.getElementById('addProductBtn').addEventListener('click', async () => {
        if (!isAdminLoggedIn) return;
        const name = document.getElementById('productName').value.trim();
        const priceStr = document.getElementById('productPrice').value;
        const category = document.getElementById('productCategory').value;
        if (!name || !priceStr) { showToast('⚠️ الرجاء إدخال الاسم والسعر'); return; }
        const price = parseInt(priceStr); 
        if (isNaN(price)) { showToast('⚠️ السعر رقماً'); return; }
        await addProduct({ name, price, category, image: 'Trust Provisions.png' });
        document.getElementById('productName').value = ''; 
        document.getElementById('productPrice').value = '';
        await renderProducts(document.getElementById('categoryFilter').value); 
        await renderAllProducts(); 
        await renderAdminProductList(); 
        await populateOfferProductSelect();
        showToast(`✅ تمت إضافة ${name}`);
    });
    
    // إعادة ضبط
    document.getElementById('resetDatabaseBtn').addEventListener('click', async () => {
        if (!isAdminLoggedIn) return;
        if (confirm('حذف جميع المنتجات والعروض وإعادة الافتراضية؟')) {
            const tx1 = db.transaction(['products'],'readwrite'); await tx1.objectStore('products').clear();
            const tx2 = db.transaction(['offers'],'readwrite'); await tx2.objectStore('offers').clear();
            const tx3 = db.transaction(['cart'],'readwrite'); await tx3.objectStore('cart').clear();
            await seedProducts(); 
            await renderProducts(); 
            await renderAllProducts(); 
            await renderOffers(); 
            await updateCartCount(); 
            await renderAdminProductList(); 
            await populateOfferProductSelect();
            showToast('🔄 تمت إعادة التعيين');
        }
    });
    
    // العروض
    document.getElementById('addOfferBtn').addEventListener('click', addNewOffer);
    document.getElementById('clearExpiredOffersBtn').addEventListener('click', clearExpiredOffers);
    
    // السلة
    document.getElementById('checkoutBtn').addEventListener('click', () => showToast('🏪 يرجى زيارة تموينات الثقة - ذمار'));
    document.getElementById('clearCartBtn').addEventListener('click', async () => { 
        if (confirm('إفراغ السلة؟')) { 
            await clearCart(); 
            await renderCart(); 
            updateCartCount(); 
            showToast('🗑️ تم إفراغ السلة'); 
        } 
    });
    
    // تصدير
    document.getElementById('exportAllDataBtn').addEventListener('click', async () => {
        if (!isAdminLoggedIn) return;
        const products = await getAllProducts(); 
        const cart = await getCartItems(); 
        const offers = await getAllOffers(); 
        const users = await getAllUsers();
        const data = { 
            store: STORE_INFO, 
            developer: { name: DEVELOPER_NAME, url: DEVELOPER_URL },
            products, cart, offers, users, 
            date: new Date().toISOString() 
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); 
        a.href = URL.createObjectURL(blob); 
        a.download = `تموينات-الثقة-${Date.now()}.json`; 
        a.click();
        showToast('💾 تم تصدير البيانات');
    });

    // طريقة سرية لفتح نافذة المالك
    let clickSequence = [];
    document.getElementById('mosqueBtn').addEventListener('click', function() {
        clickSequence.push('mosque');
        if (clickSequence.length > 5) clickSequence.shift();
        checkSecretSequence();
    });
    
    document.getElementById('dbStatusIconBtn').addEventListener('click', function() {
        clickSequence.push('database');
        if (clickSequence.length > 5) clickSequence.shift();
        checkSecretSequence();
    });
    
    function checkSecretSequence() {
        const seq = clickSequence.join(',');
        if (seq.includes('mosque,database,mosque') || seq.includes('mosque,mosque,database')) {
            clickSequence = [];
            showAdminLogin();
        }
    }
}

// ==================== التنقل ====================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async function() {
        const pageId = this.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
        
        if (pageId === 'homePage') await renderProducts(document.getElementById('categoryFilter').value);
        else if (pageId === 'productsPage') await renderAllProducts();
        else if (pageId === 'offersPage') await renderOffers();
        else if (pageId === 'cartPage') await renderCart();
        else if (pageId === 'profilePage') {
            updateUIForUser();
            if (isAdminLoggedIn) { 
                await renderAdminProductList(); 
                await populateOfferProductSelect(); 
                await renderAdminOffersList(); 
                await renderRegisteredUsers(); 
            }
        }
    });
});

// ==================== بدء التطبيق ====================
initApp().catch(err => {
    console.error('❌ خطأ في بدء التطبيق:', err);
    showToast('⚠️ حدث خطأ، يرجى تحديث الصفحة');
});