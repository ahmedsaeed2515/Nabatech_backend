"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async findById(id) {
        return this.model.findById(id).exec();
    }
    async findOne(filter) {
        return this.model.findOne(filter).exec();
    }
    async find(filter = {}) {
        return this.model.find(filter).exec();
    }
    async create(data) {
        const created = new this.model(data);
        return created.save();
    }
    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    }
    async softDelete(id) {
        return this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).exec();
    }
    async hardDelete(id) {
        return this.model.findByIdAndDelete(id).exec();
    }
}
exports.BaseRepository = BaseRepository;
