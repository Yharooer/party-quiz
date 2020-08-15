function deleteUser(username) {
    if (confirm('Are you sure you want to delete user "' + username + '"?')) {

        // Submit post request by making a form.
        var form = document.createElement('form');
        form.method = 'post';
        form.action = '/admin/delete';
        form.style.display = 'none';
        form.style.visibility = 'hidden';
        var usernameField = document.createElement('input');
        usernameField.name = 'username';
        usernameField.value = username;
        form.appendChild(usernameField);
        document.body.appendChild(form);
        form.submit();
    }
}

function initiateChangeVisibleName(username) {
    var vis_name_div = document.getElementById(`visible_name_${username}`);
    var button = vis_name_div.getElementsByClassName('visible_change_button')[0];
    var textbox = vis_name_div.getElementsByClassName('visible_name_textbox')[0];
    var display = vis_name_div.getElementsByClassName('visible_name_display')[0];

    textbox.value = display.innerText;
    display.style.display = 'none';
    textbox.style.display = '';
    button.innerText = 'Submit';
    button.onclick = function() {
        submitChangeVisibleName(username);
    };
}

function submitChangeVisibleName(username) {
    var vis_name_div = document.getElementById(`visible_name_${username}`);
    var button = vis_name_div.getElementsByClassName('visible_change_button')[0];
    var textbox = vis_name_div.getElementsByClassName('visible_name_textbox')[0];
    var display = vis_name_div.getElementsByClassName('visible_name_display')[0];

    display.style.display = 'none';
    textbox.style.display = '';
    button.disabled = true;
    
    var vis_name = textbox.value;

    fetch('/admin/edit', {
        headers: { 'Content-Type': "application/json" },
        method: 'POST',
        body: JSON.stringify({
            username: username,
            visible_name: vis_name
        })
    }).then(response => {
        if (response.ok) {
            display.innerText = vis_name;
            display.style.display = '';
            textbox.style.display = 'none';
            button.disabled = false;
            button.innerText = 'Change';
            button.onclick = function() {
                initiateChangeVisibleName(username);
            };
        } else {
            display.innerText = 'An error occured.';
            display.style.display = '';
            textbox.style.display = 'none';
            button.style.visibility = 'hidden';
            textbox.value = '';
        }
    });
}