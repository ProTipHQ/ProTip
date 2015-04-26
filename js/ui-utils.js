function allowExternalLinks() {
    $('.external-link').each(function(i, obj) {
        // In a chrome popup page the links won't work without the below.
        $(obj).click(function() {
            chrome.tabs.create({
                url: obj.href
            });
        });
    });
}

function updateFiatCurrencyCode() {
    $.each($(".fiat-code"), function(key, element) {
        element.textContent = localStorage["fiatCurrencyCode"];
    });
}

