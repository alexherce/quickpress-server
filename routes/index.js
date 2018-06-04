const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config');

const usersController = require('../controllers/users');
const challengesController = require('../controllers/challenges');

function verifyToken(req, res, next) {
  // Get token from request headers
  let token = req.headers['x-access-token'];
  if (!token || typeof token == 'undefined') return res.status(401).send({ success: false, message: 'No se mandó el Access Token.' });

  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(401).send({ success: false, message: 'Error al autenticar el usuario.', details: err });

    // Add user info to request
    req.user_id = decoded.user_id;
    req.username = decoded.username;
    req.email = decoded.email;
    next();
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* USERS */
router.post('/v1/users/signup', function(req, res, next) {
  usersController.signup(req, res);
});

router.post('/v1/users/login', function(req, res, next) {
  usersController.login(req, res);
});

router.get('/v1/users/me', verifyToken, function(req, res, next) {
  usersController.getMe(req, res);
});

/* CHALLENGES */
router.post('/v1/challenges/create', verifyToken, function(req, res, next) {
  challengesController.create(req, res);
});

router.get('/v1/challenges/get/:challengeId', verifyToken, function(req, res, next) {
  challengesController.get(req, res);
});

router.get('/v1/challenges/list', verifyToken, function(req, res, next) {
  challengesController.list(req, res);
});

router.post('/v1/challenges/subscribe', verifyToken, function(req, res, next) {
  challengesController.subscribe(req, res);
});

router.post('/v1/challenges/unsubscribe', verifyToken, function(req, res, next) {
  challengesController.unsubscribe(req, res);
});

module.exports = router;
