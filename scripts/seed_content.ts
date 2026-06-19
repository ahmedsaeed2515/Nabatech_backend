import mongoose from "mongoose";
import dotenv from "dotenv";
import { Article } from "../src/models/article_model";
import CommunityPost from "../src/models/community_post_model";
import Comment from "../src/models/comment_model";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const USER_ID = "6a34bc5a27f1ee0a94b8f6d9"; // The requester
const OTHER_USER_ID = new mongoose.Types.ObjectId(); // Generate a fake user ID for replies

const articles = [
  {
    title: "أفضل 5 نباتات لتنقية هواء منزلك",
    body: "هناك العديد من النباتات التي تساعد في تنقية الهواء الداخلي بناءً على دراسات وكالة ناسا. من أهمها: نبتة الثعبان التي تطلق الأكسجين ليلاً، زنبق السلام الذي يزيل السموم مثل البنزين، والبوتس الذهبي الذي يتميز بسهولة العناية به. بالإضافة إلى نبتة المطاط التي تزيل الفورمالديهايد، ونبتة العنكبوت التي تعد آمنة للحيوانات الأليفة.",
    imageUrl: "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?w=500&q=80",
    tags: ["عناية", "داخلي", "تنقية الهواء"],
    isPublished: true
  },
  {
    title: "كيف تتعامل مع اصفرار أوراق المونستيرا؟",
    body: "اصفرار أوراق المونستيرا غالباً ما يكون نتيجة للري الزائد أو سوء التصريف. تأكد من أن الأصيص يحتوي على فتحات تصريف جيدة، واترك الطبقة العلوية من التربة تجف تماماً قبل الري مرة أخرى. في بعض الأحيان، قد يكون الاصفرار بسبب نقص النيتروجين أو التعرض المباشر لأشعة الشمس الحارقة.",
    imageUrl: "https://images.unsplash.com/photo-1614594895304-fe7116ac3b58?w=500&q=80",
    tags: ["أمراض", "عناية", "مونستيرا"],
    isPublished: true
  },
  {
    title: "دليلك الشامل لزراعة البذور في الربيع",
    body: "الربيع هو الفصل المثالي لبدء زراعة العديد من الخضروات والأزهار. يجب اختيار بذور ذات جودة عالية واستخدام تربة خفيفة مخصصة للاستنبات. حافظ على درجة حرارة دافئة ورطوبة مستمرة دون إغراق التربة بالماء، وقم بتوفير إضاءة كافية بمجرد ظهور البراعم الأولى لضمان نموها بقوة.",
    imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500&q=80",
    tags: ["زراعة", "بذور", "ربيع"],
    isPublished: true
  },
  {
    title: "الفرق بين الأسمدة العضوية والكيميائية",
    body: "الأسمدة العضوية مستخلصة من مصادر طبيعية مثل السماد الحيواني والنباتي، وتعمل على تحسين بنية التربة تدريجياً. أما الأسمدة الكيميائية فهي مصنعة وتوفر تغذية سريعة ومباشرة للنباتات لكنها قد تضر بالتربة على المدى الطويل إذا أُسيء استخدامها. يفضل استخدام مزيج متوازن منهما لتحقيق أفضل النتائج.",
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500&q=80",
    tags: ["أسمدة", "تربة", "نصائح"],
    isPublished: true
  },
  {
    title: "مكافحة حشرة المن بالطرق الطبيعية",
    body: "حشرة المن تتغذى على عصارة النباتات وتسبب تجعد الأوراق. يمكن مكافحتها برش النباتات بمزيج من الماء والقليل من صابون الأطباق السائل. من الطرق الطبيعية الأخرى استخدام زيت النيم الذي يعتبر مبيداً حشرياً آمناً، أو جلب الحشرات النافعة مثل الدعسوقة التي تتغذى بشراهة على المن.",
    imageUrl: "https://images.unsplash.com/photo-1530836369250-ef72a3f5c9d6?w=500&q=80",
    tags: ["آفات", "حشرات", "علاج"],
    isPublished: true
  }
];

