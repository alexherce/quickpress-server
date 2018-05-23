const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const db = require('./index.js');
const saltRounds = 10;

function abort(connection, done, error) {
  connection.release();
  done(error);
}

exports.create = function(params, done) {

  let values = [];

  if (params.username && !validator.isEmpty(params.username)) {
    if (!validator.isAlphanumeric(params.username)) return done('El usuario debe ser alfanumerico');
    if (!validator.isLength(params.username, {min: 4, max: 24})) return done('El usuario debe tener entre 4 y 24 caracteres');
    values.push(params.username);
  } else {
    return done('Parámetro requerido: usuario');
  }

  if (params.email && !validator.isEmpty(params.email)) {
    if (!validator.isEmail(params.email)) return done('El email no es válido');
    values.push(validator.normalizeEmail(params.email));
  } else {
    return done('Parámetro requerido: email');
  }

  if (params.password && !validator.isEmpty(params.password)) {
    if (!validator.isLength(params.password, {min: 8, max: 50})) return done('La contraseña debe tener entre 8 y 50 caracteres');
    if (validator.isLowercase(params.password)) return done('La contraseña debe tener al menos una mayúscula');
    if (validator.isUppercase(params.password)) return done('La contraseña debe tener al menos una minúscula');
    if (validator.isAlpha(params.password)) return done('La contraseña debe tener numeros y/o símbolos (_, -, ., /, ?)');
  } else {
    return done('Parámetro requerido: contraseña');
  }

  if (params.password_verify && !validator.isEmpty(params.password_verify)) {
    if (!validator.equals(params.password_verify, params.password)) return done('Las contraseñas no coinciden');
    values.push(bcrypt.hashSync(params.password, saltRounds));
  } else {
    return done('Parámetro requerido: contraseña');
  }

  if (params.name && !validator.isEmpty(params.name)) {
    if (!validator.isAlpha(params.name)) return done('El nombre debe contener solo letras');
    if (!validator.isLength(params.name, {min: 2, max: 32})) return done('El nombre debe tener entre 2 y 32 caracteres');
    values.push(params.name[0].toUpperCase() + params.name.slice(1).toLowerCase());
  } else {
    return done('Parámetro requerido: nombre');
  }

  if (params.second_name && !validator.isEmpty(params.second_name)) {
    if (!validator.isAlpha(params.second_name)) return done('El segundo nombre debe contener solo letras');
    if (!validator.isLength(params.second_name, {min: 2, max: 32})) return done('El segundo nombre debe tener entre 2 y 32 caracteres');
    values.push(params.second_name[0].toUpperCase() + params.second_name.slice(1).toLowerCase());
  } else {
    values.push("");
  }

  if (params.first_last_name && !validator.isEmpty(params.first_last_name)) {
    if (!validator.isAlpha(params.first_last_name)) return done('El apellido debe contener solo letras');
    if (!validator.isLength(params.first_last_name, {min: 2, max: 32})) return done('El apellido debe tener entre 2 y 32 caracteres');
    values.push(params.first_last_name[0].toUpperCase() + params.first_last_name.slice(1).toLowerCase());
  } else {
    return done('Parámetro requerido: apellido');
  }

  if (params.second_last_name && !validator.isEmpty(params.second_last_name)) {
    if (!validator.isAlpha(params.second_last_name)) return done('El segundo apellido debe contener solo letras');
    if (!validator.isLength(params.second_last_name, {min: 2, max: 32})) return done('El segundo apellido debe tener entre 2 y 32 caracteres');
    values.push(params.second_last_name[0].toUpperCase() + params.second_last_name.slice(1).toLowerCase());
  } else {
    values.push("");
  }

  if (params.birth_day && !validator.isEmpty(params.birth_day)) {
    if (!validator.isInt(params.birth_day, { min: 1, max: 31, allow_leading_zeroes: true })) return done('El día de nacimiento debe ser un número entre 1 y 31');
    values.push(validator.toInt(params.birth_day));
  } else {
    return done('Parámetro requerido: día de nacimiento');
  }

  if (params.birth_month && !validator.isEmpty(params.birth_month)) {
    if (!validator.isInt(params.birth_month, { min: 1, max: 12, allow_leading_zeroes: true })) return done('El mes de nacimiento debe ser un número entre 1 y 12');
    values.push(validator.toInt(params.birth_month));
  } else {
    return done('Parámetro requerido: mes de nacimiento');
  }

  if (params.birth_year && !validator.isEmpty(params.birth_year)) {
    let current_year = (new Date()).getFullYear();
    if (!validator.isInt(params.birth_year, { min: 1900, max: current_year, allow_leading_zeroes: false })) return done('El año de nacimiento debe ser un año válido');
    if ((current_year - params.birth_year) < 18) return done('Lo sentimos, solo usuarios mayores de 18 pueden usar la aplicación');
    values.push(validator.toInt(params.birth_year));
  } else {
    return done('Parámetro requerido: año de nacimiento');
  }

  if (params.mobile_phone && !validator.isEmpty(params.mobile_phone)) {
    if (!validator.isLength(params.mobile_phone, {min: 10, max: 10})) return done('El celular debe tener entre 10 números y no debe incluir código de país');
    if (!validator.isInt(params.mobile_phone, { min: 1111111111, max: 9999999999, allow_leading_zeroes: false })) return done('El celular debe ser válido');
    values.push(params.mobile_phone);
  } else {
    return done('Parámetro requerido: celular');
  }

  db.get(db.WRITE, function(err, connection) {
    if (err) return abort(connection, done, err);

    connection.query("INSERT INTO users (username, email, password, name, second_name, first_last_name, second_last_name, birth_day, birth_month, birth_year, mobile_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values, function (err, result) {
      connection.release();
      if (err && err.code == 'ER_DUP_ENTRY') {
        return done("El usuario o email ya están registrados");
      } else if (err) {
        return done(err);
      }
      if (!result) return done('Signup Failed');
      return done(null, result.insertId);
    });
  });
};

