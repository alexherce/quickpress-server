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
  let token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ success: false, message: 'No token provided.' });

  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(401).send({ success: false, message: 'Failed to authenticate token.' });

    users.getId(decoded.user_id, function(err, data) {
      if (err) {
        res.status(400).send({success: false, error: err});
      } else {
        res.status(200).send(data);
      }
    })
  });
}
