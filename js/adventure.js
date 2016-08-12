var Adventures = {};
//currentAdventure is used for the adventure we're currently on (id). This should be determined at the beginning of the program
Adventures.currentAdventure = ""; //todo keep track from db

Adventures.currentUser = "";//todo keep track from db


//TODO: remove for production
Adventures.debugMode = true;
Adventures.DEFAULT_IMG = "./images/choice.jpg";


//Handle Ajax Error, animation error and speech support
Adventures.bindErrorHandlers = function () {
    //Handle ajax error, if the server is not found or experienced an error
    $(document).ajaxError(function (event, jqxhr, settings, thrownError) {
        Adventures.handleServerError(thrownError);
    });

    //Making sure that we don't receive an animation that does not exist
    $("#situation-image").error(function () {
        Adventures.debugPrint("Failed to load img: " + $("#situation-image").attr("src"));
        Adventures.setImage(Adventures.DEFAULT_IMG);
    });
};

Adventures.getNextQuestion = function () {
    $.ajax("/story", {
        type: "POST",
        data: {"username": Adventures.currentUser},
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            $(".greeting-text").hide();
            $(".adventure").show();
            $(".welcome-screen").hide();
            Adventures.write(data);
        }
    });
};

Adventures.chooseOption = function () {
    $.ajax("/story", {
        type: "POST",
        data: {
            "username": Adventures.currentUser,
            "choice": $(this).attr("value")
        }, //treat final step separately, also treat run away separately
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            $(".greeting-text").hide();
            if (data["is_content"]) {
                // check if player is dead
                if (data["life"] <= 0) {
                    Adventures.deadScreen();
                } else {
                    Adventures.write(data);
                }
            }
        }
    });
};

Adventures.write = function (message) {
    //Writing new choices and image to screen
    console.log(message);
    $(".situation-text").text(message['question_text']).show();
    for (var i = 0; i < message['answers'].length; i++) {
        var opt = $('#option_' + (i + 1));
        opt.text(message['answers'][i]['answer_text']);
        opt.prop("value", message['answers'][i]['next_answer_id']); //TODO: maybe change to curr_answer_id if time
    }
    $(".coins-and-lives").text("You have " + message["coins"] + " coins and " + message["life"] + " percentage life!").show();
    Adventures.setImage(message['image']);
};

Adventures.start = function () {
    $(document).ready(function () {
        $(".game-option").click(Adventures.chooseOption); //this sets up the event listener for when a player will click an option which is in response to a question during the adventure
        $("#nameField").keyup(Adventures.checkName); //this validates the player's input for his username when starting the game
        $("#newNameField").keyup(Adventures.checkName);
        $(".adventure-option").click(Adventures.initAdventure); //this sets up a click event listener for when a player selects an adventure at the beginning of the game
        $(".adventure").hide();
        $(".dead-screen").hide();
        $(".welcome-screen").show();
    });
};

//Setting the relevant image according to the server response
Adventures.setImage = function (img_name) {
    $("#situation-image").attr("src", "./images/" + img_name);
};

Adventures.checkName = function () {
    if ($(this).val() !== undefined && $(this).val() !== null && $(this).val() !== "") {
        $(".adventure-option").prop("disabled", false);
    }
    else {
        $(".adventure-option").prop("disabled", true);
    }
};

Adventures.deadScreen = function () {
    $(".adventure").hide();
    $(".welcome-screen").hide(); //defensive in case user had logged in after dying
    $(".dead-screen").show();
};

Adventures.validateNewUserInfo = function () {
    var passwordsGood = false;
    var usernameGood = false;
    // check that the two passwords match
    if ($("#newPasswordField1").val() === $("#newPasswordField2").val() &&
        $("#newPasswordField1").val() !== undefined && $("#newPasswordField1").val() !== null && $("#newPasswordField1").val() !== "") {
        passwordsGood = true;
    } else {
        //inform the user that the two passwords they input do not match and that they have to redo it all
        $(".user-input-feedback").text("Your passwords do not match, please try again!");
        return;
    }
    //now we can check username does not already exist!
    $.ajax("/checkUsernameExists", {
        type: "POST",
        data: {
            "username": $("#newNameField").val()
        },
        dataType: "json",
        contentType: "application/json",
        success: function (data) { //we don't actually need the data at the moment
            if (data["is_match"]) {
                //user name already exists
                $(".user-input-feedback").text("This username already exists, please try again!");
                return;
            } else {
                //user name does not exist
                Adventures.currentUser = $("#newNameField").val();
                //input is good, we can create a new user and go ahead with the game
                Adventures.startAdventureWithNewUser();
            }
        }
    });
};

Adventures.validateUsernameInput = function () {
    // first check if there was input in the existing users section
    // assume that if there was input there, then you can ignore the new user section
    if ($("#nameField").val() !== undefined && $("#nameField").val() !== null && $("#nameField").val() !== "") {
        // check password not blank
        if ($("#passwordField").val() !== undefined && $("#passwordField").val() !== null && $("#passwordField").val() !== "") {
            // username gave us something in both the existing username and password fields
            // we now check if they exist in the database
            $.ajax("/checkUserCredentials", {
                type: "POST",
                data: {
                    "username": $("#nameField").val(),
                    "password": $("#passwordField").val()
                },
                dataType: "json",
                contentType: "application/json",
                success: function (data) {
                    // only returns something if they matched!
                    if (data["is_match"]) {
                        // user already exists!
                        Adventures.currentUser = $("#nameField").val();
                        Adventures.getNextQuestion();
                    } else {
                        // user does not already exist!
                        $(".user-input-feedback").text("Sorry, this username does not exist!");
                    }
                }
            });
        }
    }
};

Adventures.startAdventureWithNewUser = function () {
    $.ajax("/start", {
        type: "POST",
        data: {
            "username": $("#newNameField").val(),
            "password": $("#newPasswordField1").val(),
            "gender": "M", //TODO: add to UI later, as bonus feature
            "adventure_id": $(this).val()
        },
        dataType: "json",
        contentType: "application/json",
        success: function (data) { //we don't actually need the data at the moment
            console.log(data);
            $(".adventure").show();
            $(".welcome-screen").hide();
            Adventures.getNextQuestion();
        }
    });
}

Adventures.initAdventure = function () {
    //username gave their info in the existing user section
    if ($("#nameField").val() !== undefined && $("#nameField").val() !== null && $("#nameField").val() !== "") {
        Adventures.validateUsernameInput();
    } else { //user tried to give us a new user name and password
        Adventures.validateNewUserInfo();
    }
};

Adventures.handleServerError = function (errorThrown) {
    Adventures.debugPrint("Server Error: " + errorThrown);
    var actualError = "";
    if (Adventures.debugMode) {
        actualError = " ( " + errorThrown + " ) ";
    }
    Adventures.write("Sorry, there seems to be an error on the server. Let's talk later. " + actualError);

};

Adventures.debugPrint = function (msg) {
    if (Adventures.debugMode) {
        console.log("Adventures DEBUG: " + msg);
    }
};

Adventures.start();

