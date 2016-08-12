var Adventures = {};
//currentAdventure is used for the adventure we're currently on (id). This should be determined at the beginning of the program
Adventures.currentAdventure = 0; //todo keep track from db
//currentStep is used for the step we're currently on (id). This should be determined at every crossroad, depending on what the user chose
Adventures.currentStep = 0;//todo keep track from db
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
    $.ajax("/story",{
        type: "POST",
        data: {"username": Adventures.currentUser},
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            $(".greeting-text").hide();
            if(data){
                Adventures.write(data);
            }
        }
    });
};

//The core function of the app, sends the user's choice and then parses the results to the server and handling the response
Adventures.chooseOption = function(){
    $.ajax("/story",{
        type: "POST",
        data: {"username": Adventures.currentUser,
            "choice": $(this).attr("value")}, //treat final step separately, also treat run away separately
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            $(".greeting-text").hide();
            if(data["is_content"]){
                // check if player is dead
                if (data["life"] <= 0){
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
    $(".situation-text").text(message['question_text']).show();
    for(var i=0;i<message['answers'].length;i++){
        var opt = $('#option_' + (i+1));
        opt.text(message['answers'][i]['answer_text']);
        opt.prop("value", message['answers'][i]['next_answer_id']); //TODO: maybe change to curr_answer_id if time
    }
    $(".coins-and-lives").text("You have " + message["coins"] + " coins and " + message["life"] + " percentage life!").show();
    Adventures.setImage(message['image']);
};


Adventures.start = function(){
    $(document).ready(function () {
        $(".game-option").click(Adventures.chooseOption); //this sets up the event listener for when a player will click an option which is in response to a question during the adventure
        $("#nameField").keyup(Adventures.checkName); //this validates the player's input for his username when starting the game
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

Adventures.checkName = function(){
    if($(this).val() !== undefined && $(this).val() !== null && $(this).val() !== ""){
        $(".adventure-option").prop("disabled", false);
    }
    else{
        $(".adventure-option").prop("disabled", true);
    }
};

Adventures.deadScreen = function () {
    $(".adventure").hide();
    $(".welcome-screen").hide(); //defensive in case user had logged in after dying
    $(".dead-screen").show();
};

Adventures.initAdventure = function(){
    Adventures.currentUser = $("#nameField").val();
    $.ajax("/start",{
        type: "POST",
        data: {"username": $("#nameField").val(),
            "password": $("#passwordField").val(),
            "gender": "M", //TODO: add to UI later, as bonus feature
            "adventure_id": $(this).val()
        },
        dataType: "json",
        contentType: "application/json",
        success: function (data) { //we don't actually need the data at the moment
            $(".adventure").show();
            $(".welcome-screen").hide();
            Adventures.getNextQuestion();
        }
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

Adventures.start();

