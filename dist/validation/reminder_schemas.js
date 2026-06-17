"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRecurrence = exports.validateIsoDate = exports.validateTimeZone = void 0;
const validateTimeZone = (tz) => {
    if (!tz)
        return true; // Optional field
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.validateTimeZone = validateTimeZone;
const validateIsoDate = (dateString) => {
    if (!dateString)
        return true; // Optional field
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString() === dateString;
};
exports.validateIsoDate = validateIsoDate;
const validateRecurrence = (recurrence) => {
    if (!recurrence)
        return true; // Optional field
    const validEnums = ['daily', 'weekly', 'biweekly', 'monthly'];
    return validEnums.includes(recurrence);
};
exports.validateRecurrence = validateRecurrence;
