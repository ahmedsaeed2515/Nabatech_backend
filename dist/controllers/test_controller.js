"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getById = exports.echoBodey = exports.hello = void 0;
const hello = (req, res) => {
    res.status(200).json({ success: true, data: { message: "Hello World" } });
};
exports.hello = hello;
const echoBodey = (req, res) => {
    res.status(200).json({ success: true, data: { youSent: req.body } });
};
exports.echoBodey = echoBodey;
const getById = (req, res) => {
    const id = req.params.id;
    res.status(200).json({ success: true, data: { youSent: id, message: "This is a get request with id" } });
};
exports.getById = getById;
