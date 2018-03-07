/* ProTip - compiled libraries and application logic for browser extension
 * Copyright (c) 2015 - 2018
 * License: GPL v3.0
 *
 * Authors:
 *  - Brennan Novak
 *  - Leo Campbell
 */

global.$ = require('jquery')
global.$.validate = require('jquery-validation')
global.dateFormat = require('dateformat')
global.Promise = require('promise')
global._ = require('lodash')
global.CryptoJS = require('cryptojslib')
global.BigInteger = require('bigi')
global.bitcoin = require('bitcoinjs-lib')
global.QRCode = require('qrcode-generator')

// Wallet
var preferences = require('./wallet/preferences')
global.preferences = preferences

global.util = require('./wallet/util')
var currencyManagerClass = require('./wallet/currency-manager')
global.currencyManager = new currencyManagerClass(preferences);
global.currencyManager.updateExchangeRate();
global.wallet = require('./wallet/wallet')

// Various
var weeklyBrowsingWidget = require('./various/weekly-browsing-widget')
Object.assign(window, weeklyBrowsingWidget)

var weeklyBudgetWidget = require('./various/weekly-budget-widget')
Object.assign(window, weeklyBudgetWidget)

var paymentManagerClass = require('./various/payment-manager')
global.paymentManager = new paymentManagerClass()

var reminderCountdown = require('./various/reminder-countdown')
Object.assign(window, reminderCountdown)

var alarmManagerClass = require('./various/alarm-manager')
global.alarmManager = new alarmManagerClass()

var utilsBitcoin = require('./various/utils-bitcoin')
Object.assign(window, utilsBitcoin)

var utilsUi = require('./various/utils-ui')
Object.assign(window, utilsUi)

// Taken from error-log.js
var errorLog = function() {
    // proxy pattern to override console.error and output to localStorage.
    var proxied = console.error;
    if (!localStorage['errorLog']) {
        localStorage.setItem("errorLog", JSON.stringify([]))
    }
    console.error = function() {
        var concatedArguments = ''
        for (let i=0; i< arguments.length; i++) {
          concatedArguments += arguments[i].toString() + ', '
        }
        var existingErrors = JSON.parse(localStorage.getItem("errorLog"))
        existingErrors.push(concatedArguments + ' [' + (new Date()) + '] ')
        localStorage.setItem("errorLog", JSON.stringify(existingErrors))
        return proxied.apply( this, arguments )
    }
}

errorLog()
