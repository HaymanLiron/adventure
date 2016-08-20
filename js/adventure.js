var Adventures = {};
Adventures.currentUser = "";

//TODO: remove for production
Adventures.debugMode = true;
Adventures.DEFAULT_IMG = "./images/choice.jpg";

//Setting the relevant image according to the server response
Adventures.setImage = function (img_name) {
    $("#situation-image").attr("src", "./images/" + img_name);
};

Adventures.printFinalOutcome = function (data) {
    $(".adventure").hide();
    $(".welcome-screen").hide(); //defensive in case user had logged in after dying
    $(".final-screen").show();
    if (data["user"]["user_coins"] > 0 && data["user"]["user_life"] > 50){
        $(".final-message").text("Congratulations, you managed to fight off the monster and survive!");
    } else {
        $(".final-message").text("You did not succeed in defeating the monster! Bye-bye!");
        // in case the player died before the final question, set the user details appropriately
        $.ajax("/setDetailsForLoser", {
            type: "POST",
            data: {
                "username": Adventures.currentUser
            },
            dataType: "json",
            contentType: "application/json"
        })
    }
};

Adventures.chooseOption = function () {
    $.ajax("/handleOptionSelection", {
        type: "POST",
        data: {
            "username": Adventures.currentUser,
            "choice": $(this).attr("value")
        }, 
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            $(".greeting-text").hide();
            // check if user has life
            if (data["user"]["user_life"] <= 0) { // the player died!
                Adventures.printFinalOutcome(data); 
            }
            Adventures.getNextQuestion();
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
        opt.prop("value", message['answers'][i]['answer_id']); 
    }
    $(".coins-and-lives").text("You have " + message["coins"] + " coins and " + message["life"] + " percentage life!").show();
    Adventures.setImage(message['image']);
};

Adventures.getNextQuestion = function () {
    //only gets data for next question, does NOT handle choice selection
    $.ajax("/printQuestion", {
        type: "POST",
        data: {"username": Adventures.currentUser},
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            if (!(data["end_reached"])){
                $(".greeting-text").hide();
                $(".adventure").show();
                $(".welcome-screen").hide();
                Adventures.write(data);
            } else {
                // we have reached the end!
                Adventures.printFinalOutcome(data);
            }
        }
    });
};

Adventures.makeNewUser = function () {
    $.ajax("/addUser", {
        type: "POST",
        data: {
            "username": $("#nameField").val()
        },
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            console.log("This worked!");
        }
    })
};

Adventures.validateUsernameInput = function () {
    $.ajax("/checkUserCredentials", {
        type: "POST",
        data: {
            "username": $("#nameField").val()
        },
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            if (data["already_exists"]) {
                // user already exists!
                console.log("user exists");
                Adventures.currentUser = $("#nameField").val();
                Adventures.getNextQuestion();
            } else {
                console.log("user does not exist");
                Adventures.currentUser = $("#nameField").val();
                Adventures.makeNewUser();
                Adventures.getNextQuestion();
            }
        }
    });
};

Adventures.initAdventure = function () {
    //username typed their name in the screen and clicked on the adventure
    var name = $("#nameField").val();
    if (name !== undefined && name !== null && name !== "") {
        Adventures.validateUsernameInput();
    }
};

Adventures.checkName = function () {
    if ($(this).val() !== undefined && $(this).val() !== null && $(this).val() !== "") {
        $(".adventure-option").prop("disabled", false);
    }
    else {
        $(".adventure-option").prop("disabled", true);
    }
};

Adventures.start = function () {
    $(document).ready(function () {
        $(".game-option").click(Adventures.chooseOption); //this sets up the event listener for when a player will click an option which is in response to a question during the adventure
        $("#nameField").keyup(Adventures.checkName); //this validates the player's input for his username when starting the game
        $(".adventure-option").click(Adventures.initAdventure); //this sets up a click event listener for when a player selects an adventure at the beginning of the game
        $(".adventure").hide();
        $(".final-screen").hide();
        $(".welcome-screen").show();
    });
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

Adventures.start();

