var http = require('http'),
  express = require('express'),
  app = express(),
  port = process.env.PORT || 8080
  request = require('request'),
  bodyParser = require('body-parser'),
  qs = require('querystring'),
  util = require('util'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  QuickBooks = require('./index'),
  JSData = require('js-data'),
  DSNedbAdapter = require('js-data-nedb'),
  uuid = require('node-uuid'),
  config = require('config-json');

// GENERIC EXPRESS CONFIG
app.use(express.static(__dirname + '/public'))
app.set('port', port)
app.set('views', 'views')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser('brad'))
app.use(session({ resave: false, saveUninitialized: false, secret: 'smith' }))

// JS DATA DB
var store = new JSData.DS();
var adapter = new DSNedbAdapter();
store.registerAdapter('nedb', adapter, { default: true });

var Users = store.defineResource({
  name: 'user',
  filepath: __dirname + '/dots/users.db'
})

// QB HELPER PART
function updateCuctomerByPhone(id, customer, callback) {
  getQbo(id, function (qbo) {
    qbo.updateCustomer(customer, function (err, customer) {
      if (err) console.log(err)
      if (callback && typeof callback == 'function') {
        callback(customer)
      }
    })
  })
}

function findCustomerByPhone(req, res, id, phone, callback) {
  getQbo(req,res, id, function (qbo) {
    qbo.findCustomers([
      { field: 'fetchAll', value: true },
    ], function (e, res) {
      var customer = res.QueryResponse.Customer.find(x => x.PrimaryPhone && x.PrimaryPhone.FreeFormNumber.replace(/[^\d]/g, "") == phone.replace(/[^\d]/g, ""));
      callback(customer);
    })
  })
}

function getQbo(req, res, id, cb) {
  var compId = id;
  Users.find(compId).then(function (user) {
    var qbo = new QuickBooks(user.ck, user.cs, user.tk, user.ts, user.rid, true, true);
    cb(qbo)
  })
}

app.get('/lookup/:cid', function (req, res) {
  findCustomerByPhone(req, res, req.params.cid, req.query.phoneNumber, function (customer) {
    res.send(customer)
  })
})

app.put('/updated/:cid', function (req, res) {
  updateCuctomerByPhone(req.params.cid, req.body, function (customer) {
    res.send(200);
  })
})

// TWILIO PART
config.load('./dots/twconfig.json');
var ACCOUNT_SID = config.get('AccountSid'),
    AUTH_TOKEN = config.get('authToken'),
    TW_PHONE = config.get('twilioPhone');

app.post('/sms', function (req, res) {
  var TW_SN = "+1" + req.body.PrimaryPhone.FreeFormNumber.replace(/[^\d]/g, ""); // customer number for sms
  var TW_MES = Math.floor(Math.random() * 9000) + 1000;
  client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
  client.sendMessage({ to: TW_SN, from: TW_PHONE, body: TW_MES },
    function (err, responseData) {
      if (!err) {
        console.log(responseData.from);
        console.log(responseData.body);
      }
      res.send({ err: err, response: TW_MES })
    });
})


//ADMIN PART
app.post('/link', function (req, res) {

  debugger
  var user = {
    id: uuid.v4(),
    cn: req.body.name, // company name
    ck: req.body.ck, // consumer_key
    cs: req.body.cs, //consumer_secret
    tk: some,//token
    ts: some,// token_secret
    rid: some, // realmId
    em: req.body.email // company email
  }

  // Users.create(user).then(function (user) {
    res.send({ message: `Successfully created your account. Please direct all of your customers to blah.com/?compId=` + user.id })
  // })
});

// QUICKBOOKS PART
function QBO (req, res, consumerKey, consumerSecret) {
var qbo;
var postBody = {
        url: QuickBooks.REQUEST_TOKEN_URL,
        oauth: {
          callback:        'http://localhost:' + port + '/callback/',
          consumer_key:    consumerKey,
          consumer_secret: consumerSecret
        }
};
    request.post(QuickBooks.REQUEST_TOKEN_URL, postBody, function(err, data) {
        var requestToken = qs.parse(data.body);
            qbo = new QuickBooks(
                            consumerKey,
                            consumerSecret,
                            requestToken.oauth_token,
                            requestToken.oauth_token_secret,
                            postBody.oauth.realmId,
                            true, // use the Sandbox
                            true); // turn debugging on
        req.session.oauth_token_secret = requestToken.oauth_token_secret
        console.log(requestToken)
        debugger
        // res.redirect(QuickBooks.APP_CENTER_URL + requestToken.oauth_token)
    })

    app.get('/callback', function(req, res) {
      var postBody = {
        url: QuickBooks.ACCESS_TOKEN_URL,
        oauth: {
          consumer_key:    consumerKey,
          consumer_secret: consumerSecret,
          token:           req.query.oauth_token,
          token_secret:    req.session.oauth_token_secret,
          verifier:        req.query.oauth_verifier,
          realmId:         req.query.realmId
        }
      }
      request.post(postBody, function (e, r, data) {
        var accessToken = qs.parse(data)
        console.log(accessToken)
        console.log(postBody.oauth.realmId)
      }) 
    })

    console.log("HAve qbo")
    return qbo;
}


app.listen(port, function () {
  console.log('Express server listening on port ' + app.get('port'))
})