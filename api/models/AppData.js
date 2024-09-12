module.exports = {
  attributes: {
  	type: {type: "string", required: true}, // Type of data
    cid: {type: "string", required: true}, // Client Id or App Id
    data: {type: "json", required: true}, // Data
  },

  beforeCreate: async function (valuesToSet, proceed) {
    valuesToSet.type = valuesToSet.type.toLowerCase();
    if(valuesToSet.type==="shopify"){
      if(valuesToSet.data && valuesToSet.data.shopName && valuesToSet.data.apiKey && valuesToSet.data.password && valuesToSet.data.accessToken && valuesToSet.data.storeToken  && valuesToSet.data.baseUrl){
        return proceed();
      }else{
        return null;
      }
    } else if(valuesToSet.type === "template"){
      if(valuesToSet.data && valuesToSet.data.html && valuesToSet.data.templateName){
        return proceed();
      }else{
        return null;
      } 
    } if(valuesToSet.type==="database"){
      if(valuesToSet.data && valuesToSet.data.dbType && valuesToSet.data.username && valuesToSet.data.hostname && valuesToSet.data.database && valuesToSet.data.password && valuesToSet.data.port){
        return proceed();
      }else{
        return null;
      }
    }
    
    return proceed();
  },
  beforeUpdate: async function (valuesToSet, proceed) {
    valuesToSet.type = valuesToSet.type.toLowerCase();
    if(valuesToSet.type==="shopify"){
      if(valuesToSet.data && valuesToSet.data.shopName && valuesToSet.data.apiKey && valuesToSet.data.password && valuesToSet.data.accessToken && valuesToSet.data.storeToken  && valuesToSet.data.baseUrl){
        return proceed();
      }else{
        return null;
      }
    } else if(valuesToSet.type === "template"){
      if(valuesToSet.data && valuesToSet.data.html && valuesToSet.data.templateName){
        return proceed();
      }else{
        return null;
      } 
    } if(valuesToSet.type==="database"){
      if(valuesToSet.data && valuesToSet.data.dbType && valuesToSet.data.username && valuesToSet.data.hostname && valuesToSet.data.database && valuesToSet.data.password && valuesToSet.data.port){
        return proceed();
      }else{
        return null;
      }
    }
    return proceed();
  },
};