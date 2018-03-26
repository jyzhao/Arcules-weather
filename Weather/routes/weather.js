var express = require('express');
var router = express.Router();
var DarkSky = require('dark-sky');
var moment = require('moment');

// store secret key in config file, another way is to store it in ENV variable
var config = require('../config');
var darksky = new DarkSky(config.key);

// CORS access
router.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/* using coordinates */
router.get('/:coordinates', function (req, res, next) {
  // check if valid input
  var coordinatePattern = /^(\-?\d+(\.\d+)?),(\-?\d+(\.\d+)?)$/;

  if (!coordinatePattern.test(req.params.coordinates)) {
    res.status(200).send("Invalid input!!!");
    res.end();
    return;
  }

  var latitude = req.params.coordinates.split(",")[0];
  var longitude = req.params.coordinates.split(",")[1];

  //last week weather info
  var weather = [];
  // promise array
  var promise = [];

  for (var i = 0; i < 7; i++) {
    promise.push(
      darksky
        .options({
          latitude : latitude,
          longitude: longitude,
          // loop thru last week from Sun to Mon
          time     : moment().subtract(1, 'weeks').startOf('week').add(i, 'days'),
          exclude  : ['currently', 'minutely', 'hourly']
        })
        .get()
        .then(function (data) {
          // convert all unix timestamps to human readable time format
          data.daily.data[0].time = moment.unix(data.daily.data[0].time);
          data.daily.data[0].sunriseTime = moment.unix(data.daily.data[0].sunriseTime);
          data.daily.data[0].sunsetTime = moment.unix(data.daily.data[0].sunsetTime);
          data.daily.data[0].precipIntensityMaxTime = moment.unix(data.daily.data[0].precipIntensityMaxTime);
          data.daily.data[0].temperatureHighTime = moment.unix(data.daily.data[0].temperatureHighTime);
          data.daily.data[0].temperatureLowTime = moment.unix(data.daily.data[0].temperatureLowTime);
          data.daily.data[0].apparentTemperatureHighTime = moment.unix(data.daily.data[0].apparentTemperatureHighTime);
          data.daily.data[0].apparentTemperatureLowTime = moment.unix(data.daily.data[0].apparentTemperatureLowTime);
          data.daily.data[0].windGustTime = moment.unix(data.daily.data[0].windGustTime);
          data.daily.data[0].uvIndexTime = moment.unix(data.daily.data[0].uvIndexTime);
          data.daily.data[0].temperatureMinTime = moment.unix(data.daily.data[0].temperatureMinTime);
          data.daily.data[0].temperatureMaxTime = moment.unix(data.daily.data[0].temperatureMaxTime);
          data.daily.data[0].apparentTemperatureMinTime = moment.unix(data.daily.data[0].apparentTemperatureMinTime);
          data.daily.data[0].apparentTemperatureMaxTime = moment.unix(data.daily.data[0].apparentTemperatureMaxTime);
          weather.push(data.daily.data[0]);
        })
        .catch(function (error) {
          console.log(error);
        })
    )
  }

  Promise.all(promise)
    .then(function () {
      weather.sort(compare);
      res.status(200).send(weather);
      res.end();
    })
    .catch(function (error) {
      console.log(error);
      res.end();
    });

});

// sort the weather array by dates
function compare(a, b) {
  if (a.time < b.time)
    return -1;
  if (a.time > b.time)
    return 1;
  return 0;
}

module.exports = router;
