module.exports = {
  attributes: {
    n: {type: "string", required: true}, // Name of chatbot
    p: {model: "Person", required: true},
    l: {type: "string"}, //Logo url
    si: { //Styling Info
      type: "string"
    }
  },
};