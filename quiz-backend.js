const WebSocket = require('ws');
const User = require('./user');
const Preferences = require('./preferences');
const Question = require('./question');

const activeParticipants = [];
const visibleNameCache = {};

function init_quiz_backend(server) {
    const wss = new WebSocket.Server({ server });
    const pm = new PagesManager();

    wss.on('connection', function (ws) {
        const participant = new Participant(ws, pm);
        activeParticipants.push(participant);
        participant.onConnect();
        ws.on('error', (err) => participant.onError(err));
        ws.on('close', () => participant.onDisconnect());
        ws.on('message', (msg) => participant.onMessage(msg));
    });

    return pm;
}

class Participant {
    constructor(socket, pagesManager) {
        this.socket = socket;
        this.pagesManager = pagesManager;
        this.username = null;
        this.user = null;
    }

    onConnect() {
        console.log('Participant connected.');
    }

    onError(err) {
        console.log('Participant error: ' + err);
    }

    onDisconnect() {
        const index = activeParticipants.indexOf(this);
        activeParticipants.splice(index, 1);
        console.log(`Participant ${this.username} disconnected.`);
        Participant.sendToAll({
            action: 'EXIT',
            username: this.username
        });
    }

    onMessage(message) {
        console.log(message);

        let inputData;
        try { inputData = JSON.parse(message); }
        catch (e) {
            console.warn("Unable to parse input data: " + message);
            return;
        }

        switch (inputData.action) {
            case "PAGE_NEXT":
                if (this.username == "admin") {
                    this.onNextPage();
                }
                break;

            case "PAGE_PREV":
                if (this.username == "admin") {
                    this.onPrevPage();
                }
                break;

            case "LOGIN":
                this.username = inputData.username;
                // TODO this is big security flaw. Use id as verification?
                User.login(this.username, (success, user) => {
                    if (success) {
                        // Set user params.
                        this.user = user;

                        visibleNameCache[this.username] = this.user.visible_name;

                        // Tell user which pages are open.
                        this.send({
                            action: 'PAGE_RESET',
                            pages: this.pagesManager.getCurrentPages(),
                            index: this.pagesManager.getCurrentIndex(),
                            numQuestions: this.pagesManager.getCurrentLength()
                        });

                        // Tell everyone this user has entered.
                        Participant.sendToAll({
                            action: 'ENTER',
                            username: this.user.username,
                            visible_name: this.user.visible_name,
                            score: this.user.total_score
                        });

                        // Tell user what the current scores are.
                        Participant.sendScores();
                    }
                })
                break;

            case 'SUBMIT':
                this.pagesManager.onAnswerSubmit(inputData, this.username);
                break;

            case 'VOTE':
                this.pagesManager.onVote(inputData, this.username);
                break;
                
            case 'ADVANCE':
                this.pagesManager.onAdvance(inputData);
                break;

        }

    }

    static sendScores() {
        let curr_scores = {};
        activeParticipants.forEach(p => {
            if (p.user != null) {
                curr_scores[p.username] = p.user.getScore();
            }
        });
        Participant.sendToAll({
            action: "SCORES",
            scores: curr_scores,
            visibleNameCache: visibleNameCache
        });
    }

    onNextPage() {
        console.log('Moving to next page...');
        const hasNext = this.pagesManager.nextPage();
        if (hasNext) {
            Participant.sendToAll({
                action: 'PAGE_NEXT',
                pages: this.pagesManager.getCurrentPages(),
                index: this.pagesManager.getCurrentIndex(),
                numQuestions: this.pagesManager.getCurrentLength()
            });
        }
    }

    onPrevPage() {
        console.log('Moving to previous page...');
        const hasPrev = this.pagesManager.prevPage();
        if (hasPrev) {
            Participant.sendToAll({
                action: 'PAGE_PREV',
                pages: this.pagesManager.getCurrentPages(),
                index: this.pagesManager.getCurrentIndex(),
                numQuestions: this.pagesManager.getCurrentLength()
            });
        }
    }

    send(packet) {
        const packetString = JSON.stringify(packet);
        this.socket.send(packetString);
    }

    static sendToAll(packet) {
        activeParticipants.forEach(p => {
            p.send(packet);
        });
    }

}

class PagesManager {
    constructor() {
        this.loaded = false;
        this.loadedCb = () => { };
        Preferences.getPrefs().then(prefs => {
            this.data = prefs;
            this.loaded = true;
            this.loadedCb();
            this.callPageReset();
            this.createQuestionController(this.data.currentIndex == null ? 0 : this.data.currentIndex);
        }, e => console.log('An error occured ' + e));
        this.participants = [];
        this.questionControllers = [];
    }

    getCurrentIndex() {
        if (this.data != null && this.data.currentIndex != null) {
            return this.data.currentIndex + 1;
        } else {
            return 0;
        }
    }

