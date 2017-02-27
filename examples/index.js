const now = require('../index.js');

const timezone = 'PST';
const city = 'Palo Alto';

now(timezone).then((time) => {
  console.log(time);
});

now(city).then((time) => {
  console.log(time);
});
