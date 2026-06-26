export const validateTimeZone = (tz?: string): boolean => {
  if (!tz) return true; // Optional field
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (error) {
    return false;
  }
};

export const validateIsoDate = (dateString?: string): boolean => {
  if (!dateString) return true; // Optional field
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
};

export const validateRecurrence = (recurrence?: string): boolean => {
  if (!recurrence) return true; // Optional field
  const validEnums = ['daily', 'weekly', 'biweekly', 'monthly'];
  return validEnums.includes(recurrence);
};


