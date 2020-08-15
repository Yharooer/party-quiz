const LocalStrategy = require('passport-local').Strategy;
const User = require('./user');

function initialise(passport) {
    const authenticateUser = async (name, password, done) => {
        User.login(name, (success, user) => {
            if (success) {
                console.log('Logged in %s.', user.username);
                done(null, user);
            } else {
                done(null, false, {message: 'Failed to login.'});
            }
        });
    }
    passport.use(new LocalStrategy({ usernameField: 'username', passwordField: 'username' }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser((id, done) => User.findById(id, (err, user) => done(null, user)));
}

module.exports = initialise;