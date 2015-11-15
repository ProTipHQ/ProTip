
// use a already existing formater or fallback to the default v8 formater
var defaultFormater = require('./format.js');

// public define API
function stackChain() {
  this.extend = new TraceModifier();
  this.filter = new TraceModifier();
  this.format = new StackFormater();
  this.version = require('./package.json').version;
}

var SHORTCUT_CALLSITE = false;
stackChain.prototype.callSite = function collectCallSites(options) {
  if (!options) options = {};

  // Get CallSites
  SHORTCUT_CALLSITE = true;
  var obj = {};
  Error.captureStackTrace(obj, collectCallSites);
  var callSites = obj.stack;
  SHORTCUT_CALLSITE = false;

  // Slice
  callSites = callSites.slice(options.slice || 0);

  // Modify CallSites
  if (options.extend) callSites = this.extend._modify(obj, callSites);
  if (options.filter) callSites = this.filter._modify(obj, callSites);

  // Done
  return callSites;
};

var chain = new stackChain();

// If a another copy (same version or not) of stack-chain exists it will result
// in wrong stack traces (most likely dublicate callSites).
if (global._stackChain) {
  // In case the version match, we can simply return the first initialized copy
  if (global._stackChain.version === chain.version) {
    module.exports = global._stackChain;
    return; // Prevents V8 and Error extentions from being set again
  }
  // The version don't match, this is really bad. Lets just throw
  else {
    throw new Error('Conflicting version of stack-chain found');
  }
}
// Yay, no other stack-chain copy exists, yet :/
else {
  module.exports = global._stackChain = chain;
}

function TraceModifier() {
  this._modifiers = [];
}

TraceModifier.prototype._modify = function (error, frames) {
  for (var i = 0, l = this._modifiers.length; i < l; i++) {
    frames = this._modifiers[i](error, frames);
  }

  return frames;
};

TraceModifier.prototype.attach = function (modifier) {
  this._modifiers.push(modifier);
};

TraceModifier.prototype.deattach = function (modifier) {
  var index = this._modifiers.indexOf(modifier);

  if (index === -1) return false;

  this._modifiers.splice(index, 1);
  return true;
};

function StackFormater() {
  this._formater = defaultFormater;
  this._previous = undefined;
}

StackFormater.prototype.replace = function (formater) {
  if (formater) {
    this._formater = formater;
  } else {
    this.restore();
  }
};

StackFormater.prototype.restore  = function () {
  this._formater = defaultFormater;
};

StackFormater.prototype._backup = function () {
  if (this._formater === defaultFormater) {
    this._previous = undefined;
  } else {
    this._previous = this._formater;
  }
};

StackFormater.prototype._roolback = function () {
  this.replace(this._previous);
  this._previous = undefined;
};


//
// Set Error.prepareStackTrace thus allowing stack-chain
// to take control of the Error().stack formating.
//

// If there already is a custom stack formater, then set
// that as the stack-chain formater.
if (Error.prepareStackTrace) {
    chain.format.replace(Error.prepareStackTrace);
}

function prepareStackTrace(error, originalFrames) {
  if (SHORTCUT_CALLSITE) return originalFrames;

  // Make a loss copy of originalFrames
  var frames = originalFrames.concat();

  // extend frames
  frames = chain.extend._modify(error, frames);

  // filter frames
  frames = chain.filter._modify(error, frames);

  // reduce frames to match Error.stackTraceLimit
  frames = frames.slice(0, Error.stackTraceLimit);

  // Set the callSite property
  // But only if it havn't been explicitly set, otherwise
  // error.stack would have unintended side effects
  if (Object.getOwnPropertyDescriptor(error, "callSite") === undefined) {
    error.callSite = {
      original: originalFrames,
      mutated: frames
    };
  }

  // format frames
  return chain.format._formater(error, frames);
}

// Replace the v8 stack trace creator
Object.defineProperty(Error, 'prepareStackTrace', {
  'get': function () {
    return prepareStackTrace;
  },

  'set': function (formater) {
    // If formater is prepareStackTrace it means that someone ran
    // var old = Error.prepareStackTrace;
    // Error.prepareStackTrace = custom
    // new Error().stack
    // Error.prepareStackTrace = old;
    // The effect of this, should be that the old behaviour is restored.
    if (formater === prepareStackTrace) {
      chain.format._roolback();
    }
    // Error.prepareStackTrace was set, this means that someone is
    // trying to take control of the Error().stack format. Make
    // them belive they succeeded by setting them up as the stack-chain
    // formater.
    else {
      chain.format._backup();
      chain.format.replace(formater);
    }
  }
});

//
// Manage call site storeage
//
function callSiteGetter() {
  // calculate call site object
  this.stack;

  // return call site object
  return this.callSite;
}

Object.defineProperty(Error.prototype, 'callSite', {
  'get': callSiteGetter,

  'set': function (frames) {
    // In case callSite was set before [[getter]], just set
    // the value
    Object.defineProperty(this, 'callSite', {
        value: frames,
        writable: true,
        configurable: true
    });
  },

  configurable: true
});
