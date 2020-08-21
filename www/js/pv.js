function widthChecker() {
    var qvt = document.getElementById('question_pv_textbox');
    if (qvt.value.trim() != '') {
        qvt.classList.add('filled');
    } else {
        qvt.classList.remove('filled');
    }
}

PV_QC = {
    nextPage: false,

    submit: function () {
        var answer = document.getElementById('question_pv_textbox').value;

        if (answer.trim() == '') {
            return;
        }

        QUESTION_CONTROLLER.onAnswerSubmit(answer);
        PV_QC.transition();
    },

    transition: function() {
        document.getElementById('pv_submit').style.display = 'none';
        document.getElementById('pv_vote').style.display = 'flex';
    },

    answers: {},

    toggleVote: function (user) {
        var voteBox = document.getElementById('pv_vote_' + user);
        var favSpan = voteBox.getElementsByClassName('material-icons')[0];
        var vote;
        if (favSpan.innerHTML == 'favorite') {
            vote = false;
            favSpan.innerHTML = 'favorite_border';
            PV_QC.updateVote(user, (PV_QC.answers[user].votes || 1) - 1);
        } else {
            vote = true;
            favSpan.innerHTML = 'favorite';
            PV_QC.updateVote(user, (PV_QC.answers[user].votes || 0) + 1);
        }
        QUESTION_CONTROLLER.sendPacket({
            action: 'VOTE',
            user: user,
            vote: vote,
            id: QUESTION_CONTROLLER.id
        });
    },

    updateVote: function (user, votes) {
        var voteBox = document.getElementById('pv_vote_' + user);
        voteBox.getElementsByTagName('span')[0].innerHTML = votes;
    }
};

QUESTION_CONTROLLER.onAnswerReceive = function (ans) {
    ans.forEach(a => {
        if (PV_QC.answers[a.user] == null) {
            PV_QC.answers[a.user] = {
                answer: a.answer,
                votes: a.votes
            }
        } else {
            PV_QC.answers[a.user].answer = a.answer;
            if (a.votes != PV_QC.answers[a.user].votes) {
                // TODO play CSS animation
            }
            PV_QC.answers[a.user].votes = a.votes;
        }

        if (PV_QC.answers[a.user].element == null) {
            PV_QC.answers[a.user].element = document.createElement('div');
            PV_QC.answers[a.user].element.classList.add('card');
            PV_QC.answers[a.user].element.classList.add('pv_submission');
            //PV_QC.answers[a.user].element.style.order = a.votes;
            PV_QC.answers[a.user].element.innerHTML = `
                <h3 class='pv_answer'>${a.answer}</h3>
                <small class='pv_user hidden'>${a.visible_name}</small>
                <div ${(a.user == window.top.QUIZ.username) ? '' : `onclick='PV_QC.toggleVote("${a.user}"); '`}id='pv_vote_${a.user}' class='pv_votes${(a.user == window.top.QUIZ.username) ? ' pv_disabled' : ''}'><i class='material-icons'>favorite_border</i><span>${a.votes}</span></div>
            `;
            document.getElementById('pv_vote').appendChild(PV_QC.answers[a.user].element);
        } else {
            PV_QC.answers[a.user].element.getElementsByClassName('pv_answer')[0].innerHTML = a.answer;
            PV_QC.answers[a.user].element.getElementsByTagName('span')[0].innerHTML = a.votes;
            //PV_QC.answers[a.user].element.style.order = a.votes;
        }
    });

    if (!PV_QC.nextPage) {
        if (ans.filter(a => a.user == window.top.QUIZ.username).length > 0) {
            PV_QC.transition();
        }
    }
};

QUESTION_CONTROLLER.onFinal = function () {
    Array.from(document.getElementsByClassName('pv_user')).forEach(e => e.classList.remove('hidden'));
};