    getCurrentLength() {
        if (this.data != null && this.data.questionOrder != null) {
            return this.data.questionOrder.length;
        } else {
            return 0;
        }
    }

    updatePreferences() {
        Preferences.setPrefs(this.data).then();
    }

    onAnswerSubmit(packet, username) {
        const theqc = this.questionControllers.find(qc => qc == null ? false : qc.id == packet.id);
        if (theqc != undefined) {
            theqc.onAnswerSubmit(packet.answer, username);
        }
    }

    onVote(packet, username) {
        const theqc = this.questionControllers.find(qc => qc == null ? false : qc.id == packet.id);
        if (theqc != undefined) {
            theqc.onVote(username, packet.user, packet.vote);
        }
    }

    onAdvance(packet) {
        const theqc = this.questionControllers.find(qc => qc == null ? false : qc.id == packet.id);
        if (theqc != undefined) {
            theqc.onAdvance();
        }
    }

    nextPage() {
        if (this.data.currentIndex < this.data.questionOrder.length - 1) {
            this.data.currentIndex++;
            this.updatePreferences();
            this.createQuestionController(this.data.currentIndex);
            return true;
        }
        return false;
    }

    prevPage() {
        if (this.data.currentIndex > 0) {
            this.data.currentIndex--;
            this.updatePreferences();
            this.createQuestionController(this.data.currentIndex);
            return true;
        }
        return false;
    }

    createQuestionController(index) {
        if (this.questionControllers[index] == null) {
            const path = this.data.questionOrder[index];
            if (path != null && path.startsWith('/question/')) {
                const id = path.replace('/question/', '');
                Question.getQuestion(id, (success, question) => {
                    if (question.type == 'mc') {
                        this.questionControllers[index] = new MCQuestionController(question, index);
                        this.questionControllers[index].onResume();
                    }
                    if (question.type == 'pv') {
                        this.questionControllers[index] = new PopularVoteQuestionController(question, index);
                        this.questionControllers[index].onResume();
                    }
                    // ADD OTHER QUESTION TYPES HERE.
                });
            }
        } else {
            this.questionControllers[index].onResume();
        }
    }

    callPageReset() {
        Participant.sendToAll({
            action: 'PAGE_RESET',
            pages: this.getCurrentPages(),
            index: this.getCurrentIndex(),
            numQuestions: this.getCurrentLength()
        });
    }

    getCurrentPages() {
        if (!this.loaded) {
            return ['/pages/blank', '/pages/blank', '/pages/blank'];
        }

        if (this.data.questionOrder == null) {
            this.data.currentIndex = 0;
            this.data.questionOrder = ['/pages/waiting', '/pages/blank', '/pages/blank'];
            return ['/pages/waiting', '/pages/blank', '/pages/blank'];
        }

        if (this.data.currentIndex == null) {
            this.data.currentIndex = 0;
        }

        this.createQuestionController(this.data.currentIndex == null ? 0 : this.data.currentIndex);

        let update_pages = [];
        update_pages[0] = this.data.currentIndex > 0 ? this.data.questionOrder[this.data.currentIndex - 1] : '/pages/blank';
        update_pages[1] = this.data.questionOrder[this.data.currentIndex];
        update_pages[2] = this.data.currentIndex < this.data.questionOrder.length - 1 ? this.data.questionOrder[this.data.currentIndex + 1] : '/pages/blank';

        return update_pages;
    }

    async reorderAllQuestions() {
        if (!this.loaded) {
            this.loadedCb = () => this.reorderAllQuestions();
            return;
        }

        this.resetScores();

        const allQuestions = await Question.getAllAsync();

        if (allQuestions.length == 0) {
            this.data.questionOrder = ['/pages/empty'];
            this.data.currentIndex = 0;
            this.updatePreferences();
            this.callPageReset();
            return;
        }

        this.shuffleArray(allQuestions);
        this.data.questionOrder = allQuestions.map(q => '/question/' + q._id);
        this.data.currentIndex = 0;
        this.updatePreferences();
        this.callPageReset();
        this.questionControllers = [];
        this.createQuestionController(this.data.currentIndex == null ? 0 : this.data.currentIndex);
    }
    
