const express = require('express');

const mysql = require('mysql');

const session = require('express-session');

const app = express();

app.use(express.static('assets'));
app.use(express.urlencoded({ extended: false }));

// data base property
const HOST_NAME = 'localhost';
const USER_NAME = 'root';
const PASSWORD_NAME = 'rizki';
const DATABASE_NAME = 'list_app';

const connection = mysql.createConnection({
  host: HOST_NAME,
  user: USER_NAME,
  password: PASSWORD_NAME,
  database: DATABASE_NAME,
});

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  }),
);

app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/list', (req, res) => {
  connection.query(
    'SELECT * from articles',
    (error, results) => {
      res.render('list.ejs', { articles: results });
    },
  );
});

app.get('/articles/:id', (req, res) => {
  const { id } = req.params;
  connection.query(
    'SELECT * from articles where id = ?',
    [id],
    (error, results) => {
      res.render('article.ejs', { articles: results[0] });
    },
  );
});

app.listen(3000);
