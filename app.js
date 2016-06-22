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

// QUICKBOOKS PART
// function QBO(req, res, consumerKey, consumerSecret) {
//   var postBody = {
//     url: QuickBooks.REQUEST_TOKEN_URL,
//     oauth: {
//       callback: 'http://localhost:' + port + '/callback/',
//       consumer_key: consumerKey,
//       consumer_secret: consumerSecret
//     }
//   }
//   request.post(postBody, function (e, r, data) {
//     var requestToken = qs.parse(data)
//     req.session.oauth_token_secret = requestToken.oauth_token_secret
//     console.log(requestToken)
//     res.redirect(QuickBooks.APP_CENTER_URL + requestToken.oauth_token)
//   })
// }


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

function findCustomerByPhone(id, phone, callback) {
  getQbo(id, function (qbo) {
    qbo.findCustomers([
      { field: 'fetchAll', value: true },
    ], function (e, res) {
      var customer = res.QueryResponse.Customer.find(x => x.PrimaryPhone && x.PrimaryPhone.FreeFormNumber.replace(/[^\d]/g, "") == phone.replace(/[^\d]/g, ""));
      callback(customer);
    })
  })
}

var _qbo
function getQbo(id, cb) {
  var compId = id;
  Users.find(compId).then(function (user) {
    var consumerKey = user.consumerKey,
        consumerSecret = user.consumerSecret,
        token = user.ot,
        token_secret = user.ots,
        realmId = user.realmId;

    _qbo = new QuickBooks(
            consumerKey, 
            consumerSecret, 
            token,
            token_secret,
            realmId,
            true, // use the Sandbox
            true) // turn debugging on
    cb(_qbo)
  })
}

// app.get('/callback', function (req, res) {
//   var postBody = {
//     url: QuickBooks.ACCESS_TOKEN_URL,
//     oauth: {
//       consumer_key: consumerKey,
//       consumer_secret: consumerSecret,
//       token: req.query.oauth_token,
//       token_secret: req.session.oauth_token_secret,
//       verifier: req.query.oauth_verifier,
//       realmId: req.query.realmId
//     }
//   }
//   request.post(postBody, function (e, r, data) {
//       var accessToken = qs.parse(data)
//       console.log(accessToken)
//       console.log(postBody.oauth.realmId)

//       // save the access token somewhere on behalf of the logged in user
//       qbo = new QuickBooks(
//             consumerKey,
//             consumerSecret,
//             accessToken.oauth_token,
//             accessToken.oauth_token_secret,
//             postBody.oauth.realmId,
//             true, // use the Sandbox
//             true)
//     })
// })

app.get('/lookup', function (req, res) {
  findCustomerByPhone(req.query.compId, req.query.phoneNumber, function (customer) {
    res.send(customer)
  })
})

app.put('/updated', function (req, res) {
  updateCuctomerByPhone(req.query.compId, req.body, function (customer) {
    res.send(200);
  })
})

app.get('/ready', function (req, res) {
  res.sendFile(__dirname + '/public/index.html')
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
app.post('/users', function (req, res) {
  Users.create(req.body.user).then(function (user) {
    res.send({ message: `Successfully created your account. Please direct all of your customers to blah.com/?compId=` + user.id })
  })
})


app.listen(port, function () {
  console.log('Express server listening on port ' + app.get('port'))
})