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

        var typeField = document.createElement('input');
        typeField.name = 'type';
        typeField.value = 'mc';
        form.appendChild(typeField);

        if (MULT_CHOICE.imageSrc != null) {
            var imgField = document.createElement('input');
            imgField.name = 'imageSrc';
            imgField.value = MULT_CHOICE.imageSrc;
            form.appendChild(imgField);
        }

        var anonField = document.createElement('input');
        anonField.name = 'anon';
        var anonbutton = document.getElementById('mc_anon_check');
        anonField.value = (anonbutton == null) ? false : anonbutton.checked;
        form.appendChild(anonField);

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

/* POPULAR VOTE */
POP_VOTE = {};

window.addEventListener('load', function() {
    POP_VOTE.submit = document.getElementById('pv_submit');
    POP_VOTE.submit.onclick = function() {
        // Submit question request by making a form.
        var form = document.createElement('form');
        form.method = 'post';
        form.action = '/dashboard/new_question';
        form.style.display = 'none';
        form.style.visibility = 'hidden';

        var promptField = document.createElement('input');
        promptField.name = 'prompt';
        promptField.value = document.getElementById('pv_prompt_text').value;

        if (promptField.value.trim() == '') {
            alert('Cannot submit empty prompt!')
        }

        form.appendChild(promptField);

        var authorField = document.createElement('input');
        authorField.name = 'author';
        authorField.value = MY_USERNAME;
        form.appendChild(authorField);

        var typeField = document.createElement('input');
        typeField.name = 'type';
        typeField.value = 'pv';
        form.appendChild(typeField);

        if (POP_VOTE.imageSrc != null) {
            var imgField = document.createElement('input');
            imgField.name = 'imageSrc';
            imgField.value = POP_VOTE.imageSrc;
            form.appendChild(imgField);
        }

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

function section_mult_choice() {
    var mc = document.getElementById('multiple_choice');
    var pv = document.getElementById('popular_vote');

    mc.style.display = 'block';
    pv.style.display = 'none';
}

function section_pop_vote() {
    var mc = document.getElementById('multiple_choice');
    var pv = document.getElementById('popular_vote');

    mc.style.display = 'none';
    pv.style.display = 'block';
}

function onMcImageUpload() {
    var file = document.getElementById('mc_image_upload');
    var form = new FormData();
    form.append('image', file.files[0]);

    fetch('https://api.imgbb.com/1/upload?key=dfbae1ae3109f8db0631f8f48b4f9d65', {
        method: 'POST',
        body: form
    }).then(response => response.json())
    .then(data => {
        if (data.status == 200) {
            MULT_CHOICE.imageSrc = data.data.display_url;
            var box = document.getElementById('mc_image_div');
            box.innerHTML = '<p style="margin-top:0; margin-bottom:4px;">Image: <img src="' + data.data.display_url + '" class="dash_image"></img></p>';
        } else {
            var box = document.getElementById('mc_image_div');
            box.innerHTML = '<p style="margin-top:0; margin-bottom:4px;>Failed to upload image.</p>';
        }
    });
}

function onPvImageUpload() {
    var file = document.getElementById('pv_image_upload');
    var form = new FormData();
    form.append('image', file.files[0]);

    fetch('https://api.imgbb.com/1/upload?key=dfbae1ae3109f8db0631f8f48b4f9d65', {
        method: 'POST',
        body: form
    }).then(response => response.json())
    .then(data => {
        if (data.status == 200) {
            POP_VOTE.imageSrc = data.data.display_url;
            var box = document.getElementById('pv_image_div');
            box.innerHTML = '<p style="margin-top:0; margin-bottom:4px;">Image:&nbsp;&nbsp;<img src="' + data.data.display_url + '" class="dash_image"></img></p>';
        } else {
            var box = document.getElementById('pv_image_div');
            box.innerHTML = '<p style="margin-top:0; margin-bottom:4px;>Failed to upload image.</p>';
        }
    });
}