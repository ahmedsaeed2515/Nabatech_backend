"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRecurrence = exports.validateIsoDate = exports.validateTimeZone = void 0;
var validateTimeZone = function (tz) {
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
var validateIsoDate = function (dateString) {
    if (!dateString)
        return true; // Optional field
    var date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString() === dateString;
};
exports.validateIsoDate = validateIsoDate;
var validateRecurrence = function (recurrence) {
    if (!recurrence)
        return true; // Optional field
    var validEnums = ['daily', 'weekly', 'biweekly', 'monthly'];
    return validEnums.includes(recurrence);
};
exports.validateRecurrence = validateRecurrence;
