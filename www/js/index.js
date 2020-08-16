var QUIZ = {
    sendServer: function(data) {
        console.log(data);
        QUIZ.socket.send(JSON.stringify(data));
    },

    onMessage: function(message) {
        console.log(message.data);
        var inputData;
        try { inputData = JSON.parse(message.data); }
        catch(e) {
            console.warn("Unable to parse input data: " + message.data);
            return;
        }
        
        switch(inputData.action) {
            case "PAGE_NEXT":
                QUIZ.frame_active = (QUIZ.frame_active + 1 +3) % 3;
                QUIZ.swapFrames();
                QUIZ.updateFrames(inputData.pages);
                break;
            case "PAGE_PREV":
                QUIZ.frame_active = (QUIZ.frame_active - 1 +3) % 3;
                QUIZ.swapFrames();
                QUIZ.updateFrames(inputData.pages);
                break;
            case "PAGE_RESET":
                QUIZ.swapFrames();
                QUIZ.updateFrames(inputData.pages);
                break;
            case 'QUESTION_TEMPLATE':
                QUIZ.iframes[QUIZ.frame_active].contentWindow.QUESTION_CONTROLLER.onSecondaryMessage(inputData);
                break;
            case 'SCORES':
                // TODO
                break;
            case 'ENTER':
                // TODO
                break;
            case 'EXIT':
                // TODO
                break;
        }
        
    },

    swapFrames: function() {
        QUIZ.iframes.forEach(ifr => ifr.style.display = 'none');
        QUIZ.iframes[QUIZ.frame_active].style.display = 'block';
    },

    updateFrames: function(pages) {
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

    createSocket: function() {
        QUIZ.socket = new WebSocket(location.origin.replace(/^http/, 'ws'));

        QUIZ.socket.onopen = () => {
            const rq = {
                action: "LOGIN",
                username: QUIZ.username
            };
            QUIZ.sendServer(rq);
        };

        QUIZ.socket.onmessage = (message) => {QUIZ.onMessage(message)};

        QUIZ.socket.onclose = e => {
            QUIZ.createSocket();
        }
    }
};

window.addEventListener('load', function() {
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

        last_page_button.onclick = function() {
            const rq = {
                action: "PAGE_PREV"
            };
            QUIZ.sendServer(rq);
        }

        next_page_button.onclick = function() {
            const rq = {
                action: "PAGE_NEXT"
            };
            QUIZ.sendServer(rq);
        }
    }

});