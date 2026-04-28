const CACHE_NAME = 'thiqaat-dhamar-v2';
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    // أيقونات التطبيق
    'Trust Provisions.png',
    'Basket.png',
    'Home.png',
    'Products.png',
    'Offers.png',
    'My account.png',
    'Mosque.png',
    'Lily.png',
    'day.png',
    'databases.png',
    'WhatsApp.png',
    // صور المنتجات - بقوليات وحبوب
    'red lentils.png',
    'white beans.png',
    'Diwan Rice.png',
    'Peas of bliss.png',
    'ground wheat.png',
    'Ear of wheat flour.png',
    'Gwizi Tuna.png',
    'Beans of happiness.png',
    'Luxury rice.png',
    'local wheat.png',
    // صور المنتجات - حلويات
    'Cake Pop.png',
    'Big break.png',
    'Big stars.png',
    'Biscuits are born.png',
    'Sinbad the Coconut Mini.png',
    'Tops biscuits.png',
    'Finger break.png',
    'Bourbon biscuits.png',
    // صور المنتجات - مشروبات غازية
    'Great mountain power.png',
    'The power of a small mountain.png',
    'Delsey large ginger.png',
    'Lions strength barley.png',
    'Delsey Red Big.png',
    'Delsey Red Little.png',
    'Dream Red Small.png',
    'Dream yellow Small.png',
    'Dream Black Small.png',
    // صور المنتجات - عصيرات
    'large premium juice.png',
    'Rani Guava.png',
    'Rani Mango.png',
    'Rani Orange Granules Juice.png',
    'Rani Fuka Mushkil.png',
    'Fruit cocktail juice.png',
    'Mango Caesar Juice.png',
    'Pineapple Caesar Juice.png',
    'Rani juice glass.png',
    // صور المنتجات - مياه
    'small Shamlan water.png',
    'small autumn water.png',
    'small sharp water.png',
    'Sana a water is small.png',
    'Wadi Al Ain water.png',
    'My countrys water is small.png',
    // صور المنتجات - ألبان
    'small cow s milk.png',
    'large cow s milk.png',
    'Yemeni milk (large).png',
    'large banana milk.png',
    'Premium milk, small.png',
    'Right of Rawab.png',
    // صور المنتجات - زيوت
    'Cream oil 4 lbs.png',
    'Lunar oil.png',
    'Qamaria gheee.png',
    'olive oil.png',
    // صور المنتجات - بهارات
    'Mixed spices.png',
    'Rajavi Circuit.png',
    'Hawij Marq.png',
    'Her disgust.png',
    'cardamom.png',
    'clove.png',
    'black seed.png',
    'black pepper.png',
    // صور المنتجات - يمني
    'Premium Yemeni coffee.png',
    'local honey.png',
    'affection.png',
    'Hadhramaut Spices.png',
    'local ghee.png',
    'Yemeni red dates.png',
    'local barley.png',
    'black local raisins.png',
    'Local chewing gum.png',
    'Yemeni dates.png'
];

// تثبيت Service Worker وتخزين جميع الملفات
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('⏳ جاري تخزين جميع الملفات...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ تم تخزين جميع الملفات بنجاح!');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('❌ خطأ في تخزين الملفات:', err);
            })
    );
});

// استراتيجية Cache First مع Fallback للشبكة
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // إذا وجد الملف في الكاش، أرسله
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // إذا لم يوجد، حمله من الشبكة وخزنه للاستخدام المستقبلي
                return fetch(event.request)
                    .then(response => {
                        // تأكد من أن الاستجابة صالحة
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // نسخ الاستجابة لتخزينها
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // إذا كان الطلب لصورة، أرجع صورة افتراضية
                        if (event.request.url.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
                            return caches.match('Trust Provisions.png');
                        }
                    });
            })
    );
});

// تحديث الكاش عند وجود نسخة جديدة
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('🗑️ حذف الكاش القديم:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('✅ Service Worker جاهز للعمل!');
            return self.clients.claim();
        })
    );
});

// رسالة للتأكد من عمل Service Worker
self.addEventListener('message', event => {
    if (event.data === 'checkStatus') {
        event.ports[0].postMessage({
            status: 'active',
            cacheName: CACHE_NAME
        });
    }
});