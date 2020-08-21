const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    scores: { type: Array },
    total_score: { type: Number },
    visible_name: { type: String }
});

userSchema.statics.register = function (username, cb) {
    const regex = RegExp('^[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*$');
    if (!regex.test(username)) {
        return cb(false, 'Username not allowed.');
    }

    User.findOne({ username: username }, (err, user) => {
        if (user !== null) {
            cb(false);
        }
        else {
            var new_user = new User({
                username: username,
                scores: [],
                total_score: 0,
                visible_name: username
            });
            new_user.save(function (err) {
                if (!err) {
                    cb(true);
                } else {
                    console.log(err);
                    cb(false);
                }
            });
        }
    });
}

userSchema.statics.login = function (username, cb) {
    User.findOne({ username: username }, (err, user) => {
        if (!err && user) {
            console.log('Found user %s.', username);
            cb(true, user);
        } else {
            console.log('Failed to find user %s.', username);
            cb(false, null);
        }
    });
}

userSchema.statics.getVisibleNameFromUsername = async function (username) {
    try {
        const user = await User.findOne({ username: username });
        if (user) {
            return user.visible_name;
        } else {
            return null;
        }
    }
    catch (e) {
        return null;
    }
}

userSchema.statics.update_admin = function (body, cb) {
    if (body.username == null) {
        return cb(false);
    }

    User.findOne({ username: body.username }, (err, user) => {
        if (!err && user) {
            user.visible_name = body.visible_name == null ? user.visible_name : body.visible_name;
            user.scores = body.scores == null ? user.scores : body.scores;
            user.total_score = body.total_score == null ? user.total_score : body.total_score;
            user.save(err => {
                if (!err) {
                    cb(true);
                } else {
                    cb(false);
                }
            });
        } else {
            cb(false);
        }
    });
}

userSchema.statics.delete = function (username, cb) {
    User.findOneAndDelete({ username: username }, { useFindAndModify: false }, (err, doc) => {
        if (err) {
            return cb(false);
        } else {
            return cb(true);
        }
    });
}

userSchema.statics.getAll = function (cb) {
    User.find({}, (err, users) => {
        cb(users);
    });
}

userSchema.methods.setScore = function (index, score) {
    this.scores[index] = score;
    for (let i = 0; i < index; i++) {
        if(this.scores[i] == null) {
            this.scores[i] = 0;
        }        
    }
    this.scores = Array.from(this.scores);
    const new_total_score = this.scores.map(s => s == null ? 0 : s).reduce((a, b) => a + b, 0);
    const hasChanged = new_total_score != this.total_score;
    console.log('this total score ' + this.total_score);
    console.log('this new score ' + new_total_score);
    this.total_score = new_total_score;
    if (hasChanged) {
        console.log('i am trying to save');
        console.log(this.scores);
        this.markModified('scores'); // UGH I HATE MONGOOSE WHY DID NOTHING WORK UNTIL I ADDED THIS LINE!!!
        this.save()
            .catch(e => { setTimeout(() => this.save().catch(e => {}).then(), 5000) })
            .then(() => console.log('ye ive saved'));
    }
}

userSchema.methods.getScore = function () {
    return this.total_score;
}

module.exports = User = mongoose.model('User', userSchema, 'users');