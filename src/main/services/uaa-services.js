var request = require(__dirname + '/../lib/koa-request'), nconf = require('nconf');

nconf.argv().env();
nconf.file({ file: __dirname + '/../config/cf-console-config.json' });
var APPLICATION_KEY = 'Basic ' + new Buffer(nconf.get("credentials:username") + ":" + nconf.get("credentials:password")).toString('base64');

//TODO add exception handling
module.exports = {
        login: function*(form) {
            var info = yield request({
                url: nconf.get("endpoints:api") + '/info',
                method: 'GET',
                headers: {Accept: 'application/json'}
            });

            var token = yield request({
                url: JSON.parse(info.body).authorization_endpoint + '/oauth/token',
                method: 'POST',
                headers: {Accept: 'application/json', Authorization: APPLICATION_KEY, 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'},
                form: {grant_type: 'password', username: form.username, password: form.password}
            });

            var parsedToken = JSON.parse(token.body);

            var user = yield request({
                url: nconf.get("endpoints:uaa") + '/userinfo',
                method: 'GET',
                headers: {Accept: 'application/json', Authorization: APPLICATION_KEY, 'authorization': parsedToken.token_type + ' ' + parsedToken.access_token}
            });

            var parsedUser = JSON.parse(user.body);

            return {token: parsedToken, user: parsedUser};
        }
}