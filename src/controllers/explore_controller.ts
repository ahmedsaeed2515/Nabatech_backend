import { Request, Response } from "express";
import StoreProduct from "../models/store_product_model";
import Expert from "../models/expert_model";
import OutbreakSpot from "../models/outbreak_spot_model";

// @desc    Get all store products
// @route   GET /api/explore/store-products
// @access  Public
export const getStoreProducts = async (req: Request, res: Response) => {
  try {
    let products = await StoreProduct.find();

    if (products.length === 0) {
      const seedProducts = [
        {
          name: "NPK Organic Fertilizer",
          category: "Nutrition",
          price: 14.99,
          rating: 4.8,
          subtitle: "High-quality organic nitrogen-phosphorus-potassium mix.",
          imageUrl: ""
        },
        {
          name: "Pruning Shears",
          category: "Tools",
          price: 24.99,
          rating: 4.6,
          subtitle: "Sharp carbon steel blades with ergonomic non-slip handle.",
          imageUrl: ""
        },
        {
          name: "Premium Soil Mix",
          category: "Nutrition",
          price: 10.00,
          rating: 4.7,
          subtitle: "Rich, aerated organic potting mix for healthy roots.",
          imageUrl: ""
        },
        {
          name: "Neem Oil spray",
          category: "Protection",
          price: 12.40,
          rating: 4.5,
          subtitle: "100% cold-pressed organic leaf shine and insecticide.",
          imageUrl: ""
        }
      ];
      await StoreProduct.create(seedProducts);
      products = await StoreProduct.find();
    }

    res.status(200).json({
      success: true,
      data: products.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        rating: p.rating,
        subtitle: p.subtitle,
        imageUrl: p.imageUrl || ""
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch store products", error });
  }
};

// @desc    Get all experts
// @route   GET /api/explore/experts
// @access  Public
export const getExperts = async (req: Request, res: Response) => {
  try {
    let experts = await Expert.find();

    if (experts.length === 0) {
      const seedExperts = [
        {
          name: "Dr. Ahmed Mansour",
          specialty: "Plant Pathology",
          rating: 4.9,
          sessions: 142,
          fee: 50,
          online: true,
        },
        {
          name: "Eng. Mariam Salem",
          specialty: "Hydroponics Specialist",
          rating: 4.7,
          sessions: 96,
          fee: 40,
          online: false,
        },
        {
          name: "Dr. Khaled Fawzy",
          specialty: "Soil Nutritionist",
          rating: 4.8,
          sessions: 115,
          fee: 60,
          online: true,
        }
      ];
      await Expert.create(seedExperts);
      experts = await Expert.find();
    }

    res.status(200).json({
      success: true,
      data: experts.map(e => ({
        id: e._id,
        name: e.name,
        specialty: e.specialty,
        rating: e.rating,
        sessions: e.sessions,
        fee: e.fee,
        online: e.online,
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch experts", error });
  }
};

// @desc    Get outbreak spots
// @route   GET /api/explore/outbreaks
// @access  Public
export const getOutbreaks = async (req: Request, res: Response) => {
  try {
    let spots = await OutbreakSpot.find();

    if (spots.length === 0) {
      const seedSpots = [
        {
          region: "Giza Region",
          disease: "Late Blight",
          severity: "high",
          cases: 120,
          trendPercent: 15,
          mapX: 0.35,
          mapY: 0.48,
          colorHex: "#FF4D4D",
        },
        {
          region: "Alexandria Region",
          disease: "Powdery Mildew",
          severity: "medium",
          cases: 75,
          trendPercent: -5,
          mapX: 0.22,
          mapY: 0.25,
          colorHex: "#FFA502",
        },
        {
          region: "Fayoum Region",
          disease: "Spider Mites",
          severity: "low",
          cases: 40,
          trendPercent: 2,
          mapX: 0.45,
          mapY: 0.65,
          colorHex: "#2ED573",
        }
      ];
      await OutbreakSpot.create(seedSpots);
      spots = await OutbreakSpot.find();
    }

    res.status(200).json({
      success: true,
      data: spots.map(s => ({
        id: s._id,
        region: s.region,
        disease: s.disease,
        severity: s.severity,
        cases: s.cases,
        trendPercent: s.trendPercent,
        mapX: s.mapX,
        mapY: s.mapY,
        colorHex: s.colorHex,
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch outbreaks", error });
  }
};

// @desc    Create a store product (Admin only)
// @route   POST /api/explore/store-products
// @access  Private/Admin
export const createStoreProduct = async (req: Request, res: Response) => {
  try {
    const { name, category, price, subtitle, imageUrl } = req.body;
    if (!name || !category || price === undefined || !subtitle) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields (name, category, price, subtitle)" });
    }
    const product = await StoreProduct.create({
      name,
      category,
      price: Number(price),
      subtitle,
      imageUrl: imageUrl || "",
    });
    res.status(201).json({
      success: true,
      data: {
        id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        rating: product.rating,
        subtitle: product.subtitle,
        imageUrl: product.imageUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create store product", error });
  }
};

// @desc    Delete a store product (Admin only)
// @route   DELETE /api/explore/store-products/:id
// @access  Private/Admin
export const deleteStoreProduct = async (req: Request, res: Response) => {
  try {
    const product = await StoreProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    await StoreProduct.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete product", error });
  }
};

// @desc    Create an expert (Admin only)
// @route   POST /api/explore/experts
// @access  Private/Admin
export const createExpert = async (req: Request, res: Response) => {
  try {
    const { name, specialty, fee, online } = req.body;
    if (!name || !specialty || fee === undefined) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields (name, specialty, fee)" });
    }
    const expert = await Expert.create({
      name,
      specialty,
      fee: Number(fee),
      online: online === true || online === "true",
    });
    res.status(201).json({
      success: true,
      data: {
        id: expert._id,
        name: expert.name,
        specialty: expert.specialty,
        rating: expert.rating,
        sessions: expert.sessions,
        fee: expert.fee,
        online: expert.online,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create expert", error });
  }
};

// @desc    Delete an expert (Admin only)
// @route   DELETE /api/explore/experts/:id
// @access  Private/Admin
export const deleteExpert = async (req: Request, res: Response) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) {
      return res.status(404).json({ success: false, message: "Expert not found" });
    }
    await Expert.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Expert deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete expert", error });
  }
};

// FIXED: @desc    Create an outbreak spot (Admin only)
// @route   POST /api/explore/outbreaks
// @access  Private/Admin
export const createOutbreak = async (req: Request, res: Response) => {
  try {
    const { region, disease, severity, cases, trendPercent } = req.body;
    if (!region || !disease || !severity) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields (region, disease, severity)" });
    }
    const outbreak = await OutbreakSpot.create({
      region,
      disease,
      severity,
      cases: Number(cases) || 0,
      trendPercent: Number(trendPercent) || 0,
      mapX: Math.random() * 0.6 + 0.2, // standard random placement coordinates
      mapY: Math.random() * 0.6 + 0.2,
      colorHex: severity === "high" ? "#FF4D4D" : severity === "medium" ? "#FFA502" : "#2ED573",
    });
    res.status(201).json({
      success: true,
      data: {
        id: outbreak._id,
        region: outbreak.region,
        disease: outbreak.disease,
        severity: outbreak.severity,
        cases: outbreak.cases,
        trendPercent: outbreak.trendPercent,
        mapX: outbreak.mapX,
        mapY: outbreak.mapY,
        colorHex: outbreak.colorHex,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create outbreak spot", error });
  }
};

// FIXED: @desc    Delete an outbreak spot (Admin only)
// @route   DELETE /api/explore/outbreaks/:id
// @access  Private/Admin
export const deleteOutbreak = async (req: Request, res: Response) => {
  try {
    const outbreak = await OutbreakSpot.findById(req.params.id);
    if (!outbreak) {
      return res.status(404).json({ success: false, message: "Outbreak spot not found" });
    }
    await OutbreakSpot.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Outbreak spot deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete outbreak spot", error });
  }
};

// FIXED: @desc    Update an outbreak spot (Admin only)
// @route   PUT /api/explore/outbreaks/:id
// @access  Private/Admin
export const updateOutbreak = async (req: Request, res: Response) => {
  try {
    const { region, disease, severity, cases, trendPercent, mapX, mapY } = req.body;
    const outbreak = await OutbreakSpot.findById(req.params.id);
    if (!outbreak) {
      return res.status(404).json({ success: false, message: "Outbreak spot not found" });
    }

    if (region !== undefined) outbreak.region = region;
    if (disease !== undefined) outbreak.disease = disease;
    if (severity !== undefined) {
      if (!['high', 'medium', 'low'].includes(severity)) {
        return res.status(400).json({ success: false, message: "Invalid severity specified (high, medium, low)" });
      }
      outbreak.severity = severity;
      outbreak.colorHex = severity === "high" ? "#FF4D4D" : severity === "medium" ? "#FFA502" : "#2ED573";
    }
    if (cases !== undefined) outbreak.cases = Number(cases);
    if (trendPercent !== undefined) outbreak.trendPercent = Number(trendPercent);
    if (mapX !== undefined) outbreak.mapX = Number(mapX);
    if (mapY !== undefined) outbreak.mapY = Number(mapY);

    await outbreak.save();

    res.status(200).json({
      success: true,
      data: {
        id: outbreak._id,
        region: outbreak.region,
        disease: outbreak.disease,
        severity: outbreak.severity,
        cases: outbreak.cases,
        trendPercent: outbreak.trendPercent,
        mapX: outbreak.mapX,
        mapY: outbreak.mapY,
        colorHex: outbreak.colorHex,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update outbreak spot", error });
  }
};

