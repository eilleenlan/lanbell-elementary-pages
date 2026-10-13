// Only confirmed periods receive official week numbers. Update this configuration after verification.
export const semesterPeriods = {
  115: [
    { start: '2026-07-01', end: '2026-08-30', label: '暑假' },
    { start: '2026-08-31', end: '2027-01-20', anchor: '2026-08-31', confirmed: true },
    { start: '2027-01-21', end: '2027-02-10', label: '寒假' },
    { start: '2027-02-11', end: null, anchor: '2027-02-11', confirmed: false }
  ]
};
const dayNumber = value => Date.parse(value + 'T00:00:00Z') / 86400000;
const dateString = number => new Date(number * 86400000).toISOString().slice(0, 10);
const sunday = number => number - new Date(number * 86400000).getUTCDay();
export function taipeiToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return value('year') + '-' + value('month') + '-' + value('day');
}
export function weekSegments(start, academicYear, periods = semesterPeriods) {
  const segments = [];
  for (let offset = 0; offset < 7; offset++) {
    const number = dayNumber(start) + offset, date = dateString(number);
    const period = (periods[academicYear] || []).find(p => p.start <= date && (p.end === null || p.end >= date));
    const label = period?.label || (period?.confirmed && period.anchor
      ? '第 ' + (Math.floor((sunday(number) - sunday(dayNumber(period.anchor))) / 7) + 1) + ' 週'
      : '週次待核對');
    const previous = segments.at(-1);
    if (previous?.label === label) previous.end = date;
    else segments.push({ label, start: date, end: date });
  }
  return segments;
}
