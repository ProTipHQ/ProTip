Developing
==========

To develop the ProTip extension, you will need to have
[Node.js](https://nodejs.org) installed along with `npm`. The ProTip extension
uses the [Gulp](https://gulpjs.com) build tool in order to compile and package
it's source code. First install the [Yarn](https://yarnpkg.com) dependency
manager.

Install instructions for `yarn` for your [operating system here](https://yarnpkg.com/en/docs/install)
Then install `gulp` with the following

```
npm install -g gulp
```

## Building from source

Once you have above tools installed, clone the `ProTip` repository, install
depedencies, then build from source

```
git clone https://github.com/ProTipHQ/ProTip
cd ProTip
yarn install
gulp build
```

## Packaging for app stores

To generate the packages for Chrome and Firefox, you need to install a few extra
node dependencies:

```
npm install -g web-ext crx
```

From within the repo, first run `build` and then the following

```
gulp build
gulp pacakge
```

The `package` command should create the two following folders and files:

```
ProTip/dist/chromium/protip-1.0.0.40.crx
ProTip/dist/firefox/protip-1.0.0.40.xpi
```

These output files are what is added to Firefox and Chrome extension stores.
