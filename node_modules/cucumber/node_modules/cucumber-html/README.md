[![build status](https://secure.travis-ci.org/cucumber/cucumber-html.png)](http://travis-ci.org/cucumber/cucumber-html)
Cucumber-HTML is a cross-platform HTML formatter for all the Cucumber implementations. It's currently only used by Cucumber-JVM and Cucumber.js, but may be used by other implementations later.

## Prerequisites

The formatter generates HTML that conforms to the HTML5 specification, so you need a modern browser to see the results.

## Generating PDF

This formatter replaces Cucumber's old PDF formatter. You can easily turn a HTML report into a PDF with the excellent [wkhtmltopdf](http://code.google.com/p/wkhtmltopdf/):

    wkhtmltopdf cucumber-report.html cucumber-report.pdf

## Release process

* Make sure `pom.xml` has a `X.Y.Z-SNAPSHOT` version
* Make sure `package.json` has a `X.Y.Z` version

Now release:

    make release