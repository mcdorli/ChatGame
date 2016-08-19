var login = (function () {

    var isLogggedIn = false;

    var signupSend = document.getElementById("signup-button");
    var loginSend = document.getElementById("login-button");

    var loginDataRaw = sessionStorage.getItem("loginData");
    var loginData;

    if (loginDataRaw)
        loginData = JSON.parse(loginDataRaw);

    if (loginData) {
        var loginCheck = new XMLHttpRequest();
        loginCheck.onreadystatechange = function () {
            if (loginCheck.readyState == 4 && loginCheck.status == 200) {
                if (loginCheck.responseText == "true") {
                    isLogggedIn = true;
                    if (location.href.indexOf("login.html") != -1) {
                        alert("You're already logged in!");
                        location.href = "/";
                    }
                } else {
                    sessionStorage.removeItem("loginData");
                }
            }
        };
        loginCheck.open("GET", "loginCheck?username=" + loginData.username + "&hash=" + loginData.hash, true);
        loginCheck.send();
    } else {
        if (signupSend && loginSend) {
            signupSend.onclick = function () {
                var pass = document.getElementById("signup-password").value;
                if (pass !== document.getElementById("signup-password-again").value) {
                    alert("Passwords must match!");
                    return;
                }
                var username = document.getElementById("signup-username").value;
                var email = document.getElementById("signup-email").value;
                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/ig.test(email)) {
                    alert("The entered e-mail address is either fake or not accepted by this site!");
                    return;
                }

                loginData = {
                    username: username,
                    password: pass,
                    email: email,
                    hash: ""
                };

                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (xhttp.readyState == 4 && xhttp.status == 200) {
                        if (xhttp.responseText == "exists") {
                            alert("A user with the same username already exists!");
                        } else {
                            loginData.hash = xhttp.responseText;
                            sessionStorage.setItem("loginData", JSON.stringify(loginData));
                            alert("You succefully signed up!");
                            location.href = "/";
                        }
                    }
                };
                xhttp.open("GET", "signup?username=" + loginData.username +
                    "&password=" + loginData.password +
                    "&email=" + loginData.email, true);
                xhttp.send();
            };

            loginSend.onclick = function () {
                var username = document.getElementById("login-username").value;
                var password = document.getElementById("login-password").value;

                var loginData = {
                    username: username,
                    password: password,
                    email: "",
                    hash: ""
                }
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (xhttp.readyState == 4 && xhttp.status == 200) {
                        var lData = JSON.parse(xhttp.responseText);
                        loginData.email = lData.email;
                        loginData.hash = lData.hash;
                        sessionStorage.setItem("loginData", JSON.stringify(loginData));
                        alert("You succefully logged in!");
                        location.href = "/";
                    }
                };
                xhttp.open("GET", "login?username=" + loginData.username + "&password=" + loginData.password, true);
                xhttp.send();
            };
        }
    }
    return {
        loginData: loginData,
        signout: function () {
            sessionStorage.removeItem("loginData");
            location.href = "/";
        }
    };
})();
