import Plant from "../models/plant_model";
import Disease from "../models/disease_model";
import User from "../models/user_model";
import bcrypt from "bcrypt";

export const seedPlantLibrary = async () => {
  try {
    const plantCount = await Plant.countDocuments();
    if (plantCount === 0) {
      console.log("Seeding plants into the database...");
      const plantsWithSlug = seedPlants.map((p, i) => ({
        ...p,
        slug: p.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + i,
        normalizedNameEn: p.nameEn.toLowerCase(),
        normalizedNameAr: p.nameAr,
      }));
      await Plant.create(plantsWithSlug);
      console.log("Plants seeded successfully.");
    }

    const diseaseCount = await Disease.countDocuments();
    if (diseaseCount === 0) {
      console.log("Seeding diseases into the database...");
      const diseasesWithSlug = seedDiseases.map((d, i) => ({
        ...d,
        slug: d.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + i,
        normalizedNameEn: d.nameEn.toLowerCase(),
        normalizedNameAr: d.nameAr,
      }));
      await Disease.create(diseasesWithSlug);
      console.log("Diseases seeded successfully.");
    }
  } catch (error) {
    console.error("Failed to seed plant library database:", error);
  }
};

export const seedDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@nabatech.com";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin1234";
    const adminName = process.env.DEFAULT_ADMIN_NAME || "Nabatech Admin";

    const exists = await User.findOne({ email: adminEmail });
    if (exists) return;

    const hashed = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashed,
      role: "admin",
    });

    console.log(`Default admin seeded: ${adminEmail}`);
  } catch (error) {
    console.error("Failed to seed default admin:", error);
  }
};

