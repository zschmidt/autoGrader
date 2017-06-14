# Public Directory

This directory holds the code from CodeMirror (how we show the text editor on the submission page), an `index.html` which lists all the modules, and subdirectories which hold the code for the module submission pages.


## IMPORTANT NOTE


`index.html` works by firing off a quick POST to the server to create every repo. This looks for a list of all elements with a class of `modules`, and it will name the repo whatever the `id` of that element is. For example, `Module 9` is a button which looks like this:

`<a href="module9/index.html" id="module9" class="modules btn btn-primary">Module 9</a>`