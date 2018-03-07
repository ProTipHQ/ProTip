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
depedencies, and then you are ready to build from source

```
git clone https://github.com/ProTipHQ/ProTip
cd ProTip
yarn install
gulp build
```

Aftter `gulp build completes successfully, your repository will have built
ProTip into the `/extension` folder with contents like

```
/extension
  |- /css
  |- /font
  |- /images
  |- /js
  |- /libs
  |- /views
  |- background.js
  |- content.js
  ⌞ manifest.json 
/node_modules
/src
/test
```

You can install your custom built ProTip following one of these instructions

- [Firefox - Temporary Extension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox)
- [Chrome - Developing Extensions](https://developer.chrome.com/extensions)


## Testing codebase

To run automated tests you need to install the following two tools

```
npm install -g eslint mocha
```

No tests have been written yet, but you can run `eslint` on all the JS files
in the app

```
gulp lint
eslint 
mocha
```

Or you can run the linter on specific files one by one

```
eslint src/various/filename.js
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
/dist/chromium/protip-1.0.0.40.crx
/dist/firefox/protip-1.0.0.40.xpi
/extension
...
```

These output files are what is added to Firefox and Chrome extension stores.
