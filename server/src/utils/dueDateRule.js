// Business rule: a loan started on the 5th-25th of a month is automatically
// due on the 5th of the following month. A loan started on the 26th-4th
// (i.e. near month-end/start) has no clean "one month later" date, so the
// due date must be entered manually instead.

const AUTO_WINDOW_START_DAY = 5;
const AUTO_WINDOW_END_DAY = 25;

function isAutoWindow(startDate) {
  const day = startDate.getDate();
  return day >= AUTO_WINDOW_START_DAY && day <= AUTO_WINDOW_END_DAY;
}

function autoDueDate(startDate) {
  return new Date(startDate.getFullYear(), startDate.getMonth() + 1, AUTO_WINDOW_START_DAY);
}

module.exports = { isAutoWindow, autoDueDate, AUTO_WINDOW_START_DAY, AUTO_WINDOW_END_DAY };
