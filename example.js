/* exemple of use */

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

console.log($json.find("version")); // 1.0
console.log($json.find("users[0].id")); // 0000012
console.log($json.find("users[0].hobbies[1]")); // css
console.log($json.find("users[id>20]")); // [users[2], users[3]]
console.log($json.find("users[id>20].first()")); // users[2]
