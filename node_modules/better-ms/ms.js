/* Version 2.1.2 */

/**
 * Helpers.
 */
const leap_year = (year) => ((!(year % 4) && !!(year % 100)) || !(year % 400)) ? 366 : 365;
const now = new Date();
const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
//const mth = d * 30.4167;
const days_in_month = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(); // was + 1
const weeks_in_month = days_in_month / 7;
const mth = w * weeks_in_month;
const y = mth * 12; //.25 // d * 365
/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */
module.exports = function(val, options) {
	options = options || {};
	var type = typeof val;
	if (type === 'string' && val.length > 0) {
		return parse(val);
	} else if (type === 'number' && isFinite(val)) {
		return options.long ? fmtLong(val) : fmtShort(val);
	}
	throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
};
/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */
function parse(str) {
	str = String(str);
	if (str.length > 100) {
		return;
	}
	const regex = /(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|mths?|years?|yrs?|[smhdwy])?/gi; // /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mth|years?|yrs?|y)?$/i.exec(str);
	const match = str.match(regex);
	if (!match) {
		return;
	}
  	const parse_arrays = match.map((q, n, p) => regex.exec(p)).map((array) => array.splice(1))//.map((v, x, y) => y[x][0] = v);
	let n = 0;
	parse_arrays.forEach((value) => {
		const type = (value[1] || 'ms').toLowerCase();
		if (['years', 'year', 'yrs', 'yr', 'y'].includes(type)) n += value[0] * y;
		if (['months', 'month', 'mths', 'mth'].includes(type)) n += value[0] * mth;
		if (['weeks', 'week', 'w'].includes(type)) n += value[0] * w;
		if (['days', 'day', 'd'].includes(type)) n += value[0] * d;
		if (['hours', 'hour', 'hrs', 'hr', 'h'].includes(type)) n += value[0] * h;
		if (['minutes', 'minute', 'mins', 'min', 'm'].includes(type)) n += value[0] * m;
		if (['seconds', 'second', 'secs', 'sec', 's'].includes(type)) n += value[0] * s;
		if (['milliseconds', 'millisecond', 'msecs', 'msec', 'ms'].includes(type)) n += value[0];
	});
	return n;
}
/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */
function fmtShort(ms) {
	const msAbs = Math.abs(ms);
	if (msAbs >= y) {
		return Math.round(ms / y) + 'y';
	}
	if (msAbs >= mth) {
		return Math.round(ms / mth) + 'mth';
	}
	if (msAbs >= w) {
		return Math.round(ms / w) + 'w';
	}
	if (msAbs >= d) {
		return Math.round(ms / d) + 'd';
	}
	if (msAbs >= h) {
		return Math.round(ms / h) + 'h';
	}
	if (msAbs >= m) {
		return Math.round(ms / m) + 'm';
	}
	if (msAbs >= s) {
		return Math.round(ms / s) + 's';
	}
	return ms + 'ms';
}
/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */
function fmtLong(ms) {
	const msAbs = Math.abs(ms);
	if (msAbs >= y) {
		return plural(ms, msAbs, y, 'year');
	}
	if (msAbs >= mth) {
		return plural(ms, msAbs, mth, 'month');
	}
	if (msAbs >= w) {
		return plural(ms, msAbs, w, 'week');
	}
	if (msAbs >= d) {
		return plural(ms, msAbs, d, 'day');
	}
	if (msAbs >= h) {
		return plural(ms, msAbs, h, 'hour');
	}
	if (msAbs >= m) {
		return plural(ms, msAbs, m, 'minute');
	}
	if (msAbs >= s) {
		return plural(ms, msAbs, s, 'second');
	}
	return ms + ' ms';
}
/**
 * Pluralization helper.
 */
function plural(ms, msAbs, n, name) {
	const isPlural = msAbs >= n * 1.5;
	return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}
