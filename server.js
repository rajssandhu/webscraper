var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(logger("dev"));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));


mongoose.Promise = Promise;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect("mongodb://localhost/mongoHeadlines", {});
}

app.get("/", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {

      var hbsObject = {
        articles: dbArticle
      };
      res.render("index", hbsObject);
    })
    .catch(function(err) {
      
      res.json(err);
    });
});

app.get("/scrape", function(req, res) {
  db.Article.remove({}, function(err, removed) {
    
    axios.get("https://www.vox.com/").then(function(response) {
      
      var $ = cheerio.load(response.data);

      $(".c-entry-box--compact__body").each(function(i, element) {
        
        var result = {};

        console.log(result);
        
        result.title = $(this)
          .children("h2")
          .children("a")
          .text();

        result.link = $(this)
          .children("h2")
          .children("a")
          .attr("href");

        result.author = $(this)
          .children("div")
          .children("span")
          .children("a")
          .text();


        db.Article.create(result)
          .then(function(dbArticle) {
        
            console.log(dbArticle);
          })
          .catch(function(err) {
           
            return res.json(err);
          });
      });

      res.send("success <a href='/'>return home</a>");
    });
  });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    
    .populate("comment")
    .then(function(dbArticle) {
      
      var hbsObject = {
        articles: dbArticle
      };
      console.log(dbArticle);
      res.render("comments", dbArticle);
    })
    .catch(function(err) {
      
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  
  db.Comment.create(req.body)
    .then(function(dbComment) {
      
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { comment: dbComment._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
    
      res.json(dbArticle);
    })
    .catch(function(err) {
      
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});