module.exports = {
  attributes: {
    p: {model: "Person"},
    a: {model: "Agent"},
    b: {model: "ChatBot"}, //Chatbot id
    md: {type: "json"}, // Metadata
    cat:{type: "string", defaultsTo: "generic"}, //Information category
    it: {type: "string"}, //Input text
    itt: {type: "string"}, //Input text type
    e: {type: "json"} //Embeddings
  },
};