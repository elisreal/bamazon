// Dependencies-----------------------------
var inquirer = require('inquirer');
var mysql = require('mysql');
var Table = require('cli-table');

// mySQL Connection-------------------------
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root", //Your username
    password: "", //Your password
    database: "bamazonDB"
});


var managerPrompt = function() {
  inquirer.prompt({
    name: "action",
    type: "list",
    message: "Hello! What would you like to do?",
    choices: ["View products for sale", 'View low inventory', "Add to inventory", "Add a new product", "Exit"]
  }).then(function(answer) {
      switch (answer.action) {
        case "View products for sale":
          viewInven(function() {
            managerPrompt();
          });
        break;

        case "View low inventory":
          viewLowInven(function() {
            managerPrompt();
          });
        break;

        case "Add to inventory":
        addToInven();
        break;

        case "Add a new product":
        addNewProd();
        break;
   
        case "Exit":
        connection.end();
        break;
    }
  })
};

// View Inventory Function here------------------------------------------

var viewInven = function(cb) {
  connection.query('SELECT * FROM products', function(err, res) {

  var table = new Table({ 
    head: ['ID', 'Product Name', 'Department', 'Price', 'StockQuantity']
  });

  console.log("");
  console.log("");
  console.log("");
  console.log("THESE ITEMS ARE AVAILABLE FOR SALE:");
  console.log("-----------------------------------");
  for (var i = 0; i < res.length; ++i) {
    table.push([
      res[i].ID, 
      res[i].ProductName, 
      res[i].Department, 
      res[i].Price, 
      res[i].StockQuantity
    ]);
  }
  console.log(table.toString());
  cb();
  })
}


// View Low Inventory Function---------------------------------------

function viewLowInven(cb) {
  connection.query("SELECT * FROM products WHERE StockQuantity < 5",
  function(err, res) {
    if (err) throw err;

// If there are no items that have low inventory---------------------
    if (res.length === 0) {
      console.log("There are currently no items with Low Inventory!")
      cb();
    } 
    else { 
      var table = new Table({ 
        head: ['ID', 'Product Name', 'Department', 'Price', 'StockQuantity']
      });
      
      for (var i = 0; i < res.length; ++i) {
        table.push([
          res[i].ID, 
          res[i].ProductName, 
          res[i].Department, 
          res[i].Price, 
          res[i].StockQuantity
        ]);
      } 
      console.log(table.toString());
      console.log("These are all the items that are low on inventory.")
      cb();
    }
  });
}

// Part 1 of Add to Inventory Function-------------------------------------
// Uses Inquirer Prompt to Ask Questions-----------------------------------

function addToInven() {
  var items = [];
  connection.query("SELECT ProductName FROM products", function(err, res) {
    if (err) throw err;
    for (var i = 0; i < res.length; i++) {
      items.push(
        res[i].ProductName
      );
    }

//Use Inquirer to ask which product you'd like to add inventory to---------
    
    inquirer.prompt([{
      name: "choices",
      type: "checkbox",
      message: "Which product would you like to add inventory for?",
      choices: items
    }]).then(function(user) {

//If nothing is selected run managerPrompt---------------------------------
        if (user.choices.length === 0) {
          console.log("Oops! You didn\'t select anything!");
          managerPrompt();
        } 
        else {
          addToInven2(user.choices);
        }
      });
  });
}


// This function allows you to add items-----------------------------------
function addToInven2(itemNames) {
  var item = itemNames.shift();
  var itemStock;
//connect to the database
  connection.query("SELECT StockQuantity FROM products WHERE ?", {
    ProductName: item
  }, function(err, res) {
      if (err) throw err;
      itemStock = res[0].StockQuantity;
      itemStock = parseInt(itemStock)
    });
    //Ask the user how many items they would like to add--------------------- 
    
    inquirer.prompt([{
      name: "amount",
      type: "text",
      message: "How many " + item + " would you like to add?",
      validate: function(str) {
        if (isNaN(parseInt(str))) {
          console.log("Sorry that is not a valid number!");
          return false;
        } 
        else {
          return true;
        }
      }
    }]).then(function(user) {
        var amount = user.amount
        amount = parseInt(amount);

//Update the database--------------------------------------------------------

        connection.query("UPDATE products SET ? WHERE ?", [{
            StockQuantity: itemStock += amount
        }, {
            ProductName: item
        }], function(err) {
              if (err) throw err;
            }); 
            if (itemNames.length != 0) {
              addToInven2(itemNames);
            } 
            else {
            console.log("Thank you, Your inventory has been updated.");
            managerPrompt();
            }
    });
}

function addNewProd() {
  inquirer.prompt([{
    name: "productID",
    type: "text",
    message: "Please enter the product ID of your new product."
  }, {
    name: "productName",
    type: "text",
    message: "Please enter the name of the product that you would like to add."
  }, {
      name: "department",
      type: "text",
      message: "Please enter the department you would like to add your product to.",
  }, {
      name: "price",
      type: "text",
      message: "Please enter the price for this product."
  }, {
      name: "stockQuantity",
      type: "text",
      message: "Plese enter the Stock Quantity for this item to be entered into current Inventory"
  }]).then(function(answer) {

    var newAddedProduct = "(" + answer.productID + ", '" + answer.productName + "', '" + answer.department + "', " + answer.price + ", " + answer.stockQuantity + ")"

//Adds products to the database--------------------------------------------

        connection.query("INSERT bamazonDB.products (ID, ProductName, Department, Price, StockQuantity) VALUES" + newAddedProduct, function(err) {
            if (err) throw err;
            console.log(answer.productName + " has been added successfully to your inventory.");
            managerPrompt();
          });
    });
}

managerPrompt();
