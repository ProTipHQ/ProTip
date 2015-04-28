subscriptions = {
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

sites = {
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

blacklist = {
  name: 'blacklist',
  keyPath: 'url',
  autoIncrement: false,
  indexes: [
    {
      name: 'url'
    }
  ]
};

blacklistedHostname = {
  name: 'blacklistedhostnames',
  keyPath: 'hostname',
  autoIncrement: false,
  indexes: [
    {
      name: 'hostname'
    }
  ]
};

blacklistBitcoinAddresses = {
  name: 'blacklistbitcoinaddresses',
  keyPath: 'bitcoinAddress',
  autoIncrement: false,
  indexes: [
    {
      name: 'bitcoinAddress'
    }
  ]
};

sponsors = {
  name: 'sponsors',
  keyPath: 'twitterhandle',
  autoIncrement: false,
  indexes: [
    {
      name: 'twitterhandle'
    }
  ]
};

audit = {
  name: 'audit',
  keyPath: 'createdAt',
  autoIncrement: false,
  indexes: [
    {
      name: 'createdAt'
    }
  ]
};

schema = {
  version: 1,
  autoSchema: false, // must be false when version is defined
  stores: [subscriptions, sites, blacklist, blacklistedHostname, blacklistBitcoinAddresses, audit, sponsors]
}


