"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
var options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Express API with Swagger',
            version: '1.0.0',
            description: 'A simple Express API application documented with Swagger',
        },
        servers: [
            {
                url: 'http://localhost:10000',
            },
        ],
    },
    apis: ['./src/routers/*.ts'],
};
var swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
