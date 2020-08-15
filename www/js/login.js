function loginUser(username) {
    // Submit post request by making a form.
    var form = document.createElement('form');
    form.method = 'post';
    form.action = '/login';
    form.style.display = 'none';
    var usernameField = document.createElement('input');
    usernameField.name = 'username';
    usernameField.value = username;
    form.appendChild(usernameField);
    document.body.appendChild(form);
    form.submit();
}