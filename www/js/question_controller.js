QUESTION_CONTROLLER = {
    onAnswerSubmit: function(ans) {
        QUESTION_CONTROLLER.sendPacket({
            action: 'SUBMIT',
            id: QUESTION_CONTROLLER.id,
            answer: ans
        });
    },

    onAnswerReceive: function (ans) {
        // Stuff goes here.
    },

    getSocket : function () {
        return window.top.QUIZ.socket;
    },

    sendPacket : function (data) {
        window.top.QUIZ.sendServer(data);
    },

    onAdvance: function () {
        QUESTION_CONTROLLER.sendPacket({
            action: 'ADVANCE',
            id: QUESTION_CONTROLLER.id
        });
    },

    onSecondaryMessage: function(packet) {
        switch(packet.secondary_action) {
            case 'ANSWER':
                QUESTION_CONTROLLER.onAnswerReceive(packet.answer);
                break;
    
            case 'RESUME':
                QUESTION_CONTROLLER.onChildResume(packet);
                if (packet.answer != null) {
                    QUESTION_CONTROLLER.onAnswerSubmit(packet.answer);
                }
                break;
        }
    },

    onChildResume: function(packet) {
        // Can add functionality here.
    }
};