exports.login = function(username, password, done) {

  let values = [];

  if (username && !validator.isEmpty(username)) {
    if (!validator.isLength(username, {min: 4, max: 24})) return done('El usuario debe tener entre 4 y 24 caracteres');
    values.push(username);
  } else {
    return done('Parámetro requerido: usuario');
  }

  if (password && !validator.isEmpty(password)) {
    if (!validator.isLength(password, {min: 8, max: 50})) return done('La contraseña debe tener entre 8 y 50 caracteres');
  } else {
    return done('Parámetro requerido: contraseña');
  }

  db.get(db.WRITE, function(err, connection) {
    if (err) return abort(connection, done, err);

    connection.query("SELECT user_id, username, email, mobile_phone, name, first_last_name, password FROM users WHERE username = ?", values, function (err, result) {
      connection.release();
      if (err) return done(err);

      if(result.length == 1) {
        // Compare hashed password
        bcrypt.compare(password, result[0].password).then(function(matches) {
          if (matches) {

            let token = jwt.sign({
              user_id: result[0].user_id,
              username: result[0].username,
              email: result[0].email,
              login_timestamp: Date.now()
            },
            config.secret,
            {
              expiresIn: 86400 // expires in 24 hours
            });

            return done(null, {
              success: true,
              username: result[0].username,
              email: result[0].email,
              mobile_phone: result[0].mobile_phone,
              name: result[0].name,
              first_last_name: result[0].first_last_name,
              token: token
            });
          } else {
            return done("Contraseña incorrecta.");
          }
        });
      } else {
        return done("Usuario no encontrado.");
      }
    });
  });
}

exports.getId = function(userId, done) {
  if (userId) {
    db.get(db.WRITE, function(err, connection) {
      if (err) return abort(connection, done, err);

      connection.query("SELECT user_id, username, email, mobile_phone, name, second_name, first_last_name, second_last_name FROM users WHERE user_id = ?", [userId], function (err, result) {
        connection.release();
        if (err) return done(err);

        if(result.length == 1) {
          return done(null, {
            success: true,
            user_id: result[0].user_id,
            username: result[0].username,
            email: result[0].email,
            mobile_phone: result[0].mobile_phone,
            name: result[0].name,
            second_name: result[0].second_name,
            first_last_name: result[0].first_last_name,
            second_last_name: result[0].second_last_name
          });
        } else {
          return done("Usuario no encontrado.");
        }
      });
    });
  } else {
    return done("Falta parámetro: user id.");
  }
}
