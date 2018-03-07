/* reminder-countdown.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

var reminderCountdown = {
    daysTillEndOfWeek: function(endOfWeek) {
        var now = (new Date).getTime();
        var milliseconds = endOfWeek - now;
        return this.millisecondsToDays(milliseconds)
    },
    millisecondsToDays: function(milliseconds) {
        var seconds = Math.floor(milliseconds / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        return days;
    },
    restartTheWeek: function() {
        var now = (new Date).getTime();
        var milliSecondsInWeek = 604800000;
        var extraHour = 3600000;
        var alarm = now + milliSecondsInWeek + extraHour;
        var endOfWeek = new Date(alarm);
        var daysRemaining = this.daysTillEndOfWeek(endOfWeek);

        localStorage['endOfWeek'] = alarm;

        return { endOfWeek: endOfWeek, daysRemaining: daysRemaining }
    }
}

module.exports = reminderCountdown
