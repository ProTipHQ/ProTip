/* redirect.js
 * ProTip 2015-2018
 * License: GPL v3.0
 * On the first load when using a version held on Chrome Store it fails to load
 * Jquery, on the second load everything is fine. So the 'full screen' link
 * points here, then redirects to home, hacking around the failure.
 */
window.location.replace("home.html");
