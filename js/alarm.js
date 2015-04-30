var alarmName = 'remindme';

function checkAlarm(callback) {
    chrome.alarms.getAll(function(alarms) {
        var hasAlarm = alarms.some(function(a) {
            return a.name == alarmName;
        });
        if (callback) { callback(hasAlarm) }
    })
}

function createAlarm() {
    localStorage['weeklyAlarmReminder'] = false;
    chrome.browserAction.setBadgeText({
        text: ''
    });
    chrome.alarms.create(alarmName, {
        delayInMinutes: 10080 //0.4
    //delayInMinutes: 10080, periodInMinutes: 1440}); // in one week, with reminders everyday after.
    });

}

function cancelAlarm() {
    chrome.alarms.clear(alarmName);
}

function doToggleAlarm() {
    checkAlarm(function(hasAlarm) {
        cancelAlarm();
        createAlarm();
        checkAlarm();
    });
}
checkAlarm();