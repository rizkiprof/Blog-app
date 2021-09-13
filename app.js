const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

app.use(express.static('assets'));
app.use(express.urlencoded({ extended: false }));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'rizki',
  database: 'blog_app',
});

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  }),
);

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.username = 'Tamu';
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/list', (req, res) => {
  connection.query(
    'SELECT * FROM articles',
    (error, results) => {
      res.render('list.ejs', { articles: results });
    },
  );
});

app.get('/article/:id', (req, res) => {
  const { id } = req.params;
  connection.query(
    'SELECT * FROM articles WHERE id = ?',
    [id],
    (error, results) => {
      res.render('article.ejs', { article: results[0] });
    },
  );
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs', { errors: [] });
});

app.post('/signup',
  (req, res, next) => {
    const { username } = req.body;
    const { email } = req.body;
    const { password } = req.body;
    const errors = [];

    if (username === '') {
      errors.push('Nama Pengguna kosong');
    }
    if (email === '') {
      errors.push('Email kosong');
    }
    if (password === '') {
      errors.push('Kata Sandi kosong');
    }

    if (errors.length > 0) {
      res.render('signup.ejs', { errors });
    } else {
      next();
    }
  },
  (req, res, next) => {
    const { email } = req.body;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          errors.push('Gagal mendaftarkan pengguna');
          res.render('signup.ejs', { errors });
        } else {
          next();
        }
      },
    );
  },
  (req, res) => {
    const { username } = req.body;
    const { email } = req.body;
    const { password } = req.body;
    bcrypt.hash(password, 10, (error, hash) => {
      connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hash],
        (error, results) => {
          req.session.userId = results.insertId;
          req.session.username = username;
          res.redirect('/list');
        },
      );
    });
  });

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res) => {
  const { email } = req.body;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if (results.length > 0) {
        const plain = req.body.password;

        const hash = results[0].password;

        bcrypt.compare(plain, hash, (error, isEqual) => {
          if (isEqual) {
            req.session.userId = results[0].id;
            req.session.username = results[0].username;
            res.redirect('/list');
          } else {
            res.redirect('/login');
          }
        });
      } else {
        res.redirect('/login');
      }
    },
  );
});

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/list');
  });
});

app.listen(3000);
