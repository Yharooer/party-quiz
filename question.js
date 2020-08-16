const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    author: {type: String},
    type: {type: String},
    data: {type: mongoose.Mixed}  
});

questionSchema.statics.newQuestion = function (data, cb) {
    // TODO this is problematic if two people create questions at the same time.
    Question.getAll(questions => {
        var new_question = new Question({
            author: data.author,
            type: data.type,
            data: data
        });
    
        new_question.save(function (err) {
            if (!err) {
                cb(true);
            } else {
                console.log(err);
                cb(false);
            }
        });
    });
}

questionSchema.statics.getQuestion = function(id, cb) {
    Question.findOne({_id: id}, (err,question) => {
        if (!err && question) {
            cb(true, question);
        } else {
            cb(false, null);
        }
    });
}

questionSchema.statics.update = function(body, cb) {
    if (body.id == null) {
        return cb(false);
    }

    Question.findOne({_id: body.id}, (err, question) => {
        if (!err && question) {
            if (body.author != null) {
                question.author = body.author;
            }

            if (body.type != null) {
                question.type = body.type;
            }

            question.data = body.data;

            question.save(err => {
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

questionSchema.statics.delete = async function(id, cb) {
    Question.findOneAndDelete({_id: id}, { useFindAndModify: false }, (err, doc) => {
        if (err) {
            return cb(false);
        } else{
            Question.getAll(questions => questions.forEach(q => {
                if (q.order > order) {
                    q.order -= 1;
                    q.save();
                }
            }));
            return cb(true);
        }
    });
}

questionSchema.statics.getAll = function(cb) {
    Question.find({}, (err, questions) => {
        cb(questions);
    });
}

questionSchema.statics.getAllAsync = async function() {
    return Question.find({});
}

questionSchema.statics.getAllByAuthor = function(author,cb) {
    Question.find({author: author}, (err, questions) => {
        cb(questions);
    });
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
} 

module.exports = Question = mongoose.model('Question', questionSchema, 'questions');