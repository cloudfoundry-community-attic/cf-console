var koa = require('koa')
    , route = require('koa-route')
    , app = koa()
    , request = require(__dirname + '/lib/koa-request')
    , uaa = require(__dirname + '/services/uaa-services.js')
    , logger = require('koa-logger')
    , hbs = require('koa-hbs')
    , cors = require('koa-cors')
    , parse = require('co-body')
    , serve = require('koa-static')
    , handlebars = require('handlebars');

handlebars.registerHelper('dt', function(text, ctx) {
    return new hbs.SafeString(hbs.handlebars.partials[text]);
});

app.keys = ['aksjdhKGFAKJHGDkjlhfakI#Qtr&76rt3qkiGJSAGDFjft3kasdfJytrU%^jh',
    'ALKJHSdjhabfhjgUYWADvhgq3776JHGFAF^&JKHADjkzhgdjhfgdwuy',
    'kjjkasdaklUHYQ@#&*^4873rgfkakjhfgaY#UTRf'];

app.use(hbs.middleware({
    handlebars : handlebars,
    viewPath: __dirname + '/views',
    partialsPath: __dirname + '/views/partials'
}));

app.use(cors());

app.use(logger());

app.use(serve(__dirname + '/public'));

app.use(function *(next) {
    try {
        yield next;
    } catch (err) {
        // some errors will have .status
        // however this is not a guarantee
        this.status = err.status || 500;
        this.type = 'application/json';
        this.body = '{"error":"bang"}';
        this.app.emit('error', err, this);
    }
});

app.use(route.get('/login', function *(next) {
    yield this.render('cf-login');
}));

app.use(route.post('/login', function *(next) {
    var form = yield parse(this);
    var authDetails = yield uaa.login(form.username, form.password);
    this.cookies.set('authDetails', JSON.stringify(authDetails), { signed: true });
    this.redirect('/users/' + authDetails.user.user_id);
}));

app.use(route.get('/login', function *(next) {
    yield this.render('cf-login');
}));

app.use(route.get('/logout', function *(next) {
    this.cookies.set('authDetails', "{}");
    this.redirect('/login');
}));

app.use(route.get('/users/:id', function*(next){
    yield this.render('cf-console');
}));

app.use(function *() {
    this.status = 404;
    yield this.render('not_found');
});

app.on('error', function (err) {
    console.log('server error ', err.status, err);
});

if (!module.parent) app.listen(8000);