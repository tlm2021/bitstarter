#!/usr/bin/env node 
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_exit_code
    }
    return instr;
};

var buildfn = function(checksfile) {
    var checkUrl = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: %s' + result.message);
            process.exit(1);
        } else if (response.statusCode != '200') {
            console.error('Error: %s', response.statusCode);
            process.exit(1);
        } else {
            checkHtmlFile(response.raw, checksfile);
        }
    };
    return checkUrl;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(htmlfile);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    var outJson = JSON.stringify(out, null, 4);
    console.log(outJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html. Overrides --url.', clone(assertFileExists))
        .option('-u, --url <url>', 'URL to grade.')
        .parse(process.argv);
    if (program.file) {
        var toCheck = fs.readFileSync(program.file);
        checkHtmlFile(toCheck, program.checks);
    }else if (program.url){
        var checkUrl = buildfn(program.checks);
        rest.get(program.url).on('complete', checkUrl);
    }else{
        console.log("You must provide either a path to the file, or a URL.");
        process.exit(1);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
