const Shopify = require('shopify-api-node');
const {ChatOpenAI} = require("@langchain/openai");
// export {ShopifyGetOrders} from './get_order.js';
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const {ShopifyGetOrders} = require("./get_order_list.js");
const {ShopifyGetProducts} = require("./get_product_list.js");
const {GetCustomerDetail} = require("./get_customer_detail.js");
const {GetCustomerList} = require("./get_customer_list.js");
const {SearchCustomers} = require("./get_customers_by_query.js");
const {GetCustomerOrders} = require("./get_customer_orders.js");
const {ShopifyGetOrderFulfillment} = require("./get_order_fulfillment.js");
const {ShopifyCancelOrder} = require("./cancel_order.js");
const {ShopifyGetProductVariants} = require("./get_product_variants.js");
const {ShopifyGetRefunds} = require("./get_refunds.js")
const {ShopifyCalculateRefund} = require("./calculate_refund.js")

const shopifyOptions = {
	shopName: sails.config.custom.SHOPIFY.shop_name,
	// apiKey: sails.config.custom.SHOPIFY.api_key,
	// password: sails.config.custom.SHOPIFY.api_secret_key,
	accessToken: sails.config.custom.SHOPIFY.admin_token,
	remaining: 30,
	current: 10,
	max: 40,
	autoLimit: true,
	baseUrl: "https://6cdc10-40.myshopify.com/"
}

console.log("From my code")

console.log(shopifyOptions);

const shopify = new Shopify(shopifyOptions);

async function fetchProducts(query){
	var response;
	try{
		response = await shopify.order.fulfillmentOrders(1003);

		console.log(response);
	}catch(e){
		console.log(e);
	}
	/*try{
		response = await shopify.customer.orders(6831207317581, {"status": "any"});

		console.log(response);
	}catch(e){
		console.log(e);
	}*/
	
	// response = await shopify.customer.list();
	// response = await shopify.customer.search({email: query});
	/*response = await shopify.product
	  	.list({ limit: 5, "status": "active", "published_status": "published" });*/
  	// response = await shopify.collectionListing.list();
  	return response;
}

async function fetchOrders(){
	console.log("Fetching orders")
	return await shopify.order
	  	.list({ limit: 5 });
}

async function getMetafields(){
	shopify.metafield
	  	.list({ metafield: { owner_resource: 'product'} })
		.then((metafields) => console.log(metafields))
  		.catch((err) => console.error(err));
}

async function getShopifyCustomerDetails(state){
	var {user} = state;

	const response = await shopify.customer.search({email: user.email});

	if(response.length > 0){
		response[0]['name'] = user['name'];
	}	

	return {
		user: response[0]
	}
}

async function shopifyAgent(state){
	const {llm, conversation, user} = state;

	var userQuery = conversation[conversation.length-1]['content'];

	var getProductListTool = new ShopifyGetProducts(shopifyOptions);
	var getCustomerDetailTool = new GetCustomerDetail(shopifyOptions);
	var getCustomerOrderTool = new GetCustomerOrders(shopifyOptions);
	var getOrderFulfillment = new ShopifyGetOrderFulfillment(shopifyOptions);
	// var calculateRefund = new ShopifyCalculateRefund(shopifyOptions);
	var cancelOrder = new ShopifyCancelOrder(shopifyOptions);
	var getProductVariants = new ShopifyGetProductVariants(shopifyOptions);
	var getRefunds = new ShopifyGetRefunds(shopifyOptions);

	const tools = [
		getProductListTool, 
		getCustomerDetailTool, 
		getCustomerOrderTool, 
		getOrderFulfillment,
		cancelOrder,
		getProductVariants,
		getRefunds
	];

	const shopifyAgent = await initializeAgentExecutorWithOptions(tools, llm, {
	    // agentType: "structured-chat-zero-shot-react-description",
	    agentType: "openai-functions",
	    verbose: true,
	});

	if(user && user.id){
		userQuery = `${userQuery}. Customer id is ${user.id}. You must return tool output as it is without any modification.`;	
	}else{
		userQuery = `${userQuery}. Note: Do not modify the output. Simply return what you receive from the tool.`;	
	}
	

	const result = await shopifyAgent.invoke({ input: userQuery });

	return {
		finalResult: result['output']
	}
}

async function mShopifyAgent(query){
	const llm = new ChatOpenAI({
	    modelName: "gpt-3.5-turbo-0125",//"gpt-4-turbo-preview",
	    temperature: 0,
	});

	var customerSearchTool = new SearchCustomers(shopifyOptions);
	var getProductListTool = new ShopifyGetProducts(shopifyOptions);
	// var getCustomerDetailTool = new GetCustomerDetail(shopifyOptions);
	var getCustomerOrderTool = new GetCustomerOrders(shopifyOptions);
	var getOrderFulfillment = new ShopifyGetOrderFulfillment(shopifyOptions);
	var calculateRefund = new ShopifyCalculateRefund(shopifyOptions);
	var cancelOrder = new ShopifyCancelOrder(shopifyOptions);
	var getProductVariants = new ShopifyGetProductVariants(shopifyOptions);
	var getRefunds = new ShopifyGetRefunds(shopifyOptions);

	const tools = [
		getProductListTool, 
		// getCustomerDetailTool, 
		getCustomerOrderTool, 
		getOrderFulfillment,
		getOrderFulfillment,
		calculateRefund,
		cancelOrder,
		getProductVariants,
		getRefunds,
		customerSearchTool
	];

	const shopifyAgent = await initializeAgentExecutorWithOptions(tools, llm, {
	    agentType: "structured-chat-zero-shot-react-description",
	    verbose: true,
	});

	query = `${query}. Note: Output must be same as returned by the tool.`;

	const result = await shopifyAgent.invoke({ input: query });
	    // Create Result {
	    //   output: 'I have created a draft email for you to edit. The draft Id is r5681294731961864018.'
	    // }
	console.log("Result", result);

	return result;
}

module.exports = {
	fetchOrders,
	fetchProducts,
	getMetafields,
	mShopifyAgent,
	shopifyAgent,
	getShopifyCustomerDetails
}