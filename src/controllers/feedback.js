/* feedback.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

$(document).ready(function() {
    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    allowExternalLinks();
});
