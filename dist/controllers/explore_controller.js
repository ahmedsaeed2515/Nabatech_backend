"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOutbreak = exports.deleteOutbreak = exports.createOutbreak = exports.deleteExpert = exports.createExpert = exports.deleteStoreProduct = exports.createStoreProduct = exports.getOutbreaks = exports.getExperts = exports.getStoreProducts = void 0;
const store_product_model_1 = __importDefault(require("../models/store_product_model"));
const expert_model_1 = __importDefault(require("../models/expert_model"));
const outbreak_spot_model_1 = __importDefault(require("../models/outbreak_spot_model"));
const api_response_1 = require("../utils/api_response");
// @desc    Get all store products
// @route   GET /api/explore/store-products
// @access  Public
const getStoreProducts = async (req, res) => {
    try {
        const { category } = req.query;
        const query = {};
        if (category) {
            query.category = category;
        }
        const products = await store_product_model_1.default.find(query);
        return (0, api_response_1.ok)(res, products.map(p => ({
            id: p._id,
            name: p.name,
            category: p.category,
            price: p.price,
            rating: p.rating,
            subtitle: p.subtitle,
            imageUrl: p.imageUrl || ""
        })));
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch store products", error });
    }
};
exports.getStoreProducts = getStoreProducts;
// @desc    Get all experts
// @route   GET /api/explore/experts
// @access  Public
const getExperts = async (req, res) => {
    try {
        const { specialty } = req.query;
        const query = {};
        if (specialty) {
            query.specialty = specialty;
        }
        const experts = await expert_model_1.default.find(query);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch experts", error });
    }
};
exports.getExperts = getExperts;
// @desc    Get outbreak spots
// @route   GET /api/explore/outbreaks
// @access  Public
const getOutbreaks = async (req, res) => {
    try {
        const spots = await outbreak_spot_model_1.default.find();
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch outbreaks", error });
    }
};
exports.getOutbreaks = getOutbreaks;
// @desc    Create a store product (Admin only)
// @route   POST /api/explore/store-products
// @access  Private/Admin
const createStoreProduct = async (req, res) => {
    try {
        const { name, category, price, subtitle, imageUrl } = req.body;
        if (!name || !category || price === undefined || !subtitle) {
            return res.status(400).json({ success: false, message: "Please fill in all required fields (name, category, price, subtitle)" });
        }
        const product = await store_product_model_1.default.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to create store product", error });
    }
};
exports.createStoreProduct = createStoreProduct;
// @desc    Delete a store product (Admin only)
// @route   DELETE /api/explore/store-products/:id
// @access  Private/Admin
const deleteStoreProduct = async (req, res) => {
    try {
        const product = await store_product_model_1.default.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        await store_product_model_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete product", error });
    }
};
exports.deleteStoreProduct = deleteStoreProduct;
// @desc    Create an expert (Admin only)
// @route   POST /api/explore/experts
// @access  Private/Admin
const createExpert = async (req, res) => {
    try {
        const { name, specialty, fee, online } = req.body;
        if (!name || !specialty || fee === undefined) {
            return res.status(400).json({ success: false, message: "Please fill in all required fields (name, specialty, fee)" });
        }
        const expert = await expert_model_1.default.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to create expert", error });
    }
};
exports.createExpert = createExpert;
// @desc    Delete an expert (Admin only)
// @route   DELETE /api/explore/experts/:id
// @access  Private/Admin
const deleteExpert = async (req, res) => {
    try {
        const expert = await expert_model_1.default.findById(req.params.id);
        if (!expert) {
            return res.status(404).json({ success: false, message: "Expert not found" });
        }
        await expert_model_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: "Expert deleted successfully"
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete expert", error });
    }
};
exports.deleteExpert = deleteExpert;
// FIXED: @desc    Create an outbreak spot (Admin only)
// @route   POST /api/explore/outbreaks
// @access  Private/Admin
const createOutbreak = async (req, res) => {
    try {
        const { region, disease, severity, cases, trendPercent, mapX, mapY } = req.body;
        if (!region || !disease || !severity) {
            return res.status(400).json({ success: false, message: "Please fill in all required fields (region, disease, severity)" });
        }
        const outbreak = await outbreak_spot_model_1.default.create({
            region,
            disease,
            severity,
            cases: Number(cases) || 0,
            trendPercent: Number(trendPercent) || 0,
            mapX: mapX !== undefined ? Number(mapX) : Math.random() * 0.6 + 0.2, // standard random placement coordinates fallback
            mapY: mapY !== undefined ? Number(mapY) : Math.random() * 0.6 + 0.2,
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to create outbreak spot", error });
    }
};
exports.createOutbreak = createOutbreak;
// FIXED: @desc    Delete an outbreak spot (Admin only)
// @route   DELETE /api/explore/outbreaks/:id
// @access  Private/Admin
const deleteOutbreak = async (req, res) => {
    try {
        const outbreak = await outbreak_spot_model_1.default.findById(req.params.id);
        if (!outbreak) {
            return res.status(404).json({ success: false, message: "Outbreak spot not found" });
        }
        await outbreak_spot_model_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: "Outbreak spot deleted successfully"
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete outbreak spot", error });
    }
};
exports.deleteOutbreak = deleteOutbreak;
// FIXED: @desc    Update an outbreak spot (Admin only)
// @route   PUT /api/explore/outbreaks/:id
// @access  Private/Admin
const updateOutbreak = async (req, res) => {
    try {
        const { region, disease, severity, cases, trendPercent, mapX, mapY } = req.body;
        const outbreak = await outbreak_spot_model_1.default.findById(req.params.id);
        if (!outbreak) {
            return res.status(404).json({ success: false, message: "Outbreak spot not found" });
        }
        if (region !== undefined)
            outbreak.region = region;
        if (disease !== undefined)
            outbreak.disease = disease;
        if (severity !== undefined) {
            if (!['high', 'medium', 'low'].includes(severity)) {
                return res.status(400).json({ success: false, message: "Invalid severity specified (high, medium, low)" });
            }
            outbreak.severity = severity;
            outbreak.colorHex = severity === "high" ? "#FF4D4D" : severity === "medium" ? "#FFA502" : "#2ED573";
        }
        if (cases !== undefined)
            outbreak.cases = Number(cases);
        if (trendPercent !== undefined)
            outbreak.trendPercent = Number(trendPercent);
        if (mapX !== undefined)
            outbreak.mapX = Number(mapX);
        if (mapY !== undefined)
            outbreak.mapY = Number(mapY);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to update outbreak spot", error });
    }
};
exports.updateOutbreak = updateOutbreak;
