const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://nabatech-backend.vercel.app/api';
const TIMEOUT = 20000; // 20 seconds for cold start

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
});

async function main() {
  console.log("=== بدء الاختبار الحقيقي المباشر على السيرفر (Vercel) ===\n");
  try {
    const randomHex = crypto.randomBytes(4).toString('hex');
    const email = `tester_${randomHex}@nabatech.com`;
    console.log(`[1] محاولة إنشاء حساب تجريبي: ${email}`);
    
    const regRes = await apiClient.post('/auth/register', {
      name: "API Tester",
      email: email,
      password: "Password123!"
    });
    
    const token = regRes.data.token;
    console.log("-> تم التسجيل بنجاح! تم الحصول على التوكن.\n");
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log("[2] اختبار (My Plants API) - إضافة نبتة...");
    const plantRes = await apiClient.post('/my-plants', {
      name: "نبتة المونستيرا الخاصة بي",
      species: "Monstera deliciosa",
      location: "indoor",
      waterFrequencyDays: 5,
      lastWatered: new Date().toISOString(),
      healthStatus: "ممتازة",
      clientOperationId: `op-${randomHex}`
    });
    console.log("-> الحالة:", plantRes.status);
    console.log("-> البيانات الراجعة:");
    console.log(JSON.stringify(plantRes.data, null, 2));

    console.log("\n[3] اختبار (Notifications API) - جلب الإشعارات...");
    const notifRes = await apiClient.get('/notifications');
    console.log("-> الحالة:", notifRes.status);
    console.log("-> البيانات الراجعة:");
    console.log(JSON.stringify(notifRes.data, null, 2));

    console.log("\n[4] اختبار (Disease Map API) - جلب بؤر الأمراض...");
    const mapRes = await apiClient.get('/explore/outbreaks');
    console.log("-> الحالة:", mapRes.status);
    console.log("-> البيانات الراجعة:");
    console.log(JSON.stringify(mapRes.data, null, 2));

    console.log("\n[5] اختبار (Diagnosis History API) - جلب السجل...");
    const histRes = await apiClient.get('/history');
    console.log("-> الحالة:", histRes.status);
    console.log("-> البيانات الراجعة:");
    console.log(JSON.stringify(histRes.data, null, 2));

    console.log("\n✅ اكتمل الاختبار بنجاح!");
  } catch (error) {
    console.error("\n❌ حدث خطأ أثناء الاختبار:");
    if (error.response) {
      console.error("-> حالة الخطأ:", error.response.status);
      console.error("-> تفاصيل الخطأ:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("->", error.message);
    }
  }
}

main();
