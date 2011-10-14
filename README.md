# jsonQuery 1.0

An easy to use JSON selector, inspired by XPATH but tuned for javascript approach.

## Install

    npm install jsonQuery (not ready yet)

or

    git clone git://github.com/tibolan/jsonQuery.git
    cd jsonQuery
    npm link

## Exemple

    var jsonQuery = require("jsonQuery");


    var JSON = {
        users: [
            {
                id: "12",
                name: "Mark Down",
                hobbies: ["js", "css", "nodejs"],
                city: "San Fransisco"
            },
            {
                id: "24",
                name: "John Doe",
                hobbies: ["poker", "JackD"],
                city: "Las Vegas"
            },
            {
                id: "36",
                name: "Steve McGarrett",
                hobbies: ["Hair", "TalkieWalkie", "Waves"],
                city: "Honolulu"
            }
        ],

        currentID: "0000012",
        version: "1.0"
    }

    var $json = jsonQuery(JSON);

    $json.find("version"); // 1.0
    $json.find("users[0].id"); // 0000012
    $json.find("users[0].hobbies[1]"); // css
    $json.find("users[id>20]"); // users[2] && users[3]
    $json.find("users[id>20].first()"); // users[2]



