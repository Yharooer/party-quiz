/* MULTIPLE CHOICE */
MULT_CHOICE = {
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
    num_choices: 3,
    max_choices: 8
};

window.addEventListener('load', function() {
    MULT_CHOICE.mc_plus = document.getElementById('mc_plus');
    
    document.getElementById('mc_a_text').oninput = function() {
        text = document.getElementById('mc_a_text').value;
        console.log(text);
        document.getElementById('select_a').innerHTML = 'A: ' + text;
        document.getElementById('select_a').disabled = text.trim() == '';
    };

    document.getElementById('mc_b_text').oninput = function() {
        text = document.getElementById('mc_b_text').value;
        document.getElementById('select_b').innerHTML = 'B: ' + text;
        document.getElementById('select_b').disabled = text.trim() == '';
    };

    document.getElementById('mc_c_text').oninput = function() {
        text = document.getElementById('mc_c_text').value;
        document.getElementById('select_c').innerHTML = 'C: ' + text;
        document.getElementById('select_c').disabled = text.trim() == '';
    };

    MULT_CHOICE.mc_plus.onclick = function() {
        MULT_CHOICE.num_choices += 1;
        var new_letter = MULT_CHOICE.letters[MULT_CHOICE.num_choices - 1];
        var new_choice = document.createElement('div');
        new_choice.id = 'mc_' + new_letter.toLowerCase();
        new_choice.className = 'input_textbox';
        new_choice.innerHTML = '<label class=\'prompt_input_left\' for="mc_name">' + new_letter + '</label> <input class="prompt_input_right" type="text" id="mc_' + new_letter.toLowerCase() + '_text" name="mc_' + new_letter.toLowerCase() + '" required />';
        if (MULT_CHOICE.num_choices >= MULT_CHOICE.max_choices) {
            MULT_CHOICE.mc_plus.style.display = 'none';   
        }

        var new_option = document.createElement('option');
        new_option.id = 'select_' + new_letter.toLowerCase();
        new_option.value = MULT_CHOICE.num_choices - 1;
        new_option.innerHTML = new_letter + ': ';
        new_option.disabled = true;

        new_choice.getElementsByTagName('input')[0].oninput = () => {
            text = new_choice.getElementsByTagName('input')[0].value;
            console.log(text);
            new_option.innerHTML = new_letter + ': ' + text;
            new_option.disabled = text.trim() == '';
        }

        document.getElementById('mc_choices').appendChild(new_choice);
        document.getElementById('mc_correct_select').appendChild(new_option);
    };

    MULT_CHOICE.submit = document.getElementById('mc_submit');
    MULT_CHOICE.submit.onclick = function() {
        // Submit question request by making a form.
        var form = document.createElement('form');
        form.method = 'post';
        form.action = '/dashboard/new_question';
        form.style.display = 'none';
        form.style.visibility = 'hidden';

        var promptField = document.createElement('input');
        promptField.name = 'prompt';
        promptField.value = document.getElementById('mc_prompt_text').value;
        form.appendChild(promptField);

        var authorField = document.createElement('input');
        authorField.name = 'author';
        authorField.value = MY_USERNAME;
        form.appendChild(authorField);

        var authorField = document.createElement('input');
        authorField.name = 'type';
        authorField.value = 'mc';
        form.appendChild(authorField);

        for (i=0; i<MULT_CHOICE.num_choices; i++) {
            var numField = document.createElement('input');
            numField.name = 'mc_' + MULT_CHOICE.letters[i].toLowerCase();
            numField.value = document.getElementById('mc_' + MULT_CHOICE.letters[i].toLowerCase() + '_text').value;
            form.appendChild(numField);
        }
        
        var answerField = document.createElement('input');
        answerField.name = 'answer';
        answerField.value = document.getElementById('mc_correct_select').value;
        form.appendChild(answerField);

        document.body.appendChild(form);
        form.submit();
    }
});

function deleteQuestion(qid) {
    if (confirm('Are you sure you want delete to this question?')) {
        // Submit post request by making a form.
        var form = document.createElement('form');
        form.method = 'post';
        form.action = '/dashboard/delete_question';
        form.style.display = 'none';
        form.style.visibility = 'hidden';
        var qidField = document.createElement('input');
        qidField.name = 'qid';
        qidField.value = qid;
        form.appendChild(qidField);
        document.body.appendChild(form);
        form.submit();
    }
}

function toggleEveryone() {
    var sw = document.getElementById('toggle_all_input');
    if (sw.checked) {
        Array.from(document.getElementsByClassName('dashdisp_hidden')).forEach(e => e.style.display = 'block');
    } else {
        Array.from(document.getElementsByClassName('dashdisp_hidden')).forEach(e => e.style.display = 'none');
    }
}