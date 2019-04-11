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

// connection.connect(function(err) {
//     if (err) throw err;
//     console.log("connection made with server at " + connection.threadId);
//     initShop();
// });

displayTable();

function displayTable() {
    connection.query("SELECT * FROM rockinzon_db.products", function(err, res) {
        if (err) throw err;
        var table = new Table({
            head: ["Name", "Price", "Quantity"],
            colWidths: [40, 40]
        });

        for (var i = 0; i < res.length; i++) {
            table.push([
                res[i].product_name,
                "$" + res[i].price + ".00",
                res[i].stock_quantity
            ]);
        }

        console.log(table.toString());
    });
}

function initShop() {
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
                            var itemName = res[0].product_name;
                            var itemPrice = "$" + res[0].price + ".00";
                            inquirer
                                .prompt([
                                    {
                                        type: "list",
                                        name: "choice",
                                        message:
                                            "Would you like to purchase a " +
                                            itemName +
                                            " for " +
                                            itemPrice +
                                            "?",
                                        choices: ["Yes", "No"]
                                    }
                                ])
                                .then(function(answers) {
                                    var confirm = answers.choice;

                                    if (confirm === "Yes") {
                                        //change stock quantity on mysql
                                        connection.query(
                                            "UPDATE rockinzon_db.products SET stock_quantity = stock_quantity - 1  WHERE product_name=?",
                                            [productChosen],
                                            function(err, res) {
                                                if (err) throw err;
                                                console.log(
                                                    "congrats on your purchase"
                                                );
                                            }
                                        );
                                    } else {
                                        initShop();
                                    }
                                });
                        }
                    );
                });
        }
    );
}
