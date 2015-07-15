(function(window) {
    var alarmManager = function() {};

    var alarmName = 'remindme';

    alarmManager.prototype = {

        checkAlarm: function (callback) {
            chrome.alarms.getAll(function(alarms) {
                var hasAlarm = alarms.some(function(a) {
                    return a.name == alarmName;
                });
                if (callback) { callback(hasAlarm) }
            })
        },

        createAlarm: function () {
            localStorage['weeklyAlarmReminder'] = false;
            chrome.browserAction.setBadgeText({
                text: ''
            });
            chrome.alarms.create(alarmName, {
                delayInMinutes: 10080, periodInMinutes: 720 // in one week, with retrys every 12 hours.
            });
        },

        cancelAlarm: function () {
            chrome.alarms.clear(alarmName);
        },

        doToggleAlarm: function () {
             this.cancelAlarm();
             this.createAlarm();
             this.checkAlarm();
        }
    }

    var ret = new alarmManager();
    window.alarmManager = ret;

})(window);