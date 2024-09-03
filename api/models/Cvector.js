module.exports = {
  schema: true,
  attributes: {
  	cid: {type: "string"}, // Client Id
  	aid: {model: "Agent"}, // agent id
    md: {type: "json"}, // Metadata
    cat:{type: "string", defaultsTo: "generic"}, //Information category
    it: {type: "string"}, //Input text
    itt: {type: "string"}, //Input text type
    e: {type: "json"}, //Embeddings
    d: {model: "UploadedDocument"}
  },
};