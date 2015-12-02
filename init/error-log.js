(function() {
    // proxy pattern to override console.error and output to localStorage.
    // To display in a error log.
    var proxied = console.error;
    if(!localStorage['errorLog']){ localStorage.setItem("errorLog", JSON.stringify([])) }
    console.error = function() {
        var concatedArguments = '';
        for(var i=0;i<arguments.length;i++){
          concatedArguments += arguments[i].toString() + ', ';
        }
        var existingErrors = JSON.parse(localStorage.getItem("errorLog"));
        existingErrors.push(concatedArguments + ' [' + (new Date()) + '] ');
        localStorage.setItem("errorLog", JSON.stringify(existingErrors));
        return proxied.apply( this, arguments );
    };
})();