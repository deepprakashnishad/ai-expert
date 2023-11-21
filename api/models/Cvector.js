module.exports = {
  attributes: {
    p: {model: "Person"},
    b: {model: "ChatBot"}, //Chatbot id
    it: {type: "string"}, //Input text
    itt: {type: "string"}, //Input text type
    e: {type: "json"} //Embeddings
  },
};