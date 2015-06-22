// var alarmName = 'remindme';
//
// function checkAlarm(callback) {
//     chrome.alarms.getAll(function(alarms) {
//         var hasAlarm = alarms.some(function(a) {
//             return a.name == alarmName;
//         });
//         if (callback) { callback(hasAlarm) }
//     })
// }
//
// function createAlarm() {
//     localStorage['weeklyAlarmReminder'] = false;
//     chrome.browserAction.setBadgeText({
//         text: ''
//     });
//     chrome.alarms.create(alarmName, {
//         delayInMinutes: 1
//         //delayInMinutes: 10080 //0.4
//     //delayInMinutes: 10080, periodInMinutes: 1440}); // in one week, with reminders everyday after.
//     });
//
// }
//
// function cancelAlarm() {
//     chrome.alarms.clear(alarmName);
// }
//
// function doToggleAlarm() {
//     checkAlarm(function(hasAlarm) {
//         cancelAlarm();
//         createAlarm();
//         checkAlarm();
//     });
// }
// checkAlarm();

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
                delayInMinutes: 1 //10080 //0.4
                //delayInMinutes: 10080, periodInMinutes: 1440}); // in one week, with reminders everyday after.
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