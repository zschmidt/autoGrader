var module = "module9";


var travisWorks = false;


function getJobID(e) {
    if (xhr.readyState === 4 && xhr.status == 200) {
        var response = JSON.parse(xhr.response);
        mostRecentBuild = response.builds[0];


        console.log("Got this back from travis ", mostRecentBuild);

        if(mostRecentBuild){
            if (mostRecentBuild.state === "passed") {
                $("#status").html("<span class='label label-success'>Passed</span>");
                $("#error").html("");
            } else if (mostRecentBuild.state === "started") {
                $("#status").html("<span class='label label-primary'>Started</span>");
                $("#error").html("<i class='fa fa-hourglass-half fa-spin' style='font-size:24px'></i> Building...");
    
            } else if (mostRecentBuild.state === "created") {
                $("#status").html("<span class='label label-primary'>Created</span>");
                $("#error").html("<i class='fa fa-hourglass-half fa-spin' style='font-size:24px'></i> Starting up...");
            } else {
                $("#status").html("<span class='label label-danger'>" + mostRecentBuild.state.toUpperCase() + "</span>");
                $("#error").html("<i class='fa fa-hourglass-half fa-spin' style='font-size:24px'></i> Fetching error...");
                var mostRecentBuildJobID = mostRecentBuild.job_ids[0];
                xhr = new XMLHttpRequest();
                xhr.open('GET', "https://api.travis-ci.org/jobs/" + mostRecentBuildJobID + "/log");
                xhr.setRequestHeader("Accept", "text/plain");
                xhr.send();
                xhr.addEventListener("readystatechange", getLog, false);
            }
        }
    }
}

function getLog(e) {
    if (xhr.readyState === 4 && xhr.status == 200) {
        var log = xhr.response;
        var logArray = log.split("python module9_challenge_2.py submission.py");
        //Include a print statement in the submitted code. Do it. It'll be fun.
        var errorMessage = logArray[1].split('travis_time')[0];
        errorMessage.trim();
        errorMessage = JSON.parse(errorMessage);
        $("#error").html("<p class='lead'>Error: " + errorMessage.Long + "<br/>Cause: " + errorMessage.Short + "</p>");
    }
}


var getLatestBuildStatus = function() {
    xhr = new XMLHttpRequest();
    xhr.open('GET', "https://api.travis-ci.org/repos/"+sessionStorage.login+"/"+module+"/builds");
    xhr.setRequestHeader("Accept", "application/vnd.travis-ci.2+json");
    xhr.send();
    xhr.addEventListener("readystatechange", getJobID, false);
}


var startBuild = function() {
    $("#status").html("<span class='label label-primary'>Created</span>");
    $("#error").html("<i class='fa fa-hourglass-half fa-spin' style='font-size:24px'></i> Starting up...");
    mostRecentBuild.state = "created";

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function wait() {
        await sleep(10000);
        var interval = setInterval(function() {
            getRequest();
            if (mostRecentBuild.state === "passed" || mostRecentBuild.state === "failed" || mostRecentBuild.state === "errored") {
                clearInterval(interval);
            }
        }, 3000);
    }

    wait();

}



//This fires off a get request to get the latest submission

var getLastSubmission = function(editor) {

    access_token = sessionStorage.access_token;

    var request = new XMLHttpRequest();
    request.open('GET', "http://thoth.cs.uoregon.edu:3000/getSubmission?module="+module+"&access_token="+access_token);
    request.setRequestHeader("Accept", "text/plain");
    request.send();
    request.addEventListener("readystatechange", function() {
        if (request.readyState === 4 && request.status == 200) {
            var response = JSON.parse(request.response);
            sessionStorage.setItem('login', response.login);
            editor.setValue(response.submission);
            if(travisWorks){
                getLatestBuildStatus();
            }
        }

    }, false);

}




//This code fires off the contents of the input box to thoth, who then commits it to GitHub

var commit = function() {
    if(travisWorks){
        startBuild();
    }
    

    var obj = {
        module: module,
        code: editor.getValue(),
        access_token: access_token,
        login: sessionStorage.login
    };
    var post = new XMLHttpRequest();
    post.open('POST', "http://thoth.cs.uoregon.edu:3000");
    post.setRequestHeader("Content-type", "application/json");
    post.send(JSON.stringify(obj));

    post.addEventListener("readystatechange", postToThoth, false);

    function postToThoth(e) {
        if (post.readyState === 4 && post.status == 200) {
            console.log("Here's your response: ", post.response);
        }
    }
}



$("#submit").on('click', commit);
$(document).ready(function() {
    editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        mode: {
            name: "python",
            version: 3,
            singleLineStringErrors: true
        },
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true
    });
    getLastSubmission(editor);
});
