/* subscriptions.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

function subscriptionLabelCell(record) {
    var cell = document.createElement("td");

    cell.appendChild(document.createElement('div').appendChild(
        document.createTextNode(record.title)
    ));
    var a = document.createElement('a');
    a.style.display = 'block';
    var linkText
    if (record.url) { // url is optional, for manual subscriptions
        linkText = document.createTextNode(record.url.replace(/http(s?):\/\/(www.|)/, '').substring(0, 40));
    } else {
        linkText = document.createTextNode('');
    }
    a.appendChild(linkText);
    a.className = 'external-link';
    a.href = record.url;
    $(a).click(function() {
        // In a chrome popup
        // the links won't work without the below. Needs to be
        // re-ran on every table creation.
        browser.tabs.create({
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
    // This is the subscription table all rows are subscribed
    input.checked = true;
    input.id = record.bitcoinAddress;
    // Switchery.js
    input.className = 'js-switch';
    // append to cell before init Switchery
    cell.appendChild(input);

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

function subscriptionEmptyRow() {
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

function proTipSubscription() {
    db.put('subscriptions', {
        amountFiat: $('#protip-amount-fiat').val(),
        bitcoinAddress: $('#protip-bitcoin-address').val(),
        title: $('#protip-label').val(),
        url: $('#protip-url').val()
    });
    $('#protip-subscription-form').slideUp();
}

$(document).ready(function() {

    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    db = new ydn.db.Storage('protip', schema);

    buildTable('subscription-tbody');

    subscriptionTotalFiatAmount().then(function(totalFiatAmount){
        $('#subscription-total-amount').html(totalFiatAmount);
    });

    $('#manual-amount-fiat').attr('placeholder', localStorage['defaultSubscriptionAmountFiat']);
    $('#protip-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);

    // A hack
    $.validator.addMethod('validBitcoinAddress', function() {
        return false;
    },'Invalid bitcoin address');

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
            buildTable('subscription-tbody');
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
    });

    allowExternalLinks();
    updateFiatCurrencyCode();

});
