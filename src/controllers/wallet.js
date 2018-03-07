/* wallet.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

$(document).ready(function() {

    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    // Setup the wallet, page values and callbacks
    var val = ''
    var address = ''
    var SATOSHIS = 100000000
    var FEE = SATOSHIS * .0001
    var BTCUnits = 'BTC'
    var BTCMultiplier = SATOSHIS

    function setupWallet() {
        wallet.restoreAddress().then(setQRCodes,
            function() {
                return wallet.generateAddress();
            }).then(setQRCodes,
            function() {
                alert('Failed to generate wallet. Refresh and try again.');
            }
        );

        function setQRCodes() {
            $('#qrcode').html(createQRCodeCanvas(wallet.getAddress()));
            $('#textAddress').text(wallet.getAddress());
        }
    }
    wallet.setBalanceListener(function(balance) {
        setBalance(balance);
    });
    setupWallet();

    $('#amount').on('keyup change', function() {
        val = Math.floor(Number($(this).val() * BTCMultiplier));
        if (val > 0) {
            currencyManager.formatAmount(val).then(function(formattedMoney) {
                var text = 'Amount: ' + formattedMoney;
                $('#amountLabel').text(text);
            });
        } else {
            $('#amountLabel').text('Amount:');
        }
    });

    function setBTCUnits(units) {
        BTCUnits = units;
        if (units === 'µBTC') {
            BTCMultiplier = SATOSHIS / 1000000;
        } else if (units === 'mBTC') {
            BTCMultiplier = SATOSHIS / 1000;
        } else {
            BTCMultiplier = SATOSHIS;
        }

        setBalance(wallet.getBalance());
        $('#sendUnit').html(BTCUnits);
        $('#amount').attr('placeholder', '(Plus ' + FEE / BTCMultiplier + ' ' + BTCUnits + ' fee)').attr('step', 100000 / BTCMultiplier).val(null);
        $('#amountLabel').text('Amount:');
    }
    preferences.getBTCUnits().then(setBTCUnits);

    function setBalance(balance) {
        if (Number(balance) < 0 || isNaN(balance)) {
            balance = 0;
        }

        $('#bitcoin-fee').text((10000 / BTCMultiplier + ' ' + BTCUnits));

        var address = wallet.getAddress();
        util.getJSON('https://api.blockcypher.com/v1/btc/main/addrs/' + address + '/balance').then(function(response) {
            if (parseInt(response.final_balance) > 0) {
                $('#head-line-balance').text(parseInt(response.final_balance) / BTCMultiplier + ' ' + BTCUnits);
                $('#balance').text(parseInt(response.final_balance) / BTCMultiplier + ' ' + BTCUnits);
                $('#max-available-balance').text((parseInt(response.final_balance - FEE) / BTCMultiplier) + ' ' + BTCUnits);
                currencyManager.formatAmount(response.final_balance).then(function(formattedMoney) {
                    var text = formattedMoney;
                    $('#btc-balance-to-fiat').text(text);
                });
            } else {
                $('#max-available-balance').text('0.00' + ' ' + BTCUnits);
                $('#btc-balance-to-fiat').text('0.00');
            }
        });
    }

    $('#successAlertClose').click(function() {
        $('#successAlert').fadeOut();
        if (typeof chrome === 'undefined') {
            addon.port.emit('resize', 278);
        }
    });

    $('#unkownErrorAlertClose').click(function() {
        $('#unknownErrorAlert').fadeOut();
    });

    if (typeof chrome === 'undefined') {
        addon.port.on('show', setupWallet);
    }

    // Send BTC
    $('#sendButton').click(function() {
        val = Math.floor(Number($('#amount').val() * BTCMultiplier));
        address = $('#sendAddress').val();
        var balance = wallet.getBalance();
        var validAmount = true;
        if (val <= 0) {
            validAmount = false;
        } else if (val + FEE > balance) {
            validAmount = false;
        }
        if (validAmount) {
            $('#amountAlert').slideUp();
        } else {
            $('#amountAlert').slideDown();
        }

        var validAddress = true;
        try {
            new bitcoin.address.fromBase58Check(address);
        } catch (e) {
            validAddress = false;
        }

        if (validAddress) {
            $('#addressAlert').slideUp();
        } else {
            $('#addressAlert').slideDown();
        }

        if (validAddress && validAmount) {
            if (wallet.isEncrypted()) {
                currencyManager.formatAmount(val).then(function(formattedMoney) {
                    var text = 'Are you sure you want to send<br />' + val / BTCMultiplier + ' ' + BTCUnits + ' (<strong>' + formattedMoney + '</strong>)<br />to ' + address + ' ?';
                    $('#sendConfirmationText').html(text);
                    $('#sendConfirmationPassword').val(null);
                    $('#sendConfirmationPasswordIncorrect').hide();
                    $('#sendConfirmationModal').modal().show();
                });
            } else {
                confirmSend();
            }
        }
    });

    $('#confirmSendButton').click(function() {
        confirmSend();
    });

    function confirmSend() {
        $('#cover').show();
        var password = $('#sendConfirmationPassword').val();
        wallet.mulitpleOutputsSend([{
            txDest: address,
            txSatoshis: val
        }], FEE, password).then(function() {
            $('#amount').val(null);
            $('#sendAddress').val(null);
            $('#amountLabel').text('Amount:');
            var text = 'Sent ' + val / BTCMultiplier + ' ' + BTCUnits + ' to ' + address + '.';
            $('#successAlertLabel').text(text);
            $('#successAlert').slideDown();
            $('#sendConfirmationModal').modal('hide');
            $('#cover').fadeOut('slow');
        }, function() {
            $('#successAlertLabel').text('Transaction Submitted');
            $('#successAlert').slideDown();
            $('#cover').hide();
        });
    }

    // Settings Menu
    $('#setPassword').click(function() {
        $('#passwordMismatch').hide();
        $('#setPasswordIncorrect').hide();
        $('#setPasswordBlank').hide();
        if (wallet.isEncrypted()) {
            $('#removePasswordDiv').show();
            $('#setPasswordPassword').show().val(null);
        } else {
            $('#removePasswordDiv').hide();
            $('#setPasswordPassword').hide().val(null);
        }
        $('#newPassword').show().val(null);
        $('#confirmNewPassword').show().val(null);
        $('#removePassword').attr('checked', false);
        $('#setPasswordModal').modal().show();
    });

    $('#removePassword').click(function() {
        if (this.checked) {
            $('#newPassword').val(null).slideUp();
            $('#confirmNewPassword').val(null).slideUp();
        } else {
            $('#newPassword').slideDown();
            $('#confirmNewPassword').slideDown();
        }
    });

    $('#confirmSetPassword').click(function() {
        var password = $('#setPasswordPassword').val();
        var newPassword = $('#newPassword').val();
        var confirmNewPassword = $('#confirmNewPassword').val();
        var validInput = true;
        if ((wallet.isEncrypted() && !password) || (!$('#removePassword').is(':checked') && (!newPassword || !confirmNewPassword))) {
            validInput = false;
            $('#setPasswordBlank').slideDown();
        } else {
            $('#setPasswordBlank').slideUp();
        }

        if (validInput && newPassword !== confirmNewPassword) {
            validInput = false;
            $('#passwordMismatch').slideDown();
        } else {
            $('#passwordMismatch').slideUp();
        }

        if (validInput && wallet.isEncrypted() && !wallet.validatePassword(password)) {
            validInput = false;
            $('#setPasswordIncorrect').slideDown();
        } else {
            $('#setPasswordIncorrect').slideUp();
        }

        if (validInput) {
            wallet.updatePassword(String(password), String(newPassword)).then(function() {
                $('#successAlertLabel').text('New password set.');
                $('#successAlert').show();
                $('#setPasswordModal').modal('hide');
            });
        }
    });

    $('#setCurrency').click(function() {
        preferences.getCurrency().then(function(currency) {
            var currencies = currencyManager.getAvailableCurrencies();
            var tableBody = '';
            for (var i = 0; i < currencies.length / 3; i++) {
                tableBody += '<tr>';
                for (var j = i; j <= i + 12; j += 6) {
                    tableBody += '<td><div class="radio no-padding"><label><input type="radio" name="' + currencies[j] + '"';
                    if (currencies[j] === currency) {
                        tableBody += ' checked';
                    }
                    tableBody += '>' + currencies[j] + '</label></div></td>';
                }
                tableBody += '</tr>';
            }
            $('#tableBody').html(tableBody);
            $('#setCurrencyModal').modal().show();
            $('.radio').click(function() {
                var currency = $.trim($(this).text());
                $('input:radio[name=' + currency + ']').attr('checked', 'checked');
                preferences.setCurrency(currency).then(function() {
                    $('#amountLabel').text('Amount:');
                    $('#successAlertLabel').text('Currency set to ' + currency + '.');
                    $('#successAlert').show();
                    $('#setCurrencyModal').modal('hide');
                });
            });
        });
    });

    $('#setUnits').on('click', function() {
        var setUnit = function(unit) {
            $.each($('#setBTCUnits').find('input[type=radio]'), function() {
                if ($(this).attr('name') == unit) {
                    $(this).prop('checked', true)
                }
            })
        }
        preferences.getBTCUnits().then(setUnit)
    })

    $('#setBTCUnits').find('.radio').on('click', function() {
        var unit = $.trim($(this).text());
        setBTCUnits(unit);
        preferences.setBTCUnits(unit).then(function() {
            $.each($('#setBTCUnits').find('input[type=radio]'), function() {
                if ($(this).attr('name') == unit) {
                    $(this).prop('checked', true)
                } else {
                    $(this).prop('checked', false)
                }
            })
            $('#successAlertLabel').text('Bitcoin Units set to: ' + unit);
            $('#successAlert').show();
            $('#setUnitsModal').modal('hide');
        });
    });

    $('#showPrivateKey').click(function() {
        $('#showPrivateKeyPasswordIncorrect').hide();
        if (wallet.isEncrypted()) {
            $('#showPrivateKeyPassword').val(null).show();
        } else {
            $('#showPrivateKeyPassword').hide();
        }
        $('#privateKey').hide();
        $('#showPrivateKeyModal').modal().show();
    });

    $('#showPrivateKeyConfirm').click(function() {
        var password = $('#showPrivateKeyPassword').val();
        if (wallet.isEncrypted() && !wallet.validatePassword(password)) {
            $('#showPrivateKeyPasswordIncorrect').slideDown();
        } else {
            $('#showPrivateKeyPasswordIncorrect').slideUp();
            var privateKey = wallet.getDecryptedPrivateKey(password);
            $('#privateKeyQRCode').html(createQRCodeCanvas(privateKey));
            $('#privateKeyText').text(privateKey);
            $('#privateKey').slideDown(function() {
                $('#main').height($('#showPrivateKeyModal').find('.modal-dialog').height());
            });
        }
    });

    $('#importPrivateKey').click(function() {
        $('#importPrivateKeyPasswordIncorrect').hide();
        $('#importPrivateKeyBadPrivateKey').hide();
        if (wallet.isEncrypted()) {
            $('#importPrivateKeyPassword').val(null).show();
        } else {
            $('#importPrivateKeyPassword').hide();
        }
        $('#importPrivateKeyPrivateKey').val(null);
        $('#importPrivateKeyModal').modal().show();
    });

    $('#importPrivateKeyConfirm').click(function() {
        var privateKey = $('#importPrivateKeyPrivateKey').val();
        try {
            new bitcoin.ECPair.fromWIF(privateKey);
        } catch (e) {
            $('#importPrivateKeyBadPrivateKey').slideDown();
            return;
        }
        wallet.importAddress($('#importPrivateKeyPassword').val(), privateKey).then(function() {
            setupWallet();
            $('#successAlertLabel').text('Private key imported successfully.');
            $('#successAlert').show();
            $('#importPrivateKeyModal').modal('hide');
        }, function(e) {
            if (e.message === 'Incorrect password') {
                $('#importPrivateKeyBadPrivateKey').slideUp();
                $('#importPrivateKeyPasswordIncorrect').slideDown();
            } else {
                $('#importPrivateKeyPasswordIncorrect').slideUp();
                $('#importPrivateKeyBadPrivateKey').slideDown();
            }
        });
    });

    $('#generateNewWallet').click(function() {
        $('#generateNewWalletPasswordIncorrect').hide();
        if (wallet.isEncrypted()) {
            $('#generateNewWalletPassword').show().val(null);
        } else {
            $('#generateNewWalletPassword').hide();
        }
        $('#generateNewWalletModal').modal().show();
    });

    $('#generateNewWalletConfirm').click(function() {
        wallet.generateAddress($('#generateNewWalletPassword').val()).then(function() {
            setupWallet();
            $('#successAlertLabel').text('New wallet generated.');
            $('#successAlert').show();
            $('#generateNewWalletModal').modal('hide');
        }, function() {
            $('#generateNewWalletPasswordIncorrect').slideDown();
        });
    });

    // About
    if (typeof chrome !== 'undefined') {
        $('#version').text(browser.runtime.getManifest().version);
    } else {
        addon.port.on('version', function(version) {
            $('#version').text(version);
        });
    }

    $('#aboutModal').on('click', 'a', function() {
        if (typeof chrome !== 'undefined') {
            browser.tabs.create({
                url: $(this).attr('href')
            });
        } else {
            addon.port.emit('openTab', $(this).attr('href'));
        }
        return false;
    });

    // Modal Resizing
    $('.modal').on('shown.bs.modal', function() {
        var $main = $('#main');
        var height = $main.height();
        var modalHeight = $(this).find('.modal-dialog').height();
        if (modalHeight > height) {
            $main.height(modalHeight);
            if (typeof chrome === 'undefined') {
                addon.port.emit('resize', modalHeight + 2);
            }
        }
    }).on('hidden.bs.modal', function() {
        $('#main').height('auto');
        if (typeof chrome === 'undefined') {
            var height
            if ($('#successAlert').is(':visible')) {
                height = 350;
            } else {
                height = 278;
            }
            addon.port.emit('resize', height);
        }
    });

});
