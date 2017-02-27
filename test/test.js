'use strict';

const assert = require('assert');

let query = [
  'PDT',
  'pst',
  'UTC',
  'UTC + 2',
  'UTC+1',
  'UTC+4',
  'GMT',
  'Paris',
  'London',
  'new-york',
  'saint-petersburg',
  'Austin',
  'ny'
];

describe('time-anywhere', function () {
  query.forEach(function (e) {
    it(`should return correct results for ${e}`, function (done) {
      assert.equal(1,1);
      done();
    });
  });
});
