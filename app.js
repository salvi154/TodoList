const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const user = process.env.user_name;
const pass = process.env.password;
// console.log(user+":"+pass);


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://user:pass@cluster0.v0lnf80.mongodb.net/todolist2DB",() => {
  console.log("DB is connected");
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Food"
});
const item2 = new Item ({
  name: "Eat"
});
const item3 = new Item ({
  name: "Sleep"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);



app.get("/", function(req, res) {
 // const day = date.getDate();

  Item.find({},function(err,foundItems){

    if (foundItems.length===0){
      Item.insertMany(defaultItems,function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Success saved default items in DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list.trim();


  const item = new Item ({
    name:itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

  
});

app.post("/delete",function(req,res){
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName.trim();

  if (listName==="Today"){
    Item.findByIdAndRemove(checkedItem, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList){
      if (!err){
        res.redirect("/"+listName);
      }
    });
  }


  
});


app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName},function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ customListName);
      } else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
