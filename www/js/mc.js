QUESTION_CONTROLLER.onAnswerReceive = function (ans) {
    MC_QC.letters.forEach(function(letter) {
        var el = document.getElementById('mc_answer_' + letter)
        if (el == null) {
            return;
        }
        if (letter != ans) {
            el.classList.add('incorrect');
        } else {
            el.classList.add('correct');
        }
        el.onclick = function() {};
    });
};

QUESTION_CONTROLLER.onChildResume = function(packet) {
    if (packet.selected_answer != null) {
        MC_QC.selectAnswer(packet.selected_answer);
    }
};

MC_QC = {
    letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'],

    selectAnswer: function (ans) {
        MC_QC.letters.forEach(function(letter) { 
            if (letter != ans) {
                var el = document.getElementById('mc_answer_' + letter)
                if (el != null) {
                    el.classList.remove('selected');
                }
            }
        });

        document.getElementById('mc_answer_' + ans).classList.add('selected');

        QUESTION_CONTROLLER.onAnswerSubmit(ans);
    }
};