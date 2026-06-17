import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "../config/database";
import User from "../models/user_model";
import CommunityPost from "../models/community_post_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import DiaryEntry from "../models/diary_entry_model";
import Reminder from "../models/reminder_model";
import StoreProduct from "../models/store_product_model";
import Expert from "../models/expert_model";

dotenv.config();

type DemoUserSeed = {
  name: string;
  email: string;
  phoneNumber: string;
  selectedCountry: string;
};

const demoUsers: DemoUserSeed[] = [
  { name: "أحمد علي", email: "ahmed.demo@nabatech.com", phoneNumber: "01010000001", selectedCountry: "مصر" },
  { name: "سارة محمود", email: "sara.demo@nabatech.com", phoneNumber: "01010000002", selectedCountry: "مصر" },
  { name: "محمد حسن", email: "mohamed.demo@nabatech.com", phoneNumber: "01010000003", selectedCountry: "مصر" },
  { name: "فاطمة سعيد", email: "fatma.demo@nabatech.com", phoneNumber: "01010000004", selectedCountry: "مصر" },
  { name: "يوسف خالد", email: "youssef.demo@nabatech.com", phoneNumber: "01010000005", selectedCountry: "مصر" },
];

const communityTitles = [
  "اصفرار مفاجئ في أوراق الطماطم",
  "ما سبب ذبول النعناع رغم الري اليومي؟",
  "بقع بيضاء على أوراق الكوسة",
  "أفضل وقت لتسميد الريحان في الصيف",
  "العنكبوت الأحمر ظهر على الفلفل",
  "أوراق الخيار ملتفة وحوافها جافة",
  "هل هذا عفن جذور في نباتاتي؟",
  "نصيحة لعلاج تبقع الأوراق البكتيري",
  "مشاكل تهوية التربة في الأصص",
  "برنامج ري مناسب لشتلات الطماطم",
  "كيف أرفع مناعة النبات ضد الفطريات؟",
  "إيقاف انتشار المن في الحديقة المنزلية",
  "أعراض البياض الدقيقي في الخيار",
  "أوراق الليمون فيها نقاط بنية",
  "تأخر نمو الفلفل رغم الإضاءة الجيدة",
  "هل الرطوبة العالية تسبب أمراض أكثر؟",
  "تجربة ناجحة مع مبيد عضوي للآفات",
  "أفضل طريقة تقليم لنبات الريحان",
  "متى أعيد زراعة النبات في أصيص أكبر؟",
  "علامات مبكرة لنقص العناصر الصغرى",
];

