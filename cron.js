(function() {
  var CronJob = require('cron').CronJob;
  // var cronJob = cron.job('00 00 00 * * *', function() {
  var job = new CronJob({
    cronTime: '00 00 00 * * *',
    onTick: function() {
      var dayBeforeYesterday = new Date();
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
      var yyyymmddDayBeforeYesterday = dayBeforeYesterday.toISOString().slice(0,10).replace(/-/g,"");
 
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yyyymmddYesterday = yesterday.toISOString().slice(0,10).replace(/-/g,"");

      var exec = require('child_process').exec;
      var cmd = 'node server.js ' + '"' + yyyymmddDayBeforeYesterday + '"' + ' "' + yyyymmddYesterday + '"';
      exec(cmd, function(error, stdout, stderr) {
        console.log('executing:', cmd);
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
      });
    },
    runOnInit: true
  });

  job.start();
}());

