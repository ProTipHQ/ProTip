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

function subscriptionAmountCell(record) {
    var input = document.createElement("input");
    input.type = "number";
    input.setAttribute('step', '0.01');
    input.setAttribute('min', '0.10');
    input.className = "amount-fiat subscription-input";
    input.value = record.amountFiat;
    input.id = record.bitcoinAddress;

    input.addEventListener("change", function() {
        record.amountFiat = this.value;
        db.put('subscriptions', record);
        $('#subscriptionTotalAmount').html(subscriptionTotalAmount());
    });

    var cell = document.createElement("td");
    cell.appendChild(input);
    return cell;
}

function subscriptionBitcoinAddressCell(record) {
    var cell = document.createElement("td");
    cell.className = 'blockchain-address';
    cell.appendChild(
        document.createTextNode(
            record.bitcoinAddress.substring(0, 7) + '...'
        )
    );
    return cell;
}

function subscriptionSwitchCell(record) {
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

function buildRow(record) {
    var row = document.createElement("tr");

    row.appendChild(subscriptionSwitchCell(record));
    row.appendChild(subscriptionLabelCell(record));
    row.appendChild(subscriptionAmountCell(record));
    row.appendChild(subscriptionBitcoinAddressCell(record));

    return row;
}

function subscriptionTotalFiatAmount(domIdOutput) {
    db.values('subscriptions').done(function(records) {
        var total = 0.0;
        for (var i in records) {
            total = total + parseFloat(records[i].amountFiat);
        };
        localStorage['subscriptionTotalFiatAmount'] = total.toFixed(2);
        $('#' + domIdOutput).html(total.toFixed(2));
    });
}

function buildTable(domId) {
    var table = document.getElementById(domId);

    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    db.values('subscriptions').done(function(records) {
        for (var i in records) {
            tbody.appendChild(buildRow(records[i]));
        };
    });
}

function manualSubscription() {
    db.put('subscriptions', {
        amountFiat: $('#manual-amount-fiat').val(),
        bitcoinAddress: $('#manual-bitcoin-address').val(),
        title: $('#manual-label').val(),
        url: $('#manual-url').val()
    });
}

function initialize() {

    db = new ydn.db.Storage('protip', schema);

    updateFiatCurrencyCode();

    buildTable('subscription-table');

    subscriptionTotalFiatAmount('subscriptionTotalAmount');

    //$('#subscriptionTotalAmount').html(subscriptionTotalAmount());

    $('#manual-subscribe-btn').click(function() {
        manualSubscription();
    });

    allowExternalLinks();

}

$(function() {
    initialize();
});