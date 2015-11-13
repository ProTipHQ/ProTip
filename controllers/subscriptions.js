function subscriptionLabelCell(record) {
    var cell = document.createElement("td");

    cell.appendChild(document.createElement('div').appendChild(
        document.createTextNode(record.title)
    ));
    var a = document.createElement('a');
    a.style.display = 'block';
    if (record.url) { // url is optional, for manual subscriptions
        var linkText = document.createTextNode(record.url.replace(/http(s?):\/\/(www.|)/, '').substring(0, 40));
    } else {
        var linkText = document.createTextNode('');
    }
    a.appendChild(linkText);
    a.className = 'external-link';
    a.href = record.url;
    $(a).click(function() {
        // In a chrome popup
        // the links won't work without the below. Needs to be
        // re-ran on every table creation.
        chrome.tabs.create({
            url: $(this).attr('href')
        });
        return false;
    });
    cell.appendChild(a);
    return cell;
}

function subscriptionSwitchCellDefaultOn(record) {
    var cell = document.createElement("td");
    cell.style.textAlign = 'center';

    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true; // This is the subscription table all rows are subscribed.
    input.id = record.bitcoinAddress;

    input.className = 'js-switch'; // Switchery.js
    cell.appendChild(input); // append to cell before init Switchery

    new Switchery(input, {
        size: 'small'
    });
    input.addEventListener("change", (function(record, input) {
        return function() {
            var parentTr = input.parentElement.parentElement;
            if (input.checked != true) {
                db.remove('subscriptions', record.bitcoinAddress);
                parentTr.style.backgroundColor = '#eeeeee';
                parentTr.style.color = '#aaa';
            } else {
                // Allow the unsubscription to be reversed, no need to display confirmation warning
                // EG. "Do you really want to delete this subscription?"
                db.put('subscriptions', record);
                parentTr.style.backgroundColor = 'white';
                parentTr.style.color = '#000';
            }
        }
    })(record, input));

    return cell;
}

function subscriptionEmptyRow(domId){
    var tbody = $('#' + domId);
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    cell.setAttribute("colspan",4);

    var text = document.createTextNode('Your subscriptions will be collected here.');
    cell.appendChild(text);

    row.appendChild(cell);
    return row;
}


function buildRow(record) {
    var row = document.createElement("tr");

    row.appendChild(subscriptionSwitchCellDefaultOn(record));
    row.appendChild(subscriptionLabelCell(record));
    row.appendChild(subscriptionAmountCell(record));
    row.appendChild(subscriptionBitcoinAddressCell(record));

    return row;
}

function buildTable(domId) {
    var tbody = $('#' + domId);
    tbody.empty();

    db.values('subscriptions').done(function(records) {
        if(records.length > 0) {
            for (var i in records) {
                tbody.append(buildRow(records[i]));
            }
        } else {
            tbody.append(subscriptionEmptyRow());
        }
    });
}

function manualSubscription() {
    db.put('subscriptions', {
        amountFiat: $('#manual-amount-fiat').val(),
        bitcoinAddress: $('#manualBitcoinAddress').val(),
        title: $('#manual-label').val(),
        url: $('#manual-url').val()
    }).done(function(){
        $('#manual-amount-fiat').val('');
        $('#manualBitcoinAddress').val('');
        $('#manual-label').val('');
        $('#manual-url').val('');
    });
}

function validAddress(address){
  // Bitcoinjs doesn't do mixed normal and multisig inputs
  // Proposed for version 2.
  // Some patches exist:
  // https://github.com/OutCast3k/bitcoin-multisig/issues/6
  // An explaination is here.
  // https://github.com/bitcoinjs/bitcoinjs-lib/issues/417
  // Multisig addresses are defined as follows:
  // base58(0x05 + [20-byte scripthash] + [4-byte checksum])
  // For testnet, it's 0xC4 instead of 0x05, indeed.
  try {
      new bitcoin.address.fromBase58Check(address);
  } catch (e) {
      return false;
  }
  return true;
}

function proTipSubscription() {
    db.put('subscriptions', {
        amountFiat: $('#protip-amount-fiat').val(),
        bitcoinAddress: $('#protip-bitcoin-address').val(),
        title: $('#protip-label').val(),
        url: $('#protip-url').val()
    });
    $('#protip-subscription-form').slideUp();
}

$(function() {
    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    db = new ydn.db.Storage('protip', schema);

    buildTable('subscription-tbody'); //('subscription-table');



    subscriptionTotalFiatAmount().then(function(totalFiatAmount){
        $('#subscription-total-amount').html(totalFiatAmount);
    });

    $('#manual-amount-fiat').attr('placeholder', localStorage['defaultSubscriptionAmountFiat']);
    $('#protip-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);

    $.validator.addMethod('validBitcoinAddress', function(value, element){return false;},'Invalid bitcoin address'); // A hack.
    $('#manualSubscriptionForm').validate({
        rules: {
            manualBitcoinAddress: {
                validBitcoinAddress: {
                    depends: function(element) {
                        return !validAddress(element.value);
                    }
                }
            },
        },
        submitHandler: function() {
            manualSubscription();
            buildTable('subscription-tbody'); //('subscription-table');
        }
    });

    $.validator.setDefaults({});

    if (typeof localStorage['showProTipSubscription'] === "undefined") {
        localStorage['showProTipSubscription'] = true;
    }

    $('#hideProTipSubscription').click(function() {
       localStorage['showProTipSubscription'] = false;
       $('#protip-subscription-form').fadeOut().slideUp();
    });

    if(localStorage['showProTipSubscription'] == 'true'){
        $('#protip-subscription-form').show();
    }

    $('#protip-subscribe-btn').click(function() {
        proTipSubscription();
        localStorage['showProTipSubscription'] = false;
        //$('#protip-subscription-form').fadeOut().slideUp();
    });
    allowExternalLinks();
    updateFiatCurrencyCode();
});