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


var bamCustomer = function() {
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
    
// Use inquirer to ask which item you want to buy and quantity of that item
    inquirer.prompt([{  
      name: "itemId",
      type: "input",
      message: "What is the item ID you would like to purchase?",
      validate: function(value) {
        if(isNaN(value) == false) {
          return true;
        }
        else {
          return false;
        }
      }
    }, {
        name: "Quantity",
        type: "input",
        message: "How many of this item would you like to purchase?",
        validate: function(value) {
            if(isNaN(value) == false) {
              return true;
            }
            else {
              return false;
            }
          }
        }
    ]).then(function(answer) {
        var chosenId = answer.itemId - 1;
        var chosenProduct = res[chosenId];
        var chosenQuantity = answer.Quantity;
        if(chosenQuantity < chosenProduct.StockQuantity) {
          console.log("Your total for " + "(" + answer.Quantity + ")" + "-" + chosenProduct.ProductName + " is: " + chosenProduct.Price.toFixed(2) * chosenQuantity);
          connection.query("UPDATE products SET ? WHERE ?", [{
              StockQuantity: chosenProduct.StockQuantity - chosenQuantity
          }, {
              id: answer.itemId
          }], function(err, res) {
              bamCustomer();
          });
        }
        else {
          console.log("SORRY, INSUFFICIENT QUANTITY IN STORE. CHECK BACK ANOTHER TIME.");
          bamCustomer();
        }
    })
  });
}

bamCustomer();