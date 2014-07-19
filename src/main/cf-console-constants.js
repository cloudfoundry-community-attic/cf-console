module.exports = {

    API_ENDPOINT : 'http://api.cf.eden.klm.com',

    UAA_ENDPOINT : 'http://uaa.cf.eden.klm.com',

    APPLICATION_KEY : 'Basic ' + new Buffer("styx:styxsecret").toString('base64'),

    validateResponse : function*(response){
        if(response === null || response.statusCode !== 200){
            var error = new Error(response.body);
            error.status = response.statusCode;
            throw error;
        }
    }
}