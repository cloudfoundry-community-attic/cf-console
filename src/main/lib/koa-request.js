var _request = require('request'), humanize = require('humanize-number');

var colors = {
    5: 31,
    4: 33,
    3: 36,
    2: 32,
    1: 32
};

function time(start) {
    var delta = new Date - start;
    delta = delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's';
    return humanize(delta);
}

function request(options) {
    return function (callback) {
        var start = new Date;
        console.log('  \033[;37m INTERNAL REQUEST  \033[90m<-- \033[;1m%s\033[0;90m %s\033[0m', options.method, options.url);
        _request(options.url, options, function (error, response, body) {
            // get the status code of the response
            var status = response.statusCode;

            // set the color of the status code;
            var s = status / 100 | 0;
            var c = colors[s];

            // get the human readable response length
            var length;
            if (~[204, 205, 304].indexOf(status)) {
                length = '';
            } else if (null == response.body.length) {
                length = '-';
            } else {
                length = response.body.length;
            }

            var upstream = response.statusCode !== 200 ? '\033[31mxxx' : '\033[90m-->';

            console.log('  \033[;37m INTERNAL REQUEST  ' + upstream + ' \033[;1m%s\033[0;90m %s \033[' + c + 'm%s\033[90m %s %s\033[0m',
                options.method,
                options.url,
                response.statusCode,
                time(start),
                length);
            callback(error, response);
        })
    }
}

module.exports = request;