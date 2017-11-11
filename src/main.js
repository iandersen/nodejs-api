const express = require('express');
const app = express();
const basicauth = require('basicauth-middleware');

import BookController from './controller/bookController';

//These routes are unprotected
app.get('/api/books/*', (req, res) => res.send(BookController.get(req, res)));
app.get('/api/books', (req, res) => res.send(BookController.index(req, res)));

app.use(basicauth('myName', '12345'));
//These routes are protected with the password "12345" and the username "myName");
app.post('/api/books', (req, res) => res.send(BookController.create(req, res)));
app.patch('/api/books/*', (req, res) => res.send(BookController.update(req, res)));
app.delete('/api/books/*', (req, res) => res.send(BookController.delete(req, res)));

app.listen(8080, () => console.log('Listening on port 8080'));
