(function(window) {

    var alarmManager = function() {};
    var alarmName = 'remindme';

    alarmManager.prototype = {
        alarmExpired: function (alarmExpireDate, callback) {
            browser.alarms.getAll().then(function(alarms) {
                var alarmExpires = new Date(alarmExpireDate);
                var now = (new Date).getTime();

                if(alarms.length > 0 && (alarmExpires > now)){
                    localStorage['weeklyAlarmReminder'] = false;
                    callback(false)
                } else {
                    // if alarms is for some reason empty [].length, conclude that it has expired.
                    localStorage['weeklyAlarmReminder'] = true;
                    callback(true)
                }
            });
        },
        setAlarm: function(delayInMinutes) {
            // is for testing only.
            this.cancelAlarm();
            // Globals must be set, some the issues with this method 'not working' is
            // because people had ProTip set to manual Remind when testing automatic
            // donate.
            localStorage['automaticDonate'] = true;
            localStorage['manualRemind'] = false;

            var delayInMilliseconds = delayInMinutes * 60 * 1000; // convert to milliseconds
            var now = (new Date).getTime();
            // the attribute periodInMinutes means that an expired alarm is replaced with a new alarm with
            // scheduledTime = expired_scheduledTime + periodInMinutes;
            // It is not possible to workout if the expired alarm ever existed. Therefore
            // not possible to determine if the inital alarm has expired and we need to display
            // the manual reminders.
            // There we are storing the initial expiry date.
            localStorage['alarmExpireDate'] = new Date(now + delayInMilliseconds);

            browser.alarms.create(alarmName, {
                delayInMinutes: delayInMinutes, periodInMinutes: null
            });
            browser.alarms.getAll().then(function(objs){
                var date = new Date(objs[0].scheduledTime);
                console.log(
                    'New alarm created for ' + date.format()
                );
            });
        },
        listAlarms: function() {
            browser.alarms.getAll().then(function(objs){
                for(var i=0;i<objs.length;i++){
                    var date = new Date(objs[i].scheduledTime);
                    console.log(
                        'Alarm for: ' + date.format()
                    );
                }
            });
        },
        getAlarmDate: function() {
            browser.alarms.getAll().then(function(objs){
                var date = new Date(objs[0].scheduledTime);
                console.log(
                    date.format()
                );
            });
        },
        createAlarm: function () {
            localStorage['weeklyAlarmReminder'] = false;
            var delayInMinutes = 10080
            var delayMilliseconds = delayInMinutes * 60 * 1000;
            var now = (new Date).getTime();
            // the attribute periodInMinutes means that an expired alarm is replaced with a new alarm with
            // scheduledTime = expired_scheduledTime + periodInMinutes;
            // It is not possible to workout if the expired alarm ever existed. Therefore
            // not possible to determine if the inital alarm has expired and we need to display
            // the manual reminders.
            // There we are storing the initial expiry date.
            localStorage['alarmExpireDate'] = new Date(now + delayMilliseconds);

            browser.browserAction.setBadgeText({
                text: ''
            });
            browser.alarms.create(alarmName, {
                delayInMinutes: delayInMinutes, periodInMinutes: 60 // in one week, with retrys every 1 hour.
            });
        },
        cancelAlarm: function () {
            browser.alarms.clear(alarmName);
        },
        doToggleAlarm: function () {
             this.cancelAlarm();
             this.createAlarm();
             //this.checkAlarm();
        }
    }

    var ret = new alarmManager();
    window.alarmManager = ret;

})(window);