const communityContents = [
  "لاحظت من يومين أن الأوراق السفلية في الطماطم بدأت تصفر بشكل سريع. استخدمت ري منتظم لكن المشكلة مستمرة. هل أحتاج أضيف سماد نيتروجين ولا المشكلة فطرية؟",
  "النعناع عندي في البلكونة بدأت أوراقه تذبل وقت الظهر وترجع طبيعي بالليل. هل ده طبيعي بسبب الحر ولا علامة مشكلة في الجذور؟",
  "ظهرت طبقة بيضاء خفيفة على أوراق الكوسة وبعدها بدأت الأوراق تضعف. ما أفضل علاج سريع وآمن؟",
  "أنا أستخدم سماد عضوي سائل كل أسبوعين، هل المدة مناسبة للريحان ولا أقلل؟",
  "لقيت شبك خفيف جدًا تحت الأوراق وفيه نقاط صفراء. واضح أنه عنكبوت أحمر. محتاج خطة علاج خطوة بخطوة.",
  "أوراق الخيار ملفوفة للداخل مع جفاف بسيط في الحواف. الري ثابت والتربة جيدة. هل السبب آفة ولا نقص عنصر؟",
  "نبات الزينة عندي رائحته من التربة غريبة والجذور لونها غامق. هل هذا عفن جذور؟ وكيف أتصرف بدون خسارة النبات؟",
  "في مزرعتي الصغيرة ظهرت بقع مائية تتحول لبنية في الأوراق. أظنها بكتيريا. ما أفضل بروتوكول علاج؟",
  "أحس أن التربة مضغوطة والمياه لا تتصرف جيدًا. ما نسبة البيرلايت المناسبة لتحسين التهوية؟",
  "محتاج جدول ري عملي للشتلات خلال موجة الحر الحالية، خاصة أول شهر بعد الشتل.",
  "هل في طريقة طبيعية لتقوية مناعة النبات قبل ما تظهر الأمراض؟",
  "المن منتشر جدًا على النموات الجديدة، جربت رش ماء فقط بدون نتيجة. ما البديل الفعال؟",
  "ألاحظ مسحوق أبيض في بداية الورقة ثم ينتشر بسرعة. أريد تشخيص مؤكد قبل العلاج.",
  "نبات الليمون عندي ظهر عليه نقاط بنية صغيرة على الأوراق الجديدة. هل ده نقص عنصر أم مرض؟",
  "النمو عندي بطيء جدًا في الفلفل رغم الشمس المباشرة. هل أغير نوع السماد؟",
  "داخل الصوبة الرطوبة عالية جدًا. هل هذا يزيد احتمالات الفطريات؟ وكيف أوازن التهوية؟",
  "جربت مبيد عضوي من زيت النيم على دفعتين وظهرت نتيجة ممتازة. حابب أشارك الطريقة.",
  "أريد تقليم الريحان بشكل يزيد التفريع ولا يضعف النبات. ما أفضل نقطة قص؟",
  "الجذور بدأت تلف داخل الأصيص. ما العلامات المؤكدة أن وقت النقل فعلاً جاء؟",
  "في اصفرار بين العروق بالأوراق الجديدة، وأتوقع نقص حديد أو مغنيسيوم. كيف أفرق بينهم؟",
];

const diagnosisPool = [
  { ar: "البياض الدقيقي", en: "Powdery Mildew", severity: "medium" },
  { ar: "تبقع الأوراق البكتيري", en: "Bacterial Leaf Spot", severity: "high" },
  { ar: "عفن الجذور", en: "Root Rot", severity: "high" },
  { ar: "حشرة المن", en: "Aphids", severity: "medium" },
  { ar: "العنكبوت الأحمر", en: "Spider Mites", severity: "high" },
  { ar: "تآكل الأوراق", en: "Leaf Miners", severity: "low" },
];

const diaryTitles = [
  "متابعة حالة النبات",
  "فحص الرطوبة والتربة",
  "مراقبة الأوراق الجديدة",
  "تسجيل استجابة النبات للري",
  "متابعة بعد إضافة السماد",
];

const diaryNotes = [
  "اليوم لاحظت تحسن بسيط في لون الأوراق بعد ضبط كمية الري وتقليل التعرض للشمس المباشرة وقت الظهيرة.",
  "التربة كانت رطبة بزيادة في الطبقة السفلية، فقللت الري ورفعت التهوية حول الأصيص.",
  "الأوراق الجديدة أنعم وأكثر ثباتًا، لكن ما زال هناك اصفرار خفيف في بعض الأوراق القديمة.",
  "بعد الري الصباحي، النبات احتفظ بحيويته طوال اليوم ولم يظهر عليه الذبول المعتاد.",
  "أضفت سماد متوازن بجرعة خفيفة، وسأتابع خلال الأيام القادمة إذا في زيادة ملحوظة بالنمو.",
];

const reminderTemplates = [
  { title: "تذكير ري", iconCodePoint: 58264 },
  { title: "تذكير تسميد", iconCodePoint: 0xe318 },
  { title: "فحص آفات", iconCodePoint: 0xe3b7 },
];

const plantNames = ["طماطم", "فلفل", "نعناع", "ريحان", "ليمون", "خيار", "كوسة"];
const plantTags: Array<"Diagnosis" | "Care Tips" | "Watering" | "Pests" | "General"> = [
  "Diagnosis",
  "Care Tips",
  "Watering",
  "Pests",
  "General",
];

