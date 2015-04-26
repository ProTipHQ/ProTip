// ------------------
// BLACKLISTED URLS CRUD
// ------------------
function buildBlacklistSelector() {
    var select = document.getElementById("remove-from-blacklist");

    db.values('blacklist').then(function(records) {
        select.options.length = 0;
        for (var i in records) {
            var option = document.createElement("option");
            option.text = records[i].url;
            option.value = records[i].url;
            select.appendChild(option);
        }
    });
}

function addToBlacklist() {
    var element = document.getElementById('add-to-blacklist');
    var url = element.value;

    url = new URL(url);
    db.put('blacklist', {
        url: url.href
    }).then(function() {
        element.value = '';
        buildBlacklistSelector();
    });
}

function removeFromBlacklist() {
    var select = document.getElementById("remove-from-blacklist");

    for (var i = 0; i < select.children.length; i++) {
        var child = select.children[i];
        if (child.selected == true) {
            db.remove('blacklist', child.value);
            select.removeChild(child); // remove from UI
        }
    }
}


// ------------------
// HOSTNAME CRUD
// ------------------
function buildBlacklistedHostnameSelector() {
    var select = document.getElementById("remove-from-blacklisted-hostname");

    db.values('blacklistedhostnames').then(function(records) {
        select.options.length = 0;
        for (var i in records) {
            var option = document.createElement("option");
            option.text = records[i].hostname;
            option.value = records[i].hostname;
            select.appendChild(option);
        }
    });
}

function addToBlacklistedHostname() {
    var input = document.getElementById("add-blacklisted-hostnames");

    try {
        var hostname = new URL(input.value).hostname;
    } catch (e) {
        var hostname = input.value;
    }
    if (hostname) { //not empty string
        db.put('blacklistedhostnames', {
            hostname: hostname
        }).then(function() {
            input.value = '';
            buildBlacklistedHostnameSelector();
        });
    }
}

function removeFromBlacklistedHostname() {
    var select = document.getElementById("remove-from-blacklisted-hostname");

    for (var i = 0; i < select.children.length; i++) {
        var child = select.children[i];
        if (child.selected == true) {
            db.remove('blacklistedhostnames', child.value);
            select.removeChild(child); // remove from UI
        }
    }
}


// ------------------
// BTC ADDRESSS CRUD
// ------------------
function buildBlacklistedBitcoinAddressSelector() {
    var select = document.getElementById("remove-from-blacklisted-bitcoin-addresses");
    db.values('blacklistbitcoinaddresses').then(function(records) {
        select.options.length = 0;
        for (var i in records) {
            var option = document.createElement("option");
            option.text = records[i].bitcoinAddress;
            option.value = records[i].bitcoinAddress;
            select.appendChild(option);
        }
    });
}

function addToBlacklistedBitcoinAddress() {
    var input = document.getElementById("add-blacklisted-bitcoin-address");

    db.put('blacklistbitcoinaddresses', {
        bitcoinAddress: input.value
    }).then(function() {
        input.value = '';
        buildBlacklistedBitcoinAddressSelector();
    });
}

function removeFromBlacklistedBitcoinAddress() {
    var select = document.getElementById("remove-from-blacklisted-bitcoin-addresses");

    for (var i = 0; i < select.children.length; i++) {
        var child = select.children[i];
        if (child.selected == true) {
            db.remove('blacklistbitcoinaddresses', child.value);
            select.removeChild(child); // remove from UI
        }
    }
}

function initialize() {

    db = new ydn.db.Storage('protip', schema);

    // ---------------------
    // Blacklisted URLs
    // ---------------------
    buildBlacklistSelector();
    document.getElementById('remove-selected-btn')
        .addEventListener("click", function() {
            removeFromBlacklist()
        });
    document.getElementById('add-selected-btn')
        .addEventListener("click", function() {
            addToBlacklist()
        });

    // ---------------------
    // Blacklisted Hostnames
    // ---------------------
    buildBlacklistedHostnameSelector();
    document.getElementById('remove-selected-blacklisted-hostnames-btn')
        .addEventListener("click", function() {
            removeFromBlacklistedHostname();
        });
    document.getElementById('add-selected-blacklisted-hostnames-btn')
        .addEventListener("click", function() {
            addToBlacklistedHostname();
        });

    // ------------------------------
    // Blacklisted Bitcoin Addresses
    // ------------------------------
    buildBlacklistedBitcoinAddressSelector();
    document.getElementById('remove-selected-blacklisted-bitcoin-addresses-btn')
        .addEventListener("click", function() {
            removeFromBlacklistedBitcoinAddress();
        });
    document.getElementById('add-blacklisted-bitcoin-address-btn')
        .addEventListener("click", function() {
            addToBlacklistedBitcoinAddress();
        });

    allowExternalLinks();

}


document.addEventListener("DOMContentLoaded", function() {
    initialize();
});