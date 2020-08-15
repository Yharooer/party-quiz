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
            case "PAGE_PREV":
                QUIZ.frame_active = (QUIZ.frame_active + 1) % 2;
                QUIZ.swapFrames();
        }
        
    },

    swapFrames: function() {
        QUIZ.iframes.forEach(ifr => ifr.style.display = 'none');
        QUIZ.iframes[QUIZ.frame_active].style.display = 'block';
    }
};

window.addEventListener('load', function() {
    QUIZ.iframes = [];
    QUIZ.iframes.push(document.getElementById('iframe1'));
    QUIZ.iframes.push(document.getElementById('iframe2'));

    QUIZ.frame_active = 0;
    QUIZ.swapFrames();

    QUIZ.socket = new WebSocket(location.origin.replace(/^http/, 'ws'));

    QUIZ.socket.onopen = () => {
        const rq = {
            action: "LOGIN",
            username: QUIZ.username
        };
        QUIZ.sendServer(rq);
    };

    QUIZ.socket.onmessage = (message) => {QUIZ.onMessage(message)};

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