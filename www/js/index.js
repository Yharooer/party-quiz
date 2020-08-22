var QUIZ = {
    sendServer: function (data) {
        console.log(data);
        QUIZ.socket.send(JSON.stringify(data));
    },

    onMessage: function (message) {
        console.log(message.data);
        var inputData;
        try { inputData = JSON.parse(message.data); }
        catch (e) {
            console.warn("Unable to parse input data: " + message.data);
            return;
        }

        switch (inputData.action) {
            case "PAGE_NEXT":
                QUIZ.frame_active = (QUIZ.frame_active + 1 + 3) % 3;
                QUIZ.swapFrames();
                QUIZ.updateFrames(inputData.pages);
                QUIZ.updateCounter(inputData.index, inputData.numQuestions);
                break;
            case "PAGE_PREV":
                QUIZ.frame_active = (QUIZ.frame_active - 1 + 3) % 3;
                QUIZ.swapFrames();
                QUIZ.updateFrames(inputData.pages);
                QUIZ.updateCounter(inputData.index, inputData.numQuestions);
                break;
            case "PAGE_RESET":
                QUIZ.swapFrames();
                QUIZ.updateFrames(inputData.pages);
                QUIZ.updateCounter(inputData.index, inputData.numQuestions);
                break;
            case 'QUESTION_TEMPLATE':
                try {
                    QUIZ.iframes[QUIZ.frame_active].contentWindow.QUESTION_CONTROLLER.onSecondaryMessage(inputData);
                } catch {
                    setTimeout(function () {
                        QUIZ.onMessage(message);
                    }, 500);
                }
                break;
            case 'SCORES':
                QUIZ.onScore(inputData.scores, inputData.visibleNameCache);
                break;
            case 'ENTER':
                // TODO
                break;
            case 'EXIT':
                QUIZ.onExit(inputData.username)
                break;
        }

    },

    onExit: function (username) {
        if (QUIZ.scores[username] != null) {
            if (QUIZ.scores[username].element != null) {
                document.getElementById('leaderboard').removeChild(QUIZ.scores[username].element);
            }
            delete QUIZ.scores[username];
            if (QUIZ.lastScore != null) {
                delete QUIZ.lastScore[username];
            }
        }
        if (QUIZ.lastScore != null && QUIZ.vncache != null) {
            QUIZ.onScore(QUIZ.lastScore, QUIZ.vncache);
        }
    },

    updateCounter: function(index, total) {
        document.getElementById('question_numbering').innerHTML = 'Question ' + index + '/' + total;  
    },

    swapFrames: function () {
        QUIZ.iframes.forEach(ifr => ifr.style.display = 'none');
        QUIZ.iframes[QUIZ.frame_active].style.display = 'block';
    },

    updateFrames: function (pages) {
        var current_frame = QUIZ.iframes[QUIZ.frame_active];
        var prev_frame = QUIZ.iframes[(QUIZ.frame_active - 1 + 3) % 3];
        var next_frame = QUIZ.iframes[(QUIZ.frame_active + 1 + 3) % 3];

        if (new URL(current_frame.src).pathname != pages[1]) {
            current_frame.src = pages[1];
        }

        if (new URL(prev_frame.src).pathname != pages[0]) {
            prev_frame.src = pages[0];
        }

        if (new URL(next_frame.src).pathname != pages[2]) {
            next_frame.src = pages[2];
        }
    },

    createSocket: function () {
        QUIZ.socket = new WebSocket(location.origin.replace(/^http/, 'ws'));

        QUIZ.socket.onopen = () => {
            const rq = {
                action: "LOGIN",
                username: QUIZ.username
            };
            QUIZ.sendServer(rq);
        };

        QUIZ.socket.onmessage = (message) => { QUIZ.onMessage(message) };

        QUIZ.socket.onclose = e => {
            QUIZ.createSocket();
        }
    },

    scores: {},

    nth: function (n) {
        return n + (["st", "nd", "rd"][((n + 90) % 100 - 10) % 10 - 1] || "th");
    },

    onScore: function (scores, vncache) {
        QUIZ.lastScore = scores;
        QUIZ.vncache = vncache;

        var poop = Object.keys(scores).sort((u,v) => scores[v]-scores[u])
        console.log(poop);
        poop.forEach((u, i) => {
            if (QUIZ.scores[u] == null) {
                var scoreElement = document.createElement('div');
                scoreElement.classList.add('card');
                scoreElement.classList.add('score_box');
                scoreElement.innerHTML = `
                    <span class='score_rank'>${QUIZ.nth(i + 1)}</span>
                    <h3 class='score_person'>${vncache[u] || u}</h3>
                    <span class='score_points'>${scores[u]} point${(scores[u] != 1) ? 's' : ''}</span>
                `;
                scoreElement.style.order = i;
                document.getElementById('leaderboard').appendChild(scoreElement);
                QUIZ.scores[u] = {
                    element: scoreElement
                }
            } else {
                console.log(u);
                var scoreElement = QUIZ.scores[u].element;
                scoreElement.getElementsByClassName('score_rank')[0].innerHTML = QUIZ.nth(i + 1);
                scoreElement.getElementsByClassName('score_points')[0].innerHTML = scores[u] + ' point' + (scores[u] != 1 ? 's' : '');
                scoreElement.style.order = i;
            }
        });
    }
};

window.addEventListener('load', function () {
    QUIZ.iframes = [];
    QUIZ.iframes.push(document.getElementById('iframe1'));
    QUIZ.iframes.push(document.getElementById('iframe2'));
    QUIZ.iframes.push(document.getElementById('iframe3'));

    QUIZ.frame_active = 0;
    QUIZ.swapFrames();

    QUIZ.createSocket();

    if (QUIZ.username == "admin") {
        last_page_button = document.getElementById('last_page');
        next_page_button = document.getElementById('next_page');

        last_page_button.onclick = function () {
            const rq = {
                action: "PAGE_PREV"
            };
            QUIZ.sendServer(rq);
        }

        next_page_button.onclick = function () {
            const rq = {
                action: "PAGE_NEXT"
            };
            QUIZ.sendServer(rq);
        }
    }

});