const jwt = require('jsonwebtoken');
const config = require('../config');
const challenges = require('../models/challenges');

exports.create = function(req, res) {
  challenges.create(req.body, function(err, data) {
    if (err) {
      res.status(400).send({success: false, error: err});
    } else {
      res.status(201).send({success: true, data: data});
    }
  });
}

exports.get = function(req, res) {
  challenges.get(req.params.challengeId, function(err, data) {
    if (err) {
      res.status(400).send({success: false, error: err});
    } else {
      res.status(200).send({success: true, challenge: data});
    }
  });
}

exports.list = function(req, res) {
  challenges.list(req.user_id, function(err, data) {
    if (err) {
      res.status(400).send({success: false, error: err});
    } else {
      res.status(200).send({success: true, challenges: data});
    }
  });
}

exports.subscribe = function(req, res) {
  challenges.subscribe(req.user_id, req.body.code, function(err, data) {
    if (err) {
      res.status(400).send({success: false, error: err});
    } else {
      res.status(201).send({success: true, subscribed: data});
    }
  });
}

exports.unsubscribe = function(req, res) {
  challenges.unsubscribe(req.user_id, req.body.challenge_id, function(err, data) {
    if (err) {
      res.status(400).send({success: false, error: err});
    } else {
      res.status(200).send({success: true, unsubscribed: data});
    }
  });
}
