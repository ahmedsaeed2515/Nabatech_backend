"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const app_error_1 = require("../utils/app_error");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error && (error.name === 'ZodError' || Array.isArray(error.errors) || Array.isArray(error.issues))) {
                const issues = error.issues || error.errors;
                const message = issues.map((e) => `${e.path?.join('.')} ${e.message}`).join(', ');
                next(new app_error_1.AppError({
                    message,
                    statusCode: 400,
                    code: 'VALIDATION_FAILED',
                    details: issues
                }));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateRequest = validateRequest;