const storeProductsArabic = [
  {
    name: "سماد عضوي متوازن NPK",
    category: "Nutrition",
    price: 149,
    rating: 4.8,
    subtitle: "سماد عضوي مناسب للخضروات ونباتات الزينة، يدعم النمو الخضري وتقوية الجذور.",
    imageUrl: "",
  },
  {
    name: "مقص تقليم احترافي",
    category: "Tools",
    price: 220,
    rating: 4.7,
    subtitle: "شفرة حادة من الفولاذ المقاوم للصدأ مع قبضة مريحة للاستخدام اليومي.",
    imageUrl: "",
  },
  {
    name: "زيت نيم عضوي مركز",
    category: "Protection",
    price: 95,
    rating: 4.6,
    subtitle: "حل طبيعي لمكافحة المن والعناكب الدقيقة مع تأثير لطيف على النبات.",
    imageUrl: "",
  },
  {
    name: "خليط تربة خفيف للتهوية",
    category: "Nutrition",
    price: 85,
    rating: 4.5,
    subtitle: "مزيج بيتموس وبيرلايت يساعد على تصريف ممتاز وتقليل مشاكل عفن الجذور.",
    imageUrl: "",
  },
  {
    name: "بخاخ يدوي 2 لتر",
    category: "Tools",
    price: 130,
    rating: 4.4,
    subtitle: "بخاخ عملي للرش الورقي والمبيدات العضوية مع فوهة قابلة للتعديل.",
    imageUrl: "",
  },
];

