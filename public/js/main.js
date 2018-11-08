//Estimate Edit Function
function analysisBtn(current){
   
    var jobname = $(current).attr("data-jobname"); 
    $('<form action="/list" method="POST"/>')
    .append($('<input type="hidden" name="jobname" value="' + jobname + '">'))
    .appendTo($(document.body))
    .submit();   
    
  }