// Community posts: 5 with images, 5 without
const postsData = [
  // With images
  {
    plantTag: "Care Tips", title: "نبتة الفيكس تتساقط أوراقها!", content: "مرحباً، اشتريت نبتة فيكس ليراتا منذ أسبوعين والآن أوراقها تتساقط بشكل يومي. ما السبب برأيكم؟ أرفقت صورة لمكانها الحالي.",
    imagePath: "https://images.unsplash.com/photo-1623947413444-42b781df5df7?w=500&q=80"
  },
  {
    plantTag: "Diagnosis", title: "بقع بنية على أوراق البوتس", content: "لاحظت ظهور بقع بنية جافة على أطراف أوراق البوتس. هل هذا بسبب نقص الرطوبة أم فطر معين؟ أرجو المساعدة.",
    imagePath: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&q=80"
  },
  {
    plantTag: "Watering", title: "جدول ري نبات الثعبان", content: "شاركوني جدولكم المفضل لري نبات الثعبان (جلد النمر) في فصل الصيف، متى أعرف أنه يحتاج للماء؟ صورتها في شرفتي.",
    imagePath: "https://images.unsplash.com/photo-1599002505505-f938b8c56cc1?w=500&q=80"
  },
  {
    plantTag: "General", title: "أول زهرة تفتح عندي!", content: "أنا سعيدة جداً! زنبق السلام الخاص بي أخرج زهرة جديدة لأول مرة بعد سنة من العناية. شاهدوا جمالها.",
    imagePath: "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?w=500&q=80"
  },
  {
    plantTag: "Pests", title: "حشرات بيضاء صغيرة جداً", content: "وجدت هذه الحشرات البيضاء القطنية على أسفل الأوراق. هل هذا هو البق الدقيقي؟ وكيف أتخلص منه بسرعة قبل أن ينتشر؟",
    imagePath: "https://images.unsplash.com/photo-1530836369250-ef72a3f5c9d6?w=500&q=80"
  },
  // Without images
  {
    plantTag: "General", title: "ما هي أفضل النبتات للمبتدئين؟", content: "أريد البدء في تربية نباتات داخلية لكنني لست خبيراً. ما هي الأنواع التي تتحمل الإهمال قليلاً ولا تموت بسرعة؟",
  },
  {
    plantTag: "Care Tips", title: "نقل النبتة لأصيص أكبر", content: "متى يكون الوقت المناسب لنقل النبتة من أصيصها الحالي إلى واحد أكبر؟ وهل هناك علامات معينة تدل على ذلك؟",
  },
  {
    plantTag: "Watering", title: "الري من الأسفل أم الأعلى؟", content: "قرأت الكثير عن الري من الأسفل (غمر الأصيص في الماء) وأنه أفضل من الري من الأعلى. هل جرب أحدكم هذا؟ وما هي مميزاته؟",
  },
  {
    plantTag: "Diagnosis", title: "نمو بطيء جداً للمونستيرا", content: "لدي مونستيرا منذ أشهر ولم تخرج أي ورقة جديدة. أضعها في مكان مضاء وأرويها بانتظام. هل تحتاج لسماد معين؟",
  },
  {
    plantTag: "Pests", title: "تجعد أوراق الريحان", content: "زرعت ريحان في البلكونة وبدأت أوراقه تتجعد للداخل، ولا أرى أي حشرات بالعين المجردة. هل يمكن أن يكون بسبب الحرارة العالية؟",
  }
];

const commentsTemplates = [
  "نعم، هذا طبيعي في البداية تأكد فقط من الإضاءة.",
  "جرب تقليل كمية الماء وتأكد من جفاف التربة قبل الري.",
  "أنصحك باستخدام زيت النيم، فعال جداً في هذه الحالات.",
  "واو! ما شاء الله شكلها رائع جداً.",
  "أعتقد أنها تحتاج إلى سماد نيتروجيني أو نقلها لأصيص أكبر.",
  "هذا بق دقيقي بالتأكيد! اعزل النبتة فوراً واستخدم الكحول لمسحها.",
  "نبات الزاميا والبوتس ممتازة جداً للمبتدئين.",
  "يجب أن تراقب الجذور، إذا خرجت من أسفل الأصيص فهذا هو الوقت المناسب للنقل.",
  "الري من الأسفل ممتاز ويمنع تعفن الطبقة العلوية."
];

const seedContent = async () => {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI is missing");
    console.log("Connecting to", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    
    // Check USER_ID
    const userExists = await mongoose.connection.db!.collection('users').findOne({ _id: new mongoose.Types.ObjectId(USER_ID) });
    const authorId = userExists ? USER_ID : (await mongoose.connection.db!.collection('users').findOne({}))?._id || new mongoose.Types.ObjectId();
    const authorName = userExists ? userExists.name || "أحمد سعيد" : "مستخدم محب للنباتات";
    
    // Create articles
    await Article.deleteMany({});
    for (const a of articles) {
      await Article.create(a);
      console.log(`Created article: ${a.title}`);
    }

    // Create community posts
    await CommunityPost.deleteMany({});
    await Comment.deleteMany({});
    
    for (const [index, p] of postsData.entries()) {
      const isMyPost = index % 2 === 0;
      const postAuthorId = isMyPost ? authorId : OTHER_USER_ID;
      const postAuthorName = isMyPost ? authorName : "خبير زراعي " + index;
      
      const post = await CommunityPost.create({
        ...p,
        author: postAuthorId,
        authorName: postAuthorName,
        likes: Math.floor(Math.random() * 20) + 1,
        commentsCount: 2,
        clientOperationId: new mongoose.Types.ObjectId().toString()
      });
      
      // Add 2 comments for each post
      for (let i = 0; i < 2; i++) {
        const commentAuthorId = i === 0 ? OTHER_USER_ID : authorId;
        const commentAuthorName = i === 0 ? "عضو فعال" : authorName;
        await Comment.create({
          post: post._id,
          author: commentAuthorId,
          authorName: commentAuthorName,
          text: commentsTemplates[Math.floor(Math.random() * commentsTemplates.length)],
          clientOperationId: new mongoose.Types.ObjectId().toString()
        });
      }
      console.log(`Created post: ${p.title}`);
    }
    
    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding content:", error);
    process.exit(1);
  }
};

seedContent();
