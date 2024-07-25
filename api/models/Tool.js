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
    },
    api_name: {
        type: "string"
    },
    required_parameters: {
        type: "json",
        defaultsTo: []
    },
    optional_parameters: {
        type: "json",
        defaultsTo: []
    },
    method: {
        type: "string"
    },
    template_response:{
        type: "json"
    },
    api_url: {
        type: "string"
    }
  },
};
