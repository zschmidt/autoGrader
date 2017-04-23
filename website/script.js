//This code fires off the contents of the input box to thoth, who then commits it to GitHub

var commit = function(){
  var obj = {code: $("#code").val()};
  var post = new XMLHttpRequest();
  post.open('POST', "http://thoth.cs.uoregon.edu:3000");
  post.setRequestHeader("Content-type", "application/json");
  post.send(JSON.stringify(obj));

  post.addEventListener("readystatechange", postToThoth, false);

  function postToThoth(e){
    if(post.readyState === 4 && post.status == 200){
      console.log("Here's your response: ", post.response);
    }
  }
}



$("#submit").on('click', commit);