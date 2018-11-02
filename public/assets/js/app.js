
$(document).on("click", "#commentSave", function() {
  
  var thisId = $(this).attr("data-id");

  console.log(thisId);
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      body: $("#comment").val()
    }
  })
    .then(function(data) {
      console.log(data);
      $("#comment").empty();
    });
});