module.exports = {

  friendlyName: 'Product strength & weakness generator',


  description: 'Generate product strength and weekneed from set of reviews',


  inputs: {
    reviews:{
      type: "json",
      required: true
    },
    prevSWOTResult: {
      type: "json",
      defaultsTo: "{s:[{l:'',f:0}, {l:'',f:0}],w:[],o:[],t:[]}"
    },
    max_tokens: {
      type: "number",
      defaultsTo: 1600
    }
  },

  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
  	try{
      var messages = [{
        "role": "system",
        "content": `You are a professional sentiment analyzer. You perform sentiment analysis and provide top 3 trends. You may be provided with sumarized sentiment done earlier based on previous batch of reviews. This sentiment should also be taken into consideration. In case reviews are insufficient to form a sentiment then reply that more reviews are required to judget he trend.`
        /*"content": `You are a professional SWOT analyzer who gives summary of strength, weaknesses, opportunities and threats based on reviews provided. You are also provided with previous SWOT analysis result so that if review is stating same thing simply increase frequency of the same. You reply should be in a json format as follows where each key represents each letter SWOT and each point should as consise and short as possible. l represents particular feature or feedback and f represents frequency:
          {s:[{l:'',f:0}, {l:'',f:0}],w:[],o:[],t:[]} 
        `*/
      }, {
        role: "user",
        "content": `{
          reviews: ${inputs.reviews},
          prevSWOTResult: ${inputs.prevSWOTResult}
        }`
      }];

      var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": inputs.max_tokens?inputs.max_tokens:2500});
      return exits.success(result);
  	}catch(e){
  		console.log(e);
  	}  	
  }
};