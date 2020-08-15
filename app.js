if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const User = require('./user');
const Question = require('./question');
const port = 3000;

const mongodb = mongoose.connect(process.env.MONGO_DB, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
    if (err) {
        console.log('Error connecting to MongoDB server.');
        console.log(err);
    } else {
        console.log('Connected to MongoDB server.');
    }
});

const initialisePassport = require('./passport-config');
initialisePassport(passport);

app.set('view-engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(require('body-parser').json());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', checkAuthenticated, (req, res) => {
    res.render(__dirname + '/www/index.ejs', {username: req.user.username});
});

app.use('/css', express.static(__dirname + '/www/css'));
app.use('/js', express.static(__dirname + '/www/js'));
app.use('/img', express.static(__dirname + '/www/img'));

app.use('/pages', checkAuthenticated, (req, res) => {
    res.render(__dirname + '/www/pages' + req.url + '.ejs', {username: req.user.username});
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    User.getAll((guests) => res.render(__dirname + '/www/login.ejs', {guests: guests}));
});

app.get('/secret_login', checkNotAuthenticated, (req, res) => {
    res.render(__dirname + '/www/secret_login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/secret_register', checkNotAuthenticated, (req, res) => {
    res.render(__dirname + '/www/register.ejs');
});

app.post('/secret_register', checkNotAuthenticated, (req, res) => {
    User.register(req.body.username, (success, err) => {
        if (success) {
            res.redirect('/secret_login');
        } else {
            res.send(err || 'Failed to create account.');
        }
    })
});

app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
});

app.get('/admin', checkAdmin, (req, res) => {
    User.getAll((guests) => res.render(__dirname + '/www/admin.ejs', {guests: guests, username: req.user.username}));
});

app.post('/admin/register', checkAdmin, (req, res) => {
    User.register(req.body.username, (success, err) => {
        if (success) {
            res.redirect('/admin');
        } else {
            res.send(err || 'Failed to create account.');
        }
    })
});

app.post('/admin/edit', checkAdmin, (req, res) => {
    User.update_admin(req.body, (success) => {
        if (success) {
            res.status(200).send();
        } else {
            res.status(500).send();
        }
    })
});

app.post('/admin/delete', checkAdmin, (req, res) => {
    User.delete(req.body.username, (success) => {
        if (success) {
            res.redirect('/admin');
        } else {
            res.send('Failed to delete user.');
        }
    })
});

app.get('/dashboard', checkAuthenticated, (req, res) => {
    Question.getAll(qs => res.render(__dirname + '/www/dashboard.ejs', {user: req.user, questions: qs, username: req.user.username}));
});

app.post('/dashboard/new_question', checkAuthenticated, (req, res) => {
    Question.newQuestion(req.body, (success, err) => {
        if (success) {
            res.redirect('/dashboard');
        } else {
            res.send(err || 'Failed to submit question.');
        }
    })
});

app.post('/dashboard/delete_question', checkAuthenticated, (req, res) => {
    // TODO check if the user who posted is the owner of the question.
    Question.delete(req.body.qid, (success) => {
        if (success) {
            res.redirect('/dashboard');
        } else {
            res.send('Failed to delete question.');
        }
    })
});

const server = app.listen(port, () => console.log(`Party quiz listening at http://localhost:${port}`));

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

function checkAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.username === 'admin') {
        return next();
    }
    res.redirect('/');
}

const quiz_backend = require('./quiz-backend');
quiz_backend(server);