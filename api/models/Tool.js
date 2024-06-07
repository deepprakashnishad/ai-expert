module.exports = {
  attributes: {
    name: {
        type: "String",
        unique: true,
        required: true
    },
    description:{
        type: "string",
        required: true
    },
    type: {
        type: "string",
        required: true    
    }
  },
};
