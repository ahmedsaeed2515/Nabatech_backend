import mongoose from "mongoose";
import dotenv from "dotenv";
import Plant from "../src/models/plant_model";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const plants = [
  {
    nameAr: "صبار الألوفيرا",
    nameEn: "Aloe Vera",
    scientificName: "Aloe barbadensis miller",
    imageUrl: "https://images.unsplash.com/photo-1596547609652-9cb5d8d73729?w=500&q=80",
    category: "Succulent",
    careLevel: "Easy",
    descriptionAr: "نبات عصاري شهير بخصائصه الطبية والمهدئة للجلد.",
    descriptionEn: "A popular succulent known for its medicinal properties.",
    waterRequirements: "Low",
    lightRequirements: "Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "نبات الثعبان",
    nameEn: "Snake Plant",
    scientificName: "Sansevieria trifasciata",
    imageUrl: "https://images.unsplash.com/photo-1599002505505-f938b8c56cc1?w=500&q=80",
    category: "Succulent",
    careLevel: "Very Easy",
    descriptionAr: "نبات داخلي شديد التحمل وينقي الهواء.",
    descriptionEn: "A hardy indoor plant that purifies air.",
    waterRequirements: "Low",
    lightRequirements: "Low to Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "نبات العنكبوت",
    nameEn: "Spider Plant",
    scientificName: "Chlorophytum comosum",
    imageUrl: "https://images.unsplash.com/photo-1612363228103-b0bc91a78e87?w=500&q=80",
    category: "Indoor",
    careLevel: "Easy",
    descriptionAr: "نبات معلق سريع النمو وجميل المظهر.",
    descriptionEn: "Fast-growing and beautiful hanging plant.",
    waterRequirements: "Medium",
    lightRequirements: "Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "زنبق السلام",
    nameEn: "Peace Lily",
    scientificName: "Spathiphyllum",
    imageUrl: "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?w=500&q=80",
    category: "Flowering",
    careLevel: "Medium",
    descriptionAr: "نبات داخلي ينتج زهور بيضاء جميلة وينقي الهواء.",
    descriptionEn: "Produces beautiful white flowers and purifies air.",
    waterRequirements: "High",
    lightRequirements: "Low to Medium",
    isLibraryItem: true,
  },
  {
    nameAr: "نبات البوتس",
    nameEn: "Pothos",
    scientificName: "Epipremnum aureum",
    imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&q=80",
    category: "Vine",
    careLevel: "Very Easy",
    descriptionAr: "نبات متسلق سهل العناية ومثالي للمبتدئين.",
    descriptionEn: "Easy to care climbing plant, perfect for beginners.",
    waterRequirements: "Medium",
    lightRequirements: "Low to Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "مونستيرا",
    nameEn: "Monstera Deliciosa",
    scientificName: "Monstera deliciosa",
    imageUrl: "https://images.unsplash.com/photo-1614594895304-fe7116ac3b58?w=500&q=80",
    category: "Indoor",
    careLevel: "Medium",
    descriptionAr: "نبات ذو أوراق كبيرة مميزة بفتحات طبيعية.",
    descriptionEn: "Iconic large leaves with natural holes.",
    waterRequirements: "Medium",
    lightRequirements: "Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "نبات الزاميا",
    nameEn: "ZZ Plant",
    scientificName: "Zamioculcas zamiifolia",
    imageUrl: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=500&q=80",
    category: "Indoor",
    careLevel: "Very Easy",
    descriptionAr: "نبات داخلي يتحمل الإضاءة الضعيفة وقلة الري.",
    descriptionEn: "Tolerates low light and infrequent watering.",
    waterRequirements: "Low",
    lightRequirements: "Low to Medium",
    isLibraryItem: true,
  },
  {
    nameAr: "نبات المطاط",
    nameEn: "Rubber Plant",
    scientificName: "Ficus elastica",
    imageUrl: "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?w=500&q=80",
    category: "Tree",
    careLevel: "Medium",
    descriptionAr: "شجرة داخلية بأوراق لامعة وسميكة.",
    descriptionEn: "Indoor tree with thick, glossy leaves.",
    waterRequirements: "Medium",
    lightRequirements: "Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "تين ليراتي",
    nameEn: "Fiddle Leaf Fig",
    scientificName: "Ficus lyrata",
    imageUrl: "https://images.unsplash.com/photo-1623947413444-42b781df5df7?w=500&q=80",
    category: "Tree",
    careLevel: "Hard",
    descriptionAr: "نبات داخلي شهير بأوراقه الكبيرة التي تشبه آلة الكمان.",
    descriptionEn: "Famous for its large, violin-shaped leaves.",
    waterRequirements: "Medium",
    lightRequirements: "Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "نبات اليشم",
    nameEn: "Jade Plant",
    scientificName: "Crassula ovata",
    imageUrl: "https://images.unsplash.com/photo-1596547609652-9cb5d8d73729?w=500&q=80",
    category: "Succulent",
    careLevel: "Easy",
    descriptionAr: "نبات عصاري يعتقد أنه يجلب الحظ الجيد.",
    descriptionEn: "A succulent believed to bring good luck.",
    waterRequirements: "Low",
    lightRequirements: "Bright indirect to Direct",
    isLibraryItem: true,
  },
  {
    nameAr: "خنشار بوسطن",
    nameEn: "Boston Fern",
    scientificName: "Nephrolepis exaltata",
    imageUrl: "https://images.unsplash.com/photo-1611211232932-da3113c5b960?w=500&q=80",
    category: "Fern",
    careLevel: "Medium",
    descriptionAr: "سرخس جميل يحتاج لنسبة رطوبة عالية.",
    descriptionEn: "Beautiful fern requiring high humidity.",
    waterRequirements: "High",
    lightRequirements: "Medium indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "لبلاب إنجليزي",
    nameEn: "English Ivy",
    scientificName: "Hedera helix",
    imageUrl: "https://images.unsplash.com/photo-1582299763782-263223126f5f?w=500&q=80",
    category: "Vine",
    careLevel: "Easy",
    descriptionAr: "متسلق كلاسيكي جميل.",
    descriptionEn: "Classic beautiful climber.",
    waterRequirements: "Medium",
    lightRequirements: "Medium to Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "فيلوديندرون",
    nameEn: "Philodendron",
    scientificName: "Philodendron hederaceum",
    imageUrl: "https://images.unsplash.com/photo-1601370690183-1c7796ecec61?w=500&q=80",
    category: "Vine",
    careLevel: "Easy",
    descriptionAr: "نبات ذو أوراق على شكل قلب.",
    descriptionEn: "Heart-shaped leaves plant.",
    waterRequirements: "Medium",
    lightRequirements: "Medium indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "كالاتيا",
    nameEn: "Calathea",
    scientificName: "Calathea makoyana",
    imageUrl: "https://images.unsplash.com/photo-1620127807584-2fa07b469cc9?w=500&q=80",
    category: "Indoor",
    careLevel: "Hard",
    descriptionAr: "نبات ذو نقوش مذهلة على أوراقه.",
    descriptionEn: "Plant with stunning patterns on leaves.",
    waterRequirements: "High",
    lightRequirements: "Medium indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "أنتوريوم",
    nameEn: "Anthurium",
    scientificName: "Anthurium andraeanum",
    imageUrl: "https://images.unsplash.com/photo-1582299763782-263223126f5f?w=500&q=80",
    category: "Flowering",
    careLevel: "Medium",
    descriptionAr: "يتميز بزهور حمراء شمعية رائعة.",
    descriptionEn: "Features striking red waxy flowers.",
    waterRequirements: "Medium",
    lightRequirements: "Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "نخيل البامبو",
    nameEn: "Bamboo Palm",
    scientificName: "Chamaedorea seifrizii",
    imageUrl: "https://images.unsplash.com/photo-1604762512697-b952aa664ce4?w=500&q=80",
    category: "Palm",
    careLevel: "Medium",
    descriptionAr: "نخلة داخلية تضفي لمسة استوائية.",
    descriptionEn: "Indoor palm adding a tropical touch.",
    waterRequirements: "Medium",
    lightRequirements: "Medium indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "نخيل الأريكا",
    nameEn: "Areca Palm",
    scientificName: "Dypsis lutescens",
    imageUrl: "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?w=500&q=80",
    category: "Palm",
    careLevel: "Medium",
    descriptionAr: "من أفضل النباتات لتنقية الهواء.",
    descriptionEn: "One of the best air purifying plants.",
    waterRequirements: "High",
    lightRequirements: "Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "دراسينا مارجيناتا",
    nameEn: "Dracaena Marginata",
    scientificName: "Dracaena marginata",
    imageUrl: "https://images.unsplash.com/photo-1611211232932-da3113c5b960?w=500&q=80",
    category: "Tree",
    careLevel: "Easy",
    descriptionAr: "نبات ذو أوراق شريطية وحواف حمراء.",
    descriptionEn: "Plant with ribbon-like leaves and red edges.",
    waterRequirements: "Medium",
    lightRequirements: "Medium to Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "بيبيروميا",
    nameEn: "Peperomia",
    scientificName: "Peperomia obtusifolia",
    imageUrl: "https://images.unsplash.com/photo-1599002505505-f938b8c56cc1?w=500&q=80",
    category: "Indoor",
    careLevel: "Easy",
    descriptionAr: "نبات صغير ذو أوراق سميكة.",
    descriptionEn: "Small plant with thick leaves.",
    waterRequirements: "Low",
    lightRequirements: "Medium to Bright indirect",
    isLibraryItem: true,
  },
  {
    nameAr: "مجموعة عصاريات",
    nameEn: "Succulents Mix",
    scientificName: "Various Succulents",
    imageUrl: "https://images.unsplash.com/photo-1596547609652-9cb5d8d73729?w=500&q=80",
    category: "Succulent",
    careLevel: "Easy",
    descriptionAr: "مجموعة متنوعة من النباتات العصارية.",
    descriptionEn: "A variety of succulent plants.",
    waterRequirements: "Low",
    lightRequirements: "Bright direct",
    isLibraryItem: true,
  }
];

const seedDB = async () => {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI is missing");
    console.log("Connecting to", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    for (const p of plants) {
      const slug = p.nameEn.toLowerCase().replace(/\s+/g, '-');
      const existing = await Plant.findOne({ slug });
      if (!existing) {
        await Plant.create({
          ...p,
          slug,
          normalizedNameEn: p.nameEn.toLowerCase(),
          normalizedNameAr: p.nameAr.toLowerCase(),
          active: true
        });
        console.log(`Added ${p.nameEn}`);
      } else {
        console.log(`Skipped ${p.nameEn} (already exists)`);
      }
    }
    
    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
};

seedDB();
