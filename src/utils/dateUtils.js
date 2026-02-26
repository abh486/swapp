// src/screens/utils/dateUtils.js
export const formatLocalTime = (dateValue, label = "Timestamp") => {
  if (!dateValue) {
    console.log(`[formatLocalTime] ${label}: Input is null or undefined.`);
    return 'N/A';
  }
  
  try {
    let date;
    if (typeof dateValue === 'string') {
      if (dateValue.includes('T') && dateValue.includes('Z')) {
        date = new Date(dateValue);
      } else {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      console.error(`[formatLocalTime] ${label}: Invalid date object:`, dateValue);
      return 'Invalid Date';
    }
    
    const formattedString = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
    
    console.log(`[formatLocalTime] ${label}: Input="${dateValue}", Output="${formattedString}"`);
    return formattedString;
  } catch (e) {
    console.error(`[formatLocalTime] ${label}: Error formatting date "${dateValue}":`, e);
    return 'Invalid Date';
  }
};