const expertsArabic = [
  { name: "د. مروان الشافعي", specialty: "أخصائي أمراض نبات", fee: 180, online: true, rating: 4.9, sessions: 210 },
  { name: "م. رحاب عادل", specialty: "استشاري زراعة محمية وصوب", fee: 150, online: true, rating: 4.8, sessions: 165 },
  { name: "د. كريم الجندي", specialty: "خبير تغذية نباتية وتحليل تربة", fee: 200, online: false, rating: 4.7, sessions: 142 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function ensureDemoUsers() {
  const passwordHash = await bcrypt.hash("Demo1234", 10);
  const users: mongoose.Document[] = [];

  for (const seed of demoUsers) {
    let user = await User.findOne({ email: seed.email });
    if (!user) {
      user = await User.create({
        ...seed,
        password: passwordHash,
        role: "user",
      });
    }
    users.push(user);
  }

  return users as any[];
}

async function seedCommunityPosts(users: any[]) {
  const existing = await CommunityPost.countDocuments({
    author: { $in: users.map((u) => u._id) },
  });
  const needed = Math.max(0, 20 - existing);

  if (needed === 0) return 0;

  const docs = Array.from({ length: needed }).map((_, i) => {
    const author = users[i % users.length];
    return {
      author: author._id,
      authorName: author.name,
      plantTag: pick(plantTags),
      title: communityTitles[i % communityTitles.length],
      content: communityContents[i % communityContents.length],
      likes: randomInt(0, 28),
      commentsCount: randomInt(0, 12),
      imagePath: "",
      likedBy: [],
      createdAt: new Date(Date.now() - randomInt(1, 20) * 24 * 60 * 60 * 1000),
    };
  });

  await CommunityPost.insertMany(docs);
  return docs.length;
}

async function seedDiagnosisHistory(users: any[]) {
  const existing = await DiagnosisHistory.countDocuments({
    user: { $in: users.map((u) => u._id) },
  });
  const needed = Math.max(0, 15 - existing);
  if (needed === 0) return 0;

  const docs = Array.from({ length: needed }).map((_, i) => {
    const user = users[i % users.length];
    const disease = diagnosisPool[i % diagnosisPool.length];
    return {
      user: user._id,
      imageUrl: "https://images.unsplash.com/photo-1592841200221-a6898f307ba8?auto=format&fit=crop&w=800&q=80",
      diseaseNameAr: disease.ar,
      diseaseNameEn: disease.en,
      confidence: Number((Math.random() * (0.98 - 0.71) + 0.71).toFixed(2)),
      severity: disease.severity,
      diagnosedAt: new Date(Date.now() - randomInt(1, 25) * 24 * 60 * 60 * 1000),
      isOffline: Math.random() > 0.55,
      feedbackStatus: pick(["pending", "confirmed", "rejected"] as const),
    };
  });

  await DiagnosisHistory.insertMany(docs);
  return docs.length;
}

async function seedDiaryEntries(users: any[]) {
  let created = 0;
  for (const user of users) {
    const userCount = await DiaryEntry.countDocuments({ user: user._id });
    const needed = Math.max(0, 10 - userCount);
    if (needed === 0) continue;

    const docs = Array.from({ length: needed }).map((_, i) => ({
      user: user._id,
      plantName: pick(plantNames),
      title: diaryTitles[i % diaryTitles.length],
      notes: diaryNotes[i % diaryNotes.length],
      date: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
      moodCode: pick([0xf02e, 0xf01f, 0xe3a3]),
      healthScore: randomInt(62, 96),
    }));

    await DiaryEntry.insertMany(docs);
    created += docs.length;
  }
  return created;
}

async function seedReminders(users: any[]) {
  let created = 0;
  for (const user of users) {
    const userCount = await Reminder.countDocuments({ user: user._id });
    const needed = Math.max(0, 3 - userCount);
    if (needed === 0) continue;

    const docs = Array.from({ length: needed }).map((_, i) => {
      const template = reminderTemplates[i % reminderTemplates.length];
      return {
        user: user._id,
        title: template.title,
        plantName: pick(plantNames),
        timeLabel: pick(["08:00 AM", "06:30 PM", "09:15 AM", "07:00 PM"]),
        iconCodePoint: template.iconCodePoint,
        enabled: true,
      };
    });

    await Reminder.insertMany(docs);
    created += docs.length;
  }
  return created;
}

async function seedStoreProducts() {
  let created = 0;
  for (const product of storeProductsArabic) {
    const exists = await StoreProduct.findOne({ name: product.name });
    if (exists) continue;
    await StoreProduct.create(product);
    created += 1;
  }
  return created;
}

async function seedExperts() {
  let created = 0;
  for (const expert of expertsArabic) {
    const exists = await Expert.findOne({ name: expert.name });
    if (exists) continue;
    await Expert.create(expert);
    created += 1;
  }
  return created;
}

async function run() {
  await connectDB();

  const users = await ensureDemoUsers();
  const postsCreated = await seedCommunityPosts(users);
  const diagnosesCreated = await seedDiagnosisHistory(users);
  const diaryCreated = await seedDiaryEntries(users);
  const remindersCreated = await seedReminders(users);
  const productsCreated = await seedStoreProducts();
  const expertsCreated = await seedExperts();

  const [userCount, postCount, diagCount, diaryCount, reminderCount, productCount, expertCount] = await Promise.all([
    User.countDocuments({ email: { $in: demoUsers.map((u) => u.email) } }),
    CommunityPost.countDocuments({ author: { $in: users.map((u) => u._id) } }),
    DiagnosisHistory.countDocuments({ user: { $in: users.map((u) => u._id) } }),
    DiaryEntry.countDocuments({ user: { $in: users.map((u) => u._id) } }),
    Reminder.countDocuments({ user: { $in: users.map((u) => u._id) } }),
    StoreProduct.countDocuments(),
    Expert.countDocuments(),
  ]);

  console.log("Presentation seed completed.");
  console.log({
    created: {
      users: userCount,
      communityPostsAdded: postsCreated,
      diagnosisHistoryAdded: diagnosesCreated,
      diaryEntriesAdded: diaryCreated,
      remindersAdded: remindersCreated,
      storeProductsAdded: productsCreated,
      expertsAdded: expertsCreated,
    },
    totals: {
      demoUsers: userCount,
      demoUsersPosts: postCount,
      demoUsersDiagnoses: diagCount,
      demoUsersDiaryEntries: diaryCount,
      demoUsersReminders: reminderCount,
      allStoreProducts: productCount,
      allExperts: expertCount,
    },
    demoLoginPassword: "Demo1234",
  });

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Presentation seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});

