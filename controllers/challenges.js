const jwt = require('jsonwebtoken');
const config = require('../config');
const challenges = require('../models/challenges');

function startChallenge(socket, room, challengeId) {
  let countdown = 60;
  let interval = setInterval(function() {
    if(countdown == 0) {
      clearInterval(interval);

      challenges.start(challengeId, function(err, dataUpdate) {
        if (err) return res.status(400).send({success: false, error: err});

        socket.of('/live').in(room).emit('quickpress-challenge', { enabled: true, countdown: countdown });
      });
    } else {
      socket.of('/live').in(room).emit('quickpress-challenge', { enabled: false, countdown: countdown });
      countdown--;
    }
  }, 1000);
}

exports.create = function(req, res) {
  challenges.create(req.body, req.user_id, function(err, data) {
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

exports.start = function(req, res) {
  challenges.get(req.body.challenge_id, function(err, data) {
    if (err) {
      res.status(400).send({success: false, error: err});
    } else {
      if (data.owner != req.user_id) return res.status(401).send({success: false, error: 'No puedes empezar un challenge que no es tuyo'});
      if (data.started) return res.status(400).send({success: false, error: 'El challenge ya había empezado'});

      startChallenge(req.io, 'challenge-' + data.id, req.body.challenge_id);
      res.status(200).send({success: true});
    }
  });
}

exports.press = function(challenge_id, user_id, done) {
  challenges.get(challenge_id, function(err, data) {
    if (err) return done(err);
    if (!data.started) return done('Challenge no ha empezado');

    challenges.press(challenge_id, user_id, function(errPress, dataPress) {
      if (errPress) return done(errPress);

      return done(null, dataPress);
    });
  });
}

exports.participated = function(req, res) {
  challenges.participated(req.params.challengeId, req.user_id, function(err, data) {
    if (err) {
      res.status(400).send({success: false});
    } else {
      res.status(200).send({success: true});
    }
  });
}
