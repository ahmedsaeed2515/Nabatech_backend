import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DiseaseKnowledgeRecord } from '../models/disease_knowledge_record_model';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nabatech';

const knowledgeBase = [
  {
    diseaseNameEn: "powdery mildew",
    diseaseNameAr: "البياض الدقيقي",
    severity: "medium",
    advice: "Ensure good air circulation, avoid overhead watering, and apply sulfur or potassium bicarbonate-based fungicides if the infection is severe. Prune affected leaves."
  },
  {
    diseaseNameEn: "leaf spot",
    diseaseNameAr: "تبقع الأوراق",
    severity: "low",
    advice: "Remove infected leaves. Water at the base of the plant to keep foliage dry. Apply copper-based fungicide if it spreads."
  },
  {
    diseaseNameEn: "wheat rust",
    diseaseNameAr: "صدأ الحنطة",
    severity: "high",
    advice: "Apply appropriate fungicides immediately. Ensure crop rotation and use rust-resistant varieties for future plantings."
  },
  {
    diseaseNameEn: "late blight",
    diseaseNameAr: "اللفحة المتأخرة",
    severity: "high",
    advice: "Highly destructive. Remove and destroy infected plants immediately. Apply copper-based fungicides to protect healthy plants."
  },
  {
    diseaseNameEn: "early blight",
    diseaseNameAr: "اللفحة المبكرة",
    severity: "medium",
    advice: "Remove affected lower leaves. Apply mulch to prevent soil splashing. Use a copper or chlorothalonil fungicide."
  },
  {
    diseaseNameEn: "aphids",
    diseaseNameAr: "حشرات المن",
    severity: "low",
    advice: "Spray with a strong stream of water, use insecticidal soap, or introduce natural predators like ladybugs."
  },
  {
    diseaseNameEn: "spider mites",
    diseaseNameAr: "العنكبوت الأحمر",
    severity: "medium",
    advice: "Increase humidity around the plant. Wash with water or apply neem oil / insecticidal soap."
  },
  {
    diseaseNameEn: "healthy",
    diseaseNameAr: "سليم",
    severity: "low",
    advice: "The plant looks healthy! Continue your current watering and light routine."
  },
  {
    diseaseNameEn: "bacterial blight",
    diseaseNameAr: "اللفحة البكتيرية",
    severity: "high",
    advice: "Prune during dry weather. Sterilize tools. Avoid overhead watering. Copper sprays can provide limited protection."
  },
  {
    diseaseNameEn: "mosaic virus",
    diseaseNameAr: "فيروس الفسيفساء",
    severity: "high",
    advice: "Incurable. Destroy the infected plant to prevent spreading. Control aphid populations as they transmit the virus."
  },
  {
    diseaseNameEn: "cercospora leaf spot",
    diseaseNameAr: "بقعة سيركوسبورا",
    severity: "medium",
    advice: "Remove infected foliage. Water at the soil level. Apply a suitable fungicide early in the season."
  },
  {
    diseaseNameEn: "rust",
    diseaseNameAr: "الصدأ",
    severity: "medium",
    advice: "Remove infected leaves. Apply sulfur or copper fungicides. Ensure plants have good air circulation."
  },
  {
    diseaseNameEn: "downy mildew",
    diseaseNameAr: "البياض الزغبي",
    severity: "high",
    advice: "Improve air circulation. Water in the morning so plants dry by evening. Apply protective fungicides."
  },
  {
    diseaseNameEn: "anthracnose",
    diseaseNameAr: "الأنثراكنوز",
    severity: "medium",
    advice: "Remove diseased parts. Clean tools. Apply copper-based fungicide to protect new growth."
  },
  {
    diseaseNameEn: "fusarium wilt",
    diseaseNameAr: "ذبول الفيوزاريوم",
    severity: "high",
    advice: "Soil-borne. Remove and destroy plant. Do not plant the same species in that soil for several years."
  },
  {
    diseaseNameEn: "nutrient deficiency",
    diseaseNameAr: "نقص المغذيات",
    severity: "low",
    advice: "Apply a balanced fertilizer. Check soil pH to ensure the plant can absorb nutrients properly."
  },
  {
    diseaseNameEn: "root rot",
    diseaseNameAr: "تعفن الجذور",
    severity: "high",
    advice: "Stop watering immediately. Ensure soil drains well. If severe, repot the plant in fresh soil after trimming dead roots."
  },
  {
    diseaseNameEn: "leaf blight",
    diseaseNameAr: "لفحة الأوراق",
    severity: "medium",
    advice: "Remove and dispose of infected leaves. Keep foliage dry. Apply copper fungicide."
  },
  {
    diseaseNameEn: "scab",
    diseaseNameAr: "الجرب",
    severity: "medium",
    advice: "Rake and destroy fallen leaves. Prune for airflow. Apply fungicide before symptoms appear next season."
  },
  {
    diseaseNameEn: "canker",
    diseaseNameAr: "السرطان",
    severity: "high",
    advice: "Prune out cankers during dry weather, cutting well below the infected area. Sterilize tools."
  },
  {
    diseaseNameEn: "whitefly",
    diseaseNameAr: "الذبابة البيضاء",
    severity: "medium",
    advice: "Use yellow sticky traps. Spray with insecticidal soap or neem oil."
  },
  {
    diseaseNameEn: "mealybug",
    diseaseNameAr: "البق الدقيقي",
    severity: "medium",
    advice: "Dab insects with alcohol using a cotton swab. Apply neem oil or insecticidal soap for larger infestations."
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const record of knowledgeBase) {
      await DiseaseKnowledgeRecord.findOneAndUpdate(
        { diseaseNameEn: record.diseaseNameEn },
        record,
        { upsert: true, new: true }
      );
    }

    console.log('Knowledge base seeded successfully!');
  } catch (error) {
    console.error('Error seeding knowledge base:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();