const seedPlants = [
  {
    nameAr: "فيكس ليراتا",
    nameEn: "Fiddle Leaf Fig",
    scientificName: "Ficus lyrata",
    imageUrl: "https://images.unsplash.com/photo-1597055181300-e3633a0174ec?auto=format&fit=crop&q=80&w=800",
    category: "نباتات داخلية",
    careLevel: "medium",
    descriptionAr: "نبات زينة داخلي مشهور بأوراقه الكبيرة اللامعة، يحتاج عناية معتدلة وإضاءة جيدة.",
    descriptionEn: "A popular indoor ornamental plant with large glossy leaves that needs moderate care and good light."
  },
  {
    nameAr: "نبات الثعبان",
    nameEn: "Snake Plant",
    scientificName: "Dracaena trifasciata",
    imageUrl: "https://images.unsplash.com/photo-1593482892290-f5619198eb53?auto=format&fit=crop&q=80&w=800",
    category: "سهلة العناية",
    careLevel: "easy",
    descriptionAr: "نبات قوي وسهل العناية، يتحمل الإهمال وقليل الإضاءة.",
    descriptionEn: "A tough, low-maintenance plant that tolerates neglect and low light conditions."
  },
  {
    nameAr: "ألوفيرا",
    nameEn: "Aloe Vera",
    scientificName: "Aloe vera",
    imageUrl: "https://images.unsplash.com/photo-1596547609652-9cb5d8d73b22?auto=format&fit=crop&q=80&w=800",
    category: "سهلة العناية",
    careLevel: "easy",
    descriptionAr: "نبات عصاري معروف بفوائده الطبية واستخداماته في العناية بالبشرة.",
    descriptionEn: "A succulent plant known for medicinal benefits and common skincare uses."
  },
  {
    nameAr: "بيبروميا",
    nameEn: "Peperomia",
    scientificName: "Peperomia obtusifolia",
    imageUrl: "https://images.unsplash.com/photo-1620127599026-66f81a70cbbe?auto=format&fit=crop&q=80&w=800",
    category: "نباتات داخلية",
    careLevel: "easy",
    descriptionAr: "نبات صغير مناسب للمكاتب والمساحات الضيقة، سهل العناية.",
    descriptionEn: "A compact plant ideal for desks and small spaces, and very easy to care for."
  },
  {
    nameAr: "مونستيرا",
    nameEn: "Monstera",
    scientificName: "Monstera deliciosa",
    imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=800",
    category: "نباتات داخلية",
    careLevel: "medium",
    descriptionAr: "نبات استوائي شهير بأوراقه المثقبة المميزة، يعطي مظهر عصري.",
    descriptionEn: "A popular tropical plant with signature split leaves that gives a modern look."
  },
  {
    nameAr: "طماطم",
    nameEn: "Tomato",
    scientificName: "Solanum lycopersicum",
    imageUrl: "https://images.unsplash.com/photo-1592841200221-a6898f307ba8?auto=format&fit=crop&q=80&w=800",
    category: "محاصيل",
    careLevel: "medium",
    descriptionAr: "نبات مثمر شائع يُزرع لإنتاج الطماطم ويحتاج عناية منتظمة.",
    descriptionEn: "A common fruiting crop grown for tomatoes and requiring consistent care."
  },
  {
    nameAr: "لافندر",
    nameEn: "Lavender",
    scientificName: "Lavandula",
    imageUrl: "https://images.unsplash.com/photo-1495908333425-29a1e0918c5f?auto=format&fit=crop&q=80&w=800",
    category: "نباتات مزهرة",
    careLevel: "easy",
    descriptionAr: "نبات عطري يستخدم في الزيوت العطرية وله رائحة مميزة مهدئة.",
    descriptionEn: "An aromatic plant used in essential oils with a distinctive calming fragrance."
  },
  {
    nameAr: "بوتس",
    nameEn: "Pothos",
    scientificName: "Epipremnum aureum",
    imageUrl: "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?auto=format&fit=crop&q=80&w=800",
    category: "سهلة العناية",
    careLevel: "easy",
    descriptionAr: "نبات متسلق سهل العناية، مناسب للمبتدئين وينمو بسرعة.",
    descriptionEn: "An easy-care trailing plant, great for beginners and fast growing."
  },
  {
    nameAr: "زاميا",
    nameEn: "ZZ Plant",
    scientificName: "Zamioculcas zamiifolia",
    imageUrl: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&q=80&w=800",
    category: "سهلة العناية",
    careLevel: "easy",
    descriptionAr: "نبات قوي جدًا يتحمل قلة الضوء والإهمال.",
    descriptionEn: "A very resilient plant that tolerates low light and neglect."
  },
  {
    nameAr: "جهنمية",
    nameEn: "Bougainvillea",
    scientificName: "Bougainvillea spectabilis",
    imageUrl: "https://images.unsplash.com/photo-1599383637775-8fb9d6439fc7?auto=format&fit=crop&q=80&w=800",
    category: "نباتات خارجية",
    careLevel: "medium",
    descriptionAr: "نبات متسلق مزهر بألوان زاهية يستخدم في الحدائق.",
    descriptionEn: "A flowering climber with vivid colors, widely used in gardens."
  },
  {
    nameAr: "ياسمين",
    nameEn: "Jasmine",
    scientificName: "Jasminum officinale",
    imageUrl: "https://images.unsplash.com/photo-1596752044810-67c13da82ad0?auto=format&fit=crop&q=80&w=800",
    category: "نباتات خارجية",
    careLevel: "medium",
    descriptionAr: "نبات عطري مزهر مشهور برائحته الجميلة ويستخدم في الحدائق والعطور.",
    descriptionEn: "A fragrant flowering plant known for its beautiful scent and use in gardens and perfumes."
  },
  {
    nameAr: "نبات العنكبوت",
    nameEn: "Spider Plant",
    scientificName: "Chlorophytum comosum",
    imageUrl: "https://images.unsplash.com/photo-1613567784651-7870a3c267c8?auto=format&fit=crop&q=80&w=800",
    category: "نباتات داخلية",
    careLevel: "easy",
    descriptionAr: "نبات داخلي سهل العناية يتميز بأوراقه الطويلة وينتج نباتات صغيرة.",
    descriptionEn: "An easy indoor plant with long leaves that produces small offshoots."
  },
  {
    nameAr: "أوركيد",
    nameEn: "Orchid",
    scientificName: "Phalaenopsis",
    imageUrl: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800",
    category: "نباتات مزهرة",
    careLevel: "hard",
    descriptionAr: "نبات مزهر فاخر يحتاج عناية خاصة وظروف دقيقة لينمو بشكل جيد.",
    descriptionEn: "A premium flowering plant that needs special care and precise growing conditions."
  },
  {
    nameAr: "شجرة الليمون",
    nameEn: "Lemon Tree",
    scientificName: "Citrus limon",
    imageUrl: "https://images.unsplash.com/photo-1561570183-b77da1b17e4f?auto=format&fit=crop&q=80&w=800",
    category: "محاصيل",
    careLevel: "medium",
    descriptionAr: "شجرة مثمرة تنتج الليمون وتحتاج إلى ضوء قوي وعناية منتظمة.",
    descriptionEn: "A fruit tree that produces lemons and needs strong light and regular care."
  },
  {
    nameAr: "نعناع",
    nameEn: "Mint",
    scientificName: "Mentha",
    imageUrl: "https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?auto=format&fit=crop&q=80&w=800",
    category: "مأكولات",
    careLevel: "easy",
    descriptionAr: "نبات عطري سريع النمو يستخدم في الطعام والمشروبات.",
    descriptionEn: "A fast-growing aromatic herb commonly used in foods and drinks."
  },
  {
    nameAr: "عباد الشمس",
    nameEn: "Sunflower",
    scientificName: "Helianthus annuus",
    imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&q=80&w=800",
    category: "نباتات مزهرة",
    careLevel: "easy",
    descriptionAr: "نبات سنوي طويل يُعرف بأزهاره الصفراء الكبيرة التي تتتبع الشمس.",
    descriptionEn: "A tall annual plant known for its large yellow flowers that track the sun."
  },
  {
    nameAr: "الكركديه",
    nameEn: "Hibiscus",
    scientificName: "Hibiscus sabdariffa",
    imageUrl: "https://images.unsplash.com/photo-1555581977-154df66c7471?auto=format&fit=crop&q=80&w=800",
    category: "نباتات مزهرة",
    careLevel: "medium",
    descriptionAr: "نبات استوائي جميل بأزهار حمراء كبيرة، يُستخدم لصنع الشاي.",
    descriptionEn: "A beautiful tropical plant with large red flowers, used for making tea."
  },
  {
    nameAr: "الورد",
    nameEn: "Rose",
    scientificName: "Rosa damascena",
    imageUrl: "https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&q=80&w=800",
    category: "نباتات مزهرة",
    careLevel: "medium",
    descriptionAr: "ملكة الأزهار، معروفة برائحتها الزكية والألوان الجميلة.",
    descriptionEn: "Queen of flowers, known for fragrance and beautiful colors."
  },
  {
    nameAr: "الريحان",
    nameEn: "Basil",
    scientificName: "Ocimum basilicum",
    imageUrl: "https://images.unsplash.com/photo-1606859191834-bd12c9fbdb65?auto=format&fit=crop&q=80&w=800",
    category: "مأكولات",
    careLevel: "easy",
    descriptionAr: "عشبة عطرية شهيرة تُستخدم في الطهي، سهلة الزراعة.",
    descriptionEn: "A famous aromatic herb used in cooking, easy to grow."
  },
  {
    nameAr: "الزنجبيل",
    nameEn: "Ginger",
    scientificName: "Zingiber officinale",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800",
    category: "محاصيل",
    careLevel: "medium",
    descriptionAr: "نبات جذري يُستخدم في الطب والطهي، ينمو في تربة رطبة.",
    descriptionEn: "A rhizomatous plant used in medicine and cooking."
  },
  {
    nameAr: "الشاي",
    nameEn: "Tea Plant",
    scientificName: "Camellia sinensis",
    imageUrl: "https://images.unsplash.com/photo-1587574293340-e0011c4e8ebb?auto=format&fit=crop&q=80&w=800",
    category: "محاصيل",
    careLevel: "medium",
    descriptionAr: "نبات استوائي يُنتج أوراق الشاي الشهيرة.",
    descriptionEn: "A tropical plant that produces famous tea leaves."
  },
  {
    nameAr: "الصبار",
    nameEn: "Cactus",
    scientificName: "Cactaceae",
    imageUrl: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&q=80&w=800",
    category: "سهلة العناية",
    careLevel: "easy",
    descriptionAr: "نبات صحراوي قاسي يتحمل الجفاف والحرارة.",
    descriptionEn: "A hardy desert plant tolerates drought and heat."
  },
  {
    nameAr: "البابونج",
    nameEn: "Chamomile",
    scientificName: "Matricaria chamomilla",
    imageUrl: "https://images.unsplash.com/photo-1599940778173-e276d4acb2bc?auto=format&fit=crop&q=80&w=800",
    category: "مأكولات",
    careLevel: "easy",
    descriptionAr: "زهرة بيضاء صغيرة تُستخدم لصنع شاي مهدئ.",
    descriptionEn: "Small white flowers used to make relaxing tea."
  }
];

