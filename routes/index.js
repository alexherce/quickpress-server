var express = require('express');
var router = express.Router();

const userController = require('../controllers/users');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/v1/users/signup', function(req, res, next) {
  userController.signup(req, res);
});

router.post('/v1/users/login', function(req, res, next) {
  userController.login(req, res);
});

module.exports = router;
