var subscriptions = {
  name: 'subscriptions',
  keyPath: 'bitcoinAddress',
  autoIncrement: false,
  indexes: [
    {
      name: 'amountFiat'
    }, {
      name: 'createdAt'
    }, {
      name: 'title'
    }, {
      name: 'url'
    }
  ]
};

var sites = {
  name: 'sites',
  keyPath: 'url',
  autoIncrement: false,
  indexes: [
    {
      name: 'bitcoinAddresses',
      multiEntry: true
    }, {
      name: 'createdAt'
    }, {
      name: 'timeOnPage'
    }, {
      name: 'title'
    }, {
      name: 'bitcoinAddress'
    }
  ]
};

var blacklist = {
  name: 'blacklist',
  keyPath: 'url',
  autoIncrement: false,
  indexes: [
    {
      name: 'url'
    }
  ]
};

var blacklistedHostname = {
  name: 'blacklistedhostnames',
  keyPath: 'hostname',
  autoIncrement: false,
  indexes: [
    {
      name: 'hostname'
    }
  ]
};

var blacklistBitcoinAddresses = {
  name: 'blacklistbitcoinaddresses',
  keyPath: 'bitcoinAddress',
  autoIncrement: false,
  indexes: [
    {
      name: 'bitcoinAddress'
    }
  ]
};

var sponsors = {
  name: 'sponsors',
  keyPath: 'twitterhandle',
  autoIncrement: false,
  indexes: [
    {
      name: 'twitterhandle'
    }
  ]
};

var audit = {
  name: 'audit',
  keyPath: 'createdAt',
  autoIncrement: false,
  indexes: [
    {
      name: 'createdAt'
    }
  ]
};

var schema = {
  version: 1,
  autoSchema: false, // must be false when version is defined
  stores: [subscriptions, sites, blacklist, blacklistedHostname, blacklistBitcoinAddresses, audit, sponsors]
}
