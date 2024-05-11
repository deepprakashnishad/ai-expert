module.exports = {
  attributes: {
    a: {model: "Agent"}, //Chatbot id
    ch: {type: "json", defaultsTo: []}, //Chat History
    ei: {type: "json", defaultsTo: {}}, //Useful Information Json
    p: {model: "Person"} //User
  },
};