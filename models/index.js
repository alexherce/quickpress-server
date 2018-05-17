const mysql = require('mysql');
const async = require('async');

// MySQL SETUP

exports.MODE_PRODUCTION = 'mode_production'

var state = {
  pool: null,
  mode: null,
}

// Configure this settings:
var PRODUCTION_DB = 'quickpress'

exports.connect = function(mode, done) {
  if (mode === exports.MODE_PRODUCTION) {
    state.pool = mysql.createPoolCluster()

    state.pool.add('WRITE', {
      host: '35.196.92.58',
      user: 'usr',
      password: 'CKWtvtvT5JzVmboD',
      database: PRODUCTION_DB
    })

    state.pool.add('READ1', {
      host: '35.196.92.58',
      user: 'usr2',
      password: '6Yvk5BI7P4G45NqI',
      database: PRODUCTION_DB
    })
  }

  state.mode = mode
  done()
}

exports.READ = 'read'
exports.WRITE = 'write'

// Get connections
// Remember to always use connection.release() after queries
exports.get = function(type, done) {
  var pool = state.pool;
  if (!pool) return done(new Error('Missing database connection.'));

  if (type === exports.WRITE) {
    state.pool.getConnection('WRITE', function (err, connection) {
      if (err) return done(err);
      done(null, connection);
    });
  } else {
    state.pool.getConnection('READ*', function (err, connection) {
      if (err) return done(err);
      done(null, connection);
    });
  }
}
