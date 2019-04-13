// need to change prompts to make the user insert inputs of the item id and how many items the user would like to purchase then subtract from the database.

var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table3");
var login = require("./login");

// first establish a connection with mysql server and display a log of the table.
var connection = mysql.createConnection({
    host: login.host,
    port: login.port,
    user: login.user,
    password: login.password,
    database: login.database
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connection made with server at " + connection.threadId);
    initShop();
});

function displayTable() {
    connection.query("SELECT * FROM rockinzon_db.products", function(err, res) {
        if (err) throw err;
        var table = new Table({
            head: ["Id", "Name", "Price", "Quantity"],
            colWidths: [20, 40, 20, 20]
        });

        for (var i = 0; i < res.length; i++) {
            table.push([
                res[i].item_id,
                res[i].product_name,
                "$" + res[i].price + ".00",
                res[i].stock_quantity
            ]);
        }

        console.log(table.toString());
    });
}

function initShop() {
    displayTable();
    connection.query(
        "SELECT item_id, product_name, price FROM rockinzon_db.products",
        function(err, result) {
            if (err) throw err;
            inquirer
                .prompt({
                    type: "rawlist",
                    name: "choice",
                    message: "what would you like to purchase?",
                    choices: function() {
                        var choicesArr = [];
                        for (var i = 0; i < result.length; i++) {
                            choicesArr.push(result[i].product_name);
                        }
                        return choicesArr;
                    }
                })
                .then(function(answers) {
                    var productChosen = answers.choice;
                    connection.query(
                        "SELECT product_name, price, stock_quantity FROM rockinzon_db.products WHERE product_name=?",
                        [productChosen],
                        function(err, res) {
                            if (err) throw err;
                            var itemStock = res[0].stock_quantity;
                            var itemName = res[0].product_name;
                            var numberPrice = parseFloat(res[0].price);
                            var itemPrice = "$" + res[0].price + ".00";
                            inquirer
                                .prompt([
                                    {
                                        type: "input",
                                        name: "howMany",
                                        message:
                                            "How many would you like to purchase?",
                                        validate: function(value) {
                                            if (isNaN(value) === false) {
                                                return true;
                                            }
                                            return false;
                                        }
                                    }
                                ])
                                .then(function(answers) {
                                    var quantity = answers.howMany;
                                    console.log(quantity);
                                    if (quantity <= itemStock) {
                                        //change stock quantity on mysql
                                        var minusQuantity =
                                            "UPDATE rockinzon_db.products SET stock_quantity = stock_quantity" +
                                            " - " +
                                            quantity;

                                        connection.query(
                                            minusQuantity +
                                                " WHERE product_name=?",
                                            [productChosen],
                                            function(err, res) {
                                                if (err) throw err;
                                                console.log(
                                                    "Congrats on your purchase, you've bought " +
                                                        quantity +
                                                        " " +
                                                        productChosen +
                                                        " for " +
                                                        "$" +
                                                        numberPrice * quantity +
                                                        ".00"
                                                );
                                                setTimeout(function() {
                                                    console.clear();
                                                    initShop();
                                                }, 5000);
                                            }
                                        );
                                    } else {
                                        console.log(
                                            "sorry, the item is not available anymore"
                                        );
                                        setTimeout(function() {
                                            console.clear();
                                            initShop();
                                        }, 5000);
                                    }
                                });
                        }
                    );
                });
        }
    );
}
