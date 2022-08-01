'use strict';

/* Version 2.1.0 */

const leap_year = (year) => ((!(year % 4) && !!(year % 100)) || !(year % 400)) ? 366 : 365;
module.exports = (milliseconds) => {
	if (typeof milliseconds !== 'number') {
		throw new TypeError('Expected a number');
	}
	
	//const { Duration } = require('.');
	//const ms_date = new Duration(`${milliseconds}ms`).fromNow// - Date.now();
	
	//const ms_year = ms_date.getFullYear();
	//const days_in_month = new Date(ms_year, ms_date.getMonth()+1, 0).getDate();
	//const weeks_in_month = days_in_month / 7;
	//const days_in_year = leap_year(ms_year);
	const roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil;
	return {
		years: roundTowardsZero(milliseconds / (1000 * 60 * 60 * 24 * 7 * 4 * 12)), // 365.25)),
		months: roundTowardsZero(milliseconds / (1000 * 60 * 60 * 24 * 7 * 4)) % 12, // (365 / 12))) % 12, // (365.25 / 12))) % 12,
		weeks: roundTowardsZero(milliseconds / (1000 * 60 * 60 * 24 * 7)) % 4, // Math.ceil(weeks_in_month),
		days: roundTowardsZero(milliseconds / (1000 * 60 * 60 * 24)) % 7,
		hours: roundTowardsZero(milliseconds / (1000 * 60 * 60)) % 24,
		minutes: roundTowardsZero(milliseconds / (1000 * 60)) % 60,
		seconds: roundTowardsZero(milliseconds / 1000) % 60,
		milliseconds: roundTowardsZero(milliseconds) % 1000,
		microseconds: roundTowardsZero(milliseconds * 1000) % 1000,
		nanoseconds: roundTowardsZero(milliseconds * 1e6) % 1000
	};
};
