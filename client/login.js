var login = (function () {
    
    var isLogggedIn = false;
    var userData = {
        username: "",
        password: ""
    }
    
    var signupSend = document.getElementById("signup-button");
    var loginSend = document.getElementById("login-button");
    
    var loginData = sessionStorage.getItem("loginData");
    
    if (loginData) {
        var loginCheck = new XMLHttpRequest();
        loginCheck.onreadyStateChange = function () {
            if (loginCheck.readyState == 4 && loginCheck.status == 200) {
                if (loginCheck.responseText == "true") {
                    isLogggedIn = true;
                    userData = loginData;
                }
            }
        };
        loginCheck.open("GET", "loginCheck?username=" + loginData.username + "&id=" + loginData.id, true);
        loginCheck.send();
    } else {
        
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
                id: ""
            };
            
            var xhttp = new XMLHttpRequest();
            xhttp.onreadyStateChange = function () {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    loginData.id = xhttp.loginData.id;
                    sessionStorage.setItem("loginData", loginData);
                    alert("You succefully signed up!");
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
                id: ""
            }
            var xhttp = new XMLHttpRequest();
            xhttp.onreadyStateChange = function () {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    loginData.email = xhttp.loginData.email;
                    loginData.id = xhttp.loginData.id;
                    sessionStorage.setItem("loginData", loginData);
                    alert("You succefully logged in!");
                }
            };
            xhttp.open("GET", "login?username=" + loginData.username + "&password=" + loginData.password, true);
            xhttp.send();
        };
    }
    
})();