    async resetScores() {
        const users = await User.find({});
        users.forEach(user => {
            user.scores = [];
            user.total_score = 0;
            user.markModified('scores');
            user.markModified('total_score');
            user.save().then();
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    resetWaiting() {
        if (!this.loaded) {
            this.loadedCb = () => this.resetWaiting();
            return;
        }

        this.questionControllers = [];
        this.data.questionOrder = ['/pages/waiting'];
        this.data.currentIndex = 0;
        this.updatePreferences();
        this.callPageReset();
    }

    setRedirect() {
        if (!this.loaded) {
            this.loadedCb = () => this.resetWaiting();
            return;
        }

        this.questionControllers = [];
        this.data.questionOrder = ['/pages/redirect'];
        this.data.currentIndex = 0;
        this.updatePreferences();
        this.callPageReset();
    }
}


// This one stores the question answers. Then when admin presses next it updates all the scores and sends it back.
class MCQuestionController {
    constructor(question, index) {
        this.question = question;
        this.id = question._id;
        this.answer = question.data.answer;
        this.letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'];
        this.answer_numeric = this.answer == -1 ? undefined : this.letters[this.answer];
        this.participantAnswers = {};
        this.index = index;
        this.advanced = false;
    }

    onAnswerSubmit(answer, username) {
        this.participantAnswers[username] = answer;
        const allAnswered = activeParticipants.every(p => this.participantAnswers[p.username] != null);
        if (allAnswered) {
            this.onAdvance();
        }
    }

    onAdvance() {
        if (this.answer == -1) {
            this.answer_numeric = this.participantAnswers['admin'];
        }

        this.updateAllScores();
        Participant.sendToAll({
            action: 'QUESTION_TEMPLATE',
            secondary_action: 'ANSWER',
            answer: this.answer_numeric
        });
        this.advanced = true;
    }

    updateAllScores() {
        activeParticipants.forEach(p => {
            const ans = this.participantAnswers[p.username];
            if (ans != null) {
                if (this.answer != -1 || p.username != 'admin') {
                    p.user.setScore(this.index, ans == this.answer_numeric ? 4 : 0); // TODO set to number of options
                } else {
                    p.user.setScore(this.index, 0);
                }
            }
        });
        Participant.sendScores();
    }

    onResume() {
        activeParticipants.forEach(p => { this.onUserResume(p) });
    }

    onUserResume(p) {
        p.send({
            action: 'QUESTION_TEMPLATE',
            secondary_action: 'RESUME',
            selected_ans: this.participantAnswers[p.username],
            answer: this.advanced ? this.answer_numeric : null
        });
    }


}

// This stores responses and feeds them back and listens to votes. Then when admin says next it updates the scores.
class PopularVoteQuestionController {
    constructor(question, index) {
        this.question = question;
        this.id = question._id;
        this.participantAnswers = {};
        this.index = index;
        this.advanced = false;
        this.answerVotes = {};
        this.latestPassons = [];
        this.participantThumbs = {};
    }

    onAnswerSubmit(answer, username) {
        if (this.advanced) {
            activeParticipants[username].send(this.latestPassons);
            return;
        }
        this.participantAnswers[username] = answer;
        this.answerVotes[username] = {};
        this.updateClients();
    }

    onVote(username, ansPerson, vote) {
        if (this.advanced) {
            if (activeParticipants[username] != null) {
                activeParticipants[username].send(this.latestPassons);
            }
            return;
        }
        this.answerVotes[ansPerson][username] = vote;
        this.updateClients();
    }

    onAdvance() {
        this.advanced = true;
        this.updatePasson();
        Participant.sendToAll({
            action: 'QUESTION_TEMPLATE',
            secondary_action: 'ANSWER',
            answer: this.latestPassons,
            final: true
        });
        this.updateAllScores();
    }

    updatePasson() {
        this.latestPassons = [];
        for (const [key, val] of Object.entries(this.participantAnswers)) {
            let thumbsUp = 0;
            for (const [key2, val2] of Object.entries(this.answerVotes[key])) {
                if (val2) {
                    thumbsUp++;
                }
            }
            this.participantThumbs[key] = thumbsUp;
            this.latestPassons.push({
                user: key,
                answer: val,
                votes: thumbsUp,
                visible_name: visibleNameCache[key]
            });
        }
    }

    updateClients() {
        console.log('UPDATING CLIENTS');
        console.log(this.participantAnswers);
        this.updatePasson();
        Participant.sendToAll({
            action: 'QUESTION_TEMPLATE',
            secondary_action: 'ANSWER',
            answer: this.latestPassons,
            final: false
        });
    }

    updateAllScores() {
        const totalScores = this.latestPassons.map(e => e.votes).reduce((a, b) => a + b, 0);

        let curr_scores = {};
        activeParticipants.forEach(p => {
            let points = this.participantThumbs[p.username] || 0;
            points = Math.ceil(points / totalScores * Object.keys(this.participantAnswers).length);
            p.user.setScore(this.index, points);
        });

        Participant.sendScores();
    }

    onResume() {
        activeParticipants.forEach(p => { this.onUserResume(p) });
    }

    onUserResume(p) {
        p.send({
            action: 'QUESTION_TEMPLATE',
            secondary_action: 'ANSWER',
            answer: this.latestPassons,
            final: false
        });
    }
}

module.exports = init_quiz_backend;