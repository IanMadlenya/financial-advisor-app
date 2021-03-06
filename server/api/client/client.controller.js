'use strict';

var _ = require('lodash');
var Client = require('./client.model');
var Account = require('../account/account.model');
var BasicAccount = require('../basicaccount/basicaccount.model');
var BankTransaction = require('../banktransaction/banktransaction.model');
var InvestmentAccount = require('../investmentaccount/investmentaccount.model');
var Holdings = require('../holdings/holdings.model');
var Loan = require('../loan/loan.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var request = require('request');

// Get list of clients
exports.index = function(req, res) {
  Client.find(function (err, clients) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(clients);
  });
};

// Get clients for an advisor
exports.myclients = function(req, res) {
  var userId = req.user._id;
  Client.find({advisor: userId}, function (err, clients) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(clients);
  });
};

// Refresh data for single client for an advisor
exports.accountsrefresh = function(req, res) {
  var url = 'http://localhost:8080/api/scrape/';
  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      return res.status(200).json(body);
    } else {
      return res.status(404).send('Not Found');
    }
  })
};

// Get single client for an advisor
exports.myclient = function(req, res) {
  var userId = req.user._id;
  Client.findOne({_id: req.params.id, advisor: userId}, function (err, clients) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(clients);
  });
};

// Deletes a account from the DB.
exports.deletemyclient = function(req, res) {
  Client.findById(req.params.id, function (err, client) {
    if(err) { return handleError(res, err); }
    if(!client) { return res.status(404).send('Not Found'); }
    client.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

// Get single client for an advisor
exports.addmyclient = function(req, res) {
  Client.create(req.body, function(err, client) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(client);
  });
};

// Get accounts for single client for an advisor
exports.clientaccounts = function(req, res) {
  var userId = req.user._id;
  Client.findOne({_id: req.params.id, advisor: userId}, function (err, client) {
      if(err) { return handleError(res, err); }
      var clientId = client._id;
      Account.find({client: clientId}, function(err, accounts){
        if(err) { return handleError(res, err); }
        return res.status(200).json(accounts);
      });
  });
};

// Add account for client for an advisor
exports.addclientaccount = function(req, res) {
  Account.create(req.body, function(err, account) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(account);
  });
};

// Deletes a account from the DB.
exports.deleteclientaccount = function(req, res) {
  Account.findById(req.params.accid, function (err, account) {
    if(err) { return handleError(res, err); }
    if(!account) { return res.status(404).send('Not Found'); }
    account.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

// Refresh data for single client for an advisor
exports.clientaccountsrefresh = function(req, res) {
  var clientId = req.params.id;
  var url = 'http://localhost:8080/api/scrape/client/'+clientId;
  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      return res.status(200).json(body);
    } else {
      return res.status(404).send('Not Found');
    }
  })
};

// Refresh data for single account for single client for advisor
exports.clientaccountrefresh = function(req, res) {
  var clientId = req.params.id;
  var accountId = req.params.accid;
  var url = 'http://localhost:8080/api/scrape/client/'+clientId+'/'+accountId;
  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      return res.status(200).json(body);
    } else {
      return res.status(404).send('Not Found');
    }
  })
};

// Get single account and sub accounts for single client for an advisor
exports.clientaccount = function(req, res) {
  var userId = req.user._id;
  var accountId = req.params.accid;
  //Find client first
  Client.findOne({_id: req.params.id, advisor: userId}, function (err, client) {
    if(err) { return handleError(res, err); }
    Account.findOne({_id: accountId, client: client._id}, function(err, account){
      //Look up sub accounts for this account
      //Basic accounts first
      var someaccount = account.toObject();
      BasicAccount.find({account: accountId}, function(err, basicaccounts){
        if(err) { return handleError(res, err); }
        someaccount.basicaccounts = basicaccounts;
        var totalBalance = 0;
        for (var i=0;i<basicaccounts.length;i++){
          var somebasicaccount = basicaccounts[i];
          totalBalance += somebasicaccount.total_balance;
        }
        someaccount.total_balance = totalBalance;
        //Now investment accounts
        InvestmentAccount.find({account: accountId}, function(err, investmentaccounts){
          if(err) { return handleError(res, err); }
          someaccount.investmentaccounts = investmentaccounts;
          var totalBalance = 0;
          for (var i=0;i<investmentaccounts.length;i++){
            var someinvestmentaccount = investmentaccounts[i];
            totalBalance += someinvestmentaccount.balance;
          }
          someaccount.total_holdings = totalBalance;
          //Now loans
          Loan.find({account: accountId}, function(err, loans){
            if(err) { return handleError(res, err); }
            someaccount.loans = loans;
            var totalLiability = 0;
            for (var i=0;i<loans.length;i++){
              var someloan = loans[i];
              totalLiability += someloan.balance;
            }
            someaccount.total_liability = totalLiability;
            if(err) { return handleError(res, err); }
            return res.status(200).json(someaccount);
          });
        });
      });
    });
  });
};

// Get single account and sub accounts for single client for an advisor
exports.clientbasicaccount = function(req, res) {
  var userId = req.user._id;
  var accountId = req.params.accid;
  var subaccountId = req.params.subid;
  //Find client first
  BasicAccount.findOne({_id: subaccountId}, function(err, basicaccount){
    if(err) { return handleError(res, err); }
    basicaccount = basicaccount.toObject();
    BankTransaction.find({account: subaccountId}, function(err, banktransactions){
      if(err) { return handleError(res, err); }
      basicaccount.transactions = banktransactions;
      return res.status(200).json(basicaccount);
    });
  });
};

// Get single account and sub accounts for single client for an advisor
exports.clientinvestment = function(req, res) {
  var userId = req.user._id;
  var accountId = req.params.accid;
  var subaccountId = req.params.subid;
  //Find client first
  InvestmentAccount.findOne({_id: subaccountId}, function(err, investment){
    if(err) { return handleError(res, err); }
    if(!investment){ return res.status(404).send('Not Found'); }
    investment = investment.toObject();
    Holdings.find({account: subaccountId}, function(err, holdings){
      if(err) { return handleError(res, err); }
      investment.holdings = holdings;
      return res.status(200).json(investment);
    });
  });
};

// Get a single client
exports.show = function(req, res) {
  Client.findById(req.params.id, function (err, client) {
    if(err) { return handleError(res, err); }
    if(!client) { return res.status(404).send('Not Found'); }
    return res.json(client);
  });
};

// Creates a new client in the DB.
exports.create = function(req, res) {
  Client.create(req.body, function(err, client) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(client);
  });
};

// Updates an existing client in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Client.findById(req.params.id, function (err, client) {
    if (err) { return handleError(res, err); }
    if(!client) { return res.status(404).send('Not Found'); }
    var updated = _.merge(client, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(client);
    });
  });
};

// Deletes a client from the DB.
exports.destroy = function(req, res) {
  Client.findById(req.params.id, function (err, client) {
    if(err) { return handleError(res, err); }
    if(!client) { return res.status(404).send('Not Found'); }
    client.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
