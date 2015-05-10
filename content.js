var matchText = function(node, regex, callback, excludeElements) {

    excludeElements || (excludeElements = ['script', 'style', 'iframe', 'cavas', 'a']);
    var child = node.firstChild;

    do {
        switch (child.nodeType) {
        case 1:
            if (excludeElements.indexOf(child.tagName.toLowerCase()) > -1) {
                continue;
            }
            // Weird hack, running scanLinks() prior to matchText messes up the reference to child.firstChild
            // Maybe something to do with the moving the newly created elements post loading... Really not sure
            if(child.firstChild){ //
              matchText(child, regex, callback, excludeElements);
            }
            break;
        case 3:
            child.data.replace(regex, function(all) {
                 var args = [].slice.call(arguments),
                     offset = args[args.length - 2],
                     newTextNode = child.splitText(offset);

                 newTextNode.data = newTextNode.data.substr(all.length);
                 callback.apply(window, [child].concat(args));
                 child = newTextNode;
             });
             break;
        }
    } while (child = child.nextSibling);

    return node;
}

function starredUser(){
    var twitterUserContainer = document.getElementsByClassName('ProfileHeaderCard-name')[0];
    var span = document.createElement("span");
    span.style.backgroundColor = '#7FE56F';

    //Code for displaying <extensionDir>/images/myimage.png:
    var imgURL = chrome.extension.getURL("./assets/images/star.png");
    var img = document.createElement("img");
    img.setAttribute("src", imgURL);

    span.style.padding = '5px';
    span.style.marginLeft = '6px';
    span.style.position = 'relative';
    span.style.fontSize = '10px';
    span.style.top = '-3px';
    span.style.borderRadius = '2px';
    span.style.display = 'inline-flex';
    span.innerText = 'ProTip Sponsor';

    twitterUserContainer.appendChild(img);
    twitterUserContainer.appendChild(span);
}

function highlightElement(match){
    var span = document.createElement("span");
    span.style.padding = '0px';
    span.style.borderRadius = '2px';
    span.style.display = 'inline-flex';
    span.className = 'protip-match';
    span.id = match;
    return span;
}

function ensureSingleSelectionOfCheckbox(selectedBTCAddress){
    // Makes the checkboxes act similar to radio buttons.
    //
    // I care alot about UI design, so why break default
    // UI behavior?
    //
    // Only one BTC address can recorded per URL. A one to
    // one relationship.
    //
    // User testing revealed that the first found BTC address
    // is almost always the correct BTC address to record.
    //
    // Edge cases in order of priority:
    // #1 Remove a BTC address such that no BTC address is
    //    recorded for the URL.
    // #2 Swap the recorded BTC address for a another found
    //    further down the page. Rare, but users want to know
    //    they have the option.
    //
    // Typically, this would be done with a combination of
    // checkbox and radio buttons.
    //
    // My reasons for breaking default checkbox UI behavour:
    // #1 Limited UI real estate in unconventional places.
    // #2 The radio buttons work best when promixal to each
    //    other. The highlighted BTC addresses are potentially
    //    distributed throughout the whole page.
    // #3 Edge Case #1 takes priority over Edge Case #2
    //
    // Will see how user testing proceeds. :).
    els = document.getElementsByClassName('protip-checkbox');
    for ( i = 0; i < els.length; i++ ) {
        if ( els[i].id == 'protip-checkbox-' + selectedBTCAddress ) {
            els[i].parentElement.style.backgroundColor = '#7FE56F';
        } else {
            els[i].checked = false;
            els[i].parentElement.style.backgroundColor = 'transparent';
        }
    }
}

function addCheckboxes(){
    var firstAddress = true;

    var els = document.getElementsByClassName('protip-match');
    for ( i = 0; i < els.length; i++ ) {

        var checkbox = document.createElement("input");
        checkbox.type = 'checkbox';
        if ( firstAddress ) {
            // The first found BTC address is almost always the correct BTC address to record
            // User can use our checkboxes UI to change this default behavor if needed.
            checkbox.checked = 'checked';
            firstAddress = false;
            els[i].style.backgroundColor = '#7FE56F';
            chrome.runtime.sendMessage({
              source: 'link',
              bitcoinAddress: els[i].id,
              title: document.title,
              url: document.URL
            });
        }
        checkbox.className = 'protip-checkbox';
        checkbox.id = 'protip-checkbox-' + els[i].id;
        checkbox.addEventListener("click",
            function () {
                if( this.checked ) { // state changed before 'click' is fired
                    window.postMessage(
                        { action: "updateBitcoinAddress", bitcoinAddress: this.parentElement.id }, "*"
                    );
                    ensureSingleSelectionOfCheckbox(this.parentElement.id);
                } else {
                    window.postMessage(
                        { action: "revokeBitcoinAddress", bitcoinAddress: this.parentElement.id }, "*"
                    );
                    this.parentElement.style.backgroundColor = 'transparent';
                }
            }, false
        );
        els[i].insertBefore(checkbox, els[i].firstChild);
    }
}

function scanLinks() {
    var links = document.links;
    for ( i = 0; i < links.length; i++ ) {
        var match = links[i].href.match(/bitcoin:([13][a-km-zA-HJ-NP-Z0-9]{26,33})/i);
        if ( match ) {
            var span = highlightElement(match[0]);
            links[i].parentElement.insertBefore(span, links[i]);
            span.appendChild(links[i]);
        }
    }
}

function scanText(){
    if(document.URL.match(/http/)){ // only send http or https urls no chrome:// type addresses.
        var regex = new RegExp("(^|\\s)[13][a-km-zA-HJ-NP-Z0-9]{26,33}($|\\s)", "g");
        matchText(document.body, regex, function (node, match, offset) {
             var span = highlightElement(match);
             span.textContent = match;
             node.parentNode.insertBefore(span, node.nextSibling);
        });
    }
}


function scanMetatags(){
    //<meta name="microtip" content="1PvxNMqU29vRj8k5EVKsQEEfc84rS1Br3b" data-currency="btc">
    var metatags = document.getElementsByTagName('meta');
    for ( i = 0; i < metatags.length; i++ ) {
        if( metatags[i].name == 'microtip' ) {
            chrome.runtime.sendMessage({
                source: 'metatag',
                bitcoinAddress: metatags[i].content,
                title: document.title,
                url: document.URL
            });
            return true // only get the first instance of a microtip metatag.
        }
    }
}

window.addEventListener("message", function (event) {
    // We only accept messages from ourselves
    if (event.source != window) {
        return;
    }

    chrome.runtime.sendMessage({
        action: event.data.action,
        bitcoinAddress: event.data.bitcoinAddress,
        url: document.URL
     });
}, false);

var port = chrome.runtime.connect();

chrome.runtime.sendMessage({action: 'isBlacklisted', url:document.URL});
chrome.runtime.sendMessage({action: 'isStarredUser', url:document.URL});
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    isBlacklisted = request.response // set global
    if (request.method == 'isBlacklisted' && request.response == false){
        if(!scanMetatags()){ // Metatag tip has priority over all other BTC addresses.
            scanLinks();
            scanText();
            addCheckboxes();
        }
    } else if (request.method == 'isStarredUser' && request.response == true){
        starredUser();
    } // else page is blacklisted and no need to scan anything.
});


