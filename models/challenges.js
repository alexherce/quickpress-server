const validator = require('validator');

const db = require('./index.js');

function abort(connection, done, error) {
  connection.release();
  done(error);
}

exports.create = function(params, userId, done) {
  let values = [];

  if (params.name && !validator.isEmpty(params.name)) {
    if (!validator.isLength(params.name, {min: 5, max: 50})) return done('El nombre debe tener entre 5 y 50 caracteres');
    values.push(params.name);
  } else {
    return done('Parámetro requerido: nombre');
  }

  if (params.description && !validator.isEmpty(params.description)) {
    if (!validator.isLength(params.description, {min: 5, max: 200})) return done('La descripción debe tener entre 5 y 200 caracteres');
    values.push(params.description);
  } else {
    return done('Parámetro requerido: descripción');
  }

  if (params.code && !validator.isEmpty(params.code)) {
    if (!validator.isLength(params.code, {min: 4, max: 4})) return done('El código debe ser de 4 digitos');
    if (!validator.isInt(params.code, { min: 0001, max: 9999, allow_leading_zeroes: true })) return done('El código debe ser un número válido de 4 digitos');
    values.push(params.code);
  } else {
    return done('Parámetro requerido: código');
  }

  if (params.start_date && !validator.isEmpty(params.start_date)) {
    values.push(validator.toDate(params.start_date));
  } else {
    return done('Parámetro requerido: fecha de inicio');
  }

  values.push(userId);

  db.get(db.WRITE, function(err, connection) {
    if (err) return abort(connection, done, err);

    connection.query("INSERT INTO challenges (name, description, code, start_date, owner) VALUES (?, ?, ?, ?, ?)", values, function (err, result) {
      connection.release();
      if (err && err.code == 'ER_DUP_ENTRY') {
        return done("Ya existe un challenge con ese código");
      } else if (err) {
        return done(err);
      }
      if (!result) return done('Error creando challenge. Intente de nuevo.');
      return done(null, result.insertId);
    });
  });
};

exports.list = function(userId, done) {
  if (userId) {
    db.get(db.READ, function(err, connection) {
      if (err) return abort(connection, done, err);

      connection.query("SELECT c.id, c.name, c.description, c.code, c.start_date FROM challenges AS c INNER JOIN challenges_subscriptions AS s ON s.challenge_id = c.id WHERE s.user_id = ?", [userId], function (err, result) {
        connection.release();
        if (err) return done(err);
        return done(null, result);
      });
    });
  } else {
    return done("Falta parámetro: ID de usuario.");
  }
}

exports.get = function(challengeId, done) {
  if (challengeId) {
    db.get(db.READ, function(err, connection) {
      if (err) return abort(connection, done, err);

      connection.query("SELECT * FROM challenges WHERE id = ?", [challengeId], function (err, result) {
        connection.release();
        if (err) return done(err);
        if(result.length == 1) {
          return done(null, result[0]);
        } else {
          return done("No se encontró el challenge.");
        }
      });
    });
  } else {
    return done("Falta parámetro: ID del challenge.");
  }
}

exports.subscribe = function(userId, challengeCode, done) {
  if(userId && challengeCode) {
    db.get(db.READ, function(err, connection) {
      if (err) return abort(connection, done, err);

      connection.query("SELECT id FROM challenges WHERE code = ?", [challengeCode], function (err, result) {
        connection.release();
        if (err) return done(err);

        if(result.length == 1) {
          db.get(db.WRITE, function(err, connection) {
            if (err) return abort(connection, done, err);

            connection.query("INSERT INTO challenges_subscriptions (user_id, challenge_id) VALUES (?, ?)", [userId, result[0].id], function (err, result) {
              connection.release();
              if (err && err.code == 'ER_DUP_ENTRY') {
                return done("Ya estás suscrito a este challenge");
              } else if (err) {
                return done(err);
              }
              return done(null, result.insertId);
            });
          });
        } else {
          return done("No se encontró el challenge con código " + challengeCode);
        }
      });
    });
  } else {
    return done("Falta parámetro: ID de usuario y código del challenge.");
  }
}

exports.unsubscribe = function(userId, challengeId, done) {
  if(userId && challengeId) {
    db.get(db.READ, function(err, connection) {
      if (err) return abort(connection, done, err);

      connection.query("DELETE FROM challenges_subscriptions WHERE user_id = ? AND challenge_id = ?", [userId, challengeId], function (err, result) {
        connection.release();
        if (err) return done(err);
        if(result.affectedRows > 0) {
          return done(null, result.affectedRows);
        } else {
          return done("No se encontró la suscripción al challenge");
        }
      });
    });
  } else {
    return done("Falta parámetro: ID de usuario y ID del challenge.");
  }
}

exports.start = function(challengeId, done) {
  if(challengeId) {
    let timestamp =  new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.get(db.WRITE, function(err, connection) {
      if (err) return abort(connection, done, err);

      connection.query("UPDATE challenges SET started = ?, started_timestamp = ? WHERE id = ?", [true, timestamp, challengeId], function (err, result) {
        connection.release();
        if (err) return done(err);
        if(result.affectedRows > 0) {
          return done(null, result.affectedRows);
        } else {
          return done("No se encontró el challenge");
        }
      });
    });
  } else {
    return done("Falta parámetro: ID del challenge.");
  }
}

exports.press = function(challengeId, userId, done) {
  if (challengeId && userId) {
    db.get(db.WRITE, function(err, connection) {
      if (err) return abort(connection, done, err);

      connection.query("INSERT INTO challenges_participations (challenge_id, user_id) VALUES (?, ?)", [challengeId, userId], function (err, result) {
        connection.release();
        if (err && err.code == 'ER_DUP_ENTRY') {
          return done("Ya participaste en este challenge");
        } else if (err) {
          return done(err);
        }
        if (!result) return done('Error. Intente de nuevo.');
        return done(null, result.insertId);
      });
    });
  } else {
    return done("Falta parámetro: ID del challenge.");
  }
}

exports.participated = function(challengeId, userId, done) {
  if (challengeId && userId) {
    db.get(db.READ, function(err, connection) {
      if (err) return abort(connection, done, err);

      connection.query("SELECT id FROM challenges_participations WHERE challenge_id = ? AND user_id = ?", [challengeId, userId], function (err, result) {
        connection.release();
        if (err) return done(err);
        if(result.length == 1) {
          return done(null, result[0]);
        } else {
          return done("No se encontró el challenge.");
        }
      });
    });
  } else {
    return done("Falta parámetro: ID del challenge.");
  }
}
