
# better-ms

# Usage
Use this package to easily convert various time formats to milliseconds and milliseconds to time formats.

## Examples
```js
Duration.getMilliseconds('2 days')  // 172800000
Duration.getMilliseconds('1d')      // 86400000
Duration.getMilliseconds('10h')     // 36000000
Duration.getMilliseconds('2.5 hrs') // 9000000
Duration.getMilliseconds('2h')      // 7200000
Duration.getMilliseconds('1m')      // 60000
Duration.getMilliseconds('5s')      // 5000
Duration.getMilliseconds('1y')      // 31557600000
Duration.getMilliseconds('2d4m10s') // 173050000
```

### Convert from Milliseconds
```js
Duration.humanize(60000)       // "1m"
Duration.humanize(2 * 60000)   // "2m"
Duration.humanize(-3 * 60000)  // "-3m"
Duration.humanize('10 hours')  // "10h"
```

### Time Format Written-Out
```js
Duration.humanize(60000, { long: true })             // "1 minute"
Duration.humanize(2 * 60000, { long: true })         // "2 minutes"
Duration.humanize(-3 * 60000, { long: true })        // "-3 minutes"
Duration.humanize(Duration.getMilliseconds('10 hours'), { long: true })  // "10 hours"
Duration.humanize(Duration.getMilliseconds('5d3s'), { verbose: true })  // "5 days 3 seconds"
```

### Future dates
```js
const { Duration } = require('better-ms');
new Duration('3h5m'); // Duration { offset: 11100000 }
new Duration('3h5m').fromNow; // 2019-11-19T21:46:24.012Z (will vary depending on the current date)
(new Duration('3h5m').fromNow / 1) - Date.now(); // 11100000 (make sure to divide by 1 for an accurate output)
```

### Durations
```js
const { humanize, Duration } = require('better-ms');
const future_date = new Duration('3h5m').fromNow; // 2019-11-19T21:46:24.012Z (will vary depending on the current date)
humanize((future_date / 1) - Date.now()); // 3h5m
```

## Features
- Works both in [Node.js](https://nodejs.org) and in the browser
- Unlike `ms` this package can parse multiple values `4d4m5s`

## Information
This package was created from `ms` and `pretty-ms`, it just includes modified scripts and is combined into a single class.

## Changelog
#### 1.1.0
- Added support for months and weeks.
