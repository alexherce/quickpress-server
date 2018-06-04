const jwt = require('jsonwebtoken');
const config = require('../config');
const users = require('../models/users');

exports.signup = function(req, res) {
  users.create(req.body, function(err, data) {
    if (err) {
      res.status(400).send({success: false, error: err});
    } else {
      res.status(201).send({success: true, data: data});
    }
  })
}

exports.login = function(req, res) {
  users.login(req.body.username, req.body.password, function(err, data) {
    if (err) {
      res.status(401).send({success: false, error: err});
    } else {
      res.status(200).send(data);
    }
  })
}

exports.getMe = function(req, res) {
  users.getId(req.user_id, function(err, data) {
    if (err) {
      res.status(400).send({success: false, error: err});
    } else {
      res.status(200).send(data);
    }
  });
}
