QUESTION_CONTROLLER = {
    onAnswerSubmit: function (ans) {
        QUESTION_CONTROLLER.sendPacket({
            action: 'SUBMIT',
            id: QUESTION_CONTROLLER.id,
            answer: ans
        });
    },

    onAnswerReceive: function (ans) {
        // Stuff goes here.
    },

    onFinal : function() {
        // Stuff goes here
    },

    getSocket: function () {
        return window.top.QUIZ.socket;
    },

    sendPacket: function (data) {
        window.top.QUIZ.sendServer(data);
    },

    onAdvance: function () {
        QUESTION_CONTROLLER.sendPacket({
            action: 'ADVANCE',
            id: QUESTION_CONTROLLER.id
        });
    },

    onSecondaryMessage: function (packet) {
        switch (packet.secondary_action) {
            case 'ANSWER':
                QUESTION_CONTROLLER.onAnswerReceive(packet.answer);
                if (packet.final == true) {
                    QUESTION_CONTROLLER.onFinal();
                }

                break;

            case 'RESUME':
                QUESTION_CONTROLLER.onChildResume(packet);
                if (packet.answer != null) {
                    if (MC_QC != null) {
                        MC_QC.selectAnswer(packet.selected_ans);
                    }
                    QUESTION_CONTROLLER.onAnswerReceive(packet.answer);
                }
                break;
        }
    },

    onChildResume: function (packet) {
        // Can add functionality here.
    }
};