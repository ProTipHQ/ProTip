/* utils-bitcoin.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

var utilsBitcoin = {
    validAddress: function(address) {
      try {
          new bitcoin.address.fromBase58Check(address.trim());
      } catch (e) {
          return false;
      }
      return true;
    }
}

module.exports = utilsBitcoin
