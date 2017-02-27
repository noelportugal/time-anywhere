const moment = require('moment-timezone');
const tz = require('timezones.json');
const request = require('request');


/**
 * geocode
 * @param {String} q - query
 */
const findLocation = q => new Promise((res, rej) => {
  request.get({
    url: `http://maps.googleapis.com/maps/api/geocode/json?address=${q}&sensor=false`,
    json: true,
  }, (err, r, loc) => {
    if (err || (!loc.results || !loc.results.length)) rej();
    res(loc.results);
  });
});

/**
 * timezone
 * @param {String} q - query
 */
const findTimezone = l => new Promise((res, rej) => {
  request.get({
    url: `https://maps.googleapis.com/maps/api/timezone/json?location=${l.geometry.location.lat},${l.geometry.location.lng}&timestamp=1331161200&sensor=false`,
    json: true,
  }, (err, r, tz) => {
    if (err || !tz.timeZoneId) rej();
    tz.name = l['formatted_address'];
    res(tz);
  });
});


/**
 * Query function
 * @param {Object} q - query object
 */
const query = q => {
  let res = [];

  if (q.timezone) {
    res = res.concat(tz.filter(t => t.abbr.toLowerCase() === q.timezone.toLowerCase()))
    .concat(
      tz.filter(t => t.value.toLowerCase()
          .replace(/\(.*\)/, '')
          .split(' ').map(e => e[0])
          .join('') === q.timezone.toLowerCase())
    );
  }

  if (q.location) {
    res = res.concat(tz.filter(t => {
      if (t.utc)
        return !!t.utc.map(e => e.toLowerCase().replace('_', '').split('/'))
          .filter(e => {
            return ~e.indexOf(q.location.replace(/[_-]/g, ''))
          }).length;

      return false;
    }));

    // in case of la ny etc...
    if (q.location.length === 2) {
      res = res.concat(tz.filter(t => {
        if (t.utc) {
          let _location = t.utc.filter(e => ~e.indexOf('_'));

          if (!_location.length) {
            return false;
          } else {
            return _location.map(l => l.toLowerCase().split('/')[1].split('_'))
              .filter(l => l.length > 1 && l[0][0] === q.location[0] && l[1][0] === q.location[1]).length;
          }
        }
        return false;
      }));
    }
  }

  if (q.id) {
    res = res.concat(tz.filter(t => t.utc? ~t.utc.indexOf(q.id) : false));
  }

  return res;
};


/**
 * default output format
 */
const outputformat = 'h:mm:ss a, MMMM Do YYYY';


/**
 * collect multiple timezones
 * @param {String} q - query
 */
const getMultipleLocations = q => new Promise((res) => {
  const output = {};
  output.multiple = [];
  output.status = 'multiple';

  q.forEach((timezone) => {
    const choice = {};
    choice.time = moment().tz(timezone.utc[0]).format(outputformat);
    choice.timezone = timezone.text;
    output.multiple.push(choice);
  });

  res(output);
});


/**
 * time in different places
 * @param {String} q - query
 */
const now = q => new Promise((res) => {
  const output = {};

  if (!q) {
    output.time = moment().format(outputformat);
    res(output);
  }

  q = q.trim().replace(/[^a-zA-Z]/, '').toLowerCase();

  const t = query({
    timezone: q,
    location: q,
  });

  if (t.length) {
    if (t.length > 1) {
      getMultipleLocations(t).then((result) => {
        res(result);
      });
    }
  } else {
    findLocation(q).then((result) => {
      Promise.all(result.map(findTimezone)).then(r => r.map(e => {
        output.status = 'single';
        output.name = e.name;
        const timezone = query({ id: e.timeZoneId })[0];
        output.time = moment().tz(timezone.utc[0]).format(outputformat);
        output.timezone = timezone.text;
        res(output);
      }))
      .catch(() => {
        output.status = 'nothing found';
        res(output);
      });
    }).catch(() => {
      output.status = 'nothing found';
      res(output);
    });
  }
});

module.exports = now;