const seedDiseases = [
  {
    nameAr: "البياض الدقيقي",
    nameEn: "Powdery Mildew",
    imageUrl: "https://images.unsplash.com/photo-1629198642307-2a54ce6e1291?q=80&w=800&auto=format&fit=crop",
    severity: "medium",
    type: "Fungal",
    affectedPlantsCount: 120,
    descriptionAr: "مرض فطري يسبب طبقة بيضاء مسحوقية على سطح الأوراق. يظهر غالبا مع الرطوبة العالية.",
    descriptionEn: "A fungal disease causing a powdery white layer on leaf surfaces. Often appears in high humidity."
  },
  {
    nameAr: "تبقع الأوراق البكتيري",
    nameEn: "Bacterial Leaf Spot",
    imageUrl: "https://images.unsplash.com/photo-1587841198424-df3abfdb4a39?q=80&w=800&auto=format&fit=crop",
    severity: "high",
    type: "Bacterial",
    affectedPlantsCount: 85,
    descriptionAr: "يسبب بقعا داكنة على الأوراق وقد يؤدي إلى تساقطها المبكر.",
    descriptionEn: "Causes dark spots on leaves and can lead to premature leaf drop."
  },
  {
    nameAr: "عفن الجذور",
    nameEn: "Root Rot",
    imageUrl: "https://images.unsplash.com/photo-1601633512211-1ad52b6357cc?q=80&w=800&auto=format&fit=crop",
    severity: "high",
    type: "Fungal",
    affectedPlantsCount: 200,
    descriptionAr: "ينتج غالبا عن زيادة الري وضعف التصريف، فتتحول الجذور إلى اللون البني.",
    descriptionEn: "Often results from overwatering and poor drainage, causing roots to turn brown."
  },
  {
    nameAr: "تآكل الأوراق",
    nameEn: "Leaf Miners",
    imageUrl: "https://images.unsplash.com/photo-1596484391307-fcf873ffbd4f?q=80&w=800&auto=format&fit=crop",
    severity: "low",
    type: "Pest",
    affectedPlantsCount: 45,
    descriptionAr: "حشرة تضع بيضها داخل الأوراق وتترك خطوطا متعرجة بيضاء أثناء تغذيها.",
    descriptionEn: "An insect that lays eggs inside leaves, leaving winding white trails as it feeds."
  },
  {
    nameAr: "حشرة المن",
    nameEn: "Aphids",
    imageUrl: "https://images.unsplash.com/photo-1621379374092-23f2f01f074d?q=80&w=800&auto=format&fit=crop",
    severity: "medium",
    type: "Pest",
    affectedPlantsCount: 300,
    descriptionAr: "حشرات صغيرة تمتص عصارة النبات وتسبب اصفرار الأوراق وضعف النمو.",
    descriptionEn: "Small insects that suck plant sap, causing leaves to yellow and weakening growth."
  },
  {
    nameAr: "العنكبوت الأحمر",
    nameEn: "Spider Mites",
    imageUrl: "https://images.unsplash.com/photo-1607518534882-628d63aab74a?q=80&w=800&auto=format&fit=crop",
    severity: "high",
    type: "Pest",
    affectedPlantsCount: 180,
    descriptionAr: "آفة دقيقة تنشط في الجو الحار، تترك نقطا صفراء وشبكات خفيفة على الأوراق.",
    descriptionEn: "A tiny pest active in hot weather, leaving yellow spots and light webbing on leaves."
  }
];
