const Shopify = require('shopify-api-node');
const {ChatOpenAI} = require("@langchain/openai");
// export {ShopifyGetOrders} from './get_order.js';
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const {ShopifyGetOrders} = require("./get_order.js");
const {ShopifyGetProducts} = require("./get_product_list.js");
const {GetCustomerDetail} = require("./get_customer_detail.js");
const {GetCustomerList} = require("./get_customer_list.js");
const {SearchCustomers} = require("./get_customers_by_query.js");
const {GetCustomerOrders} = require("./get_customer_orders.js");

const shopifyOptions = {
	shopName: sails.config.custom.SHOPIFY.shop_name,
	// apiKey: sails.config.custom.SHOPIFY.api_key,
	// password: sails.config.custom.SHOPIFY.api_secret_key,
	accessToken: sails.config.custom.SHOPIFY.admin_token,
	remaining: 30,
	current: 10,
	max: 40,
	autoLimit: true
}

console.log("From my code")

console.log(shopifyOptions);

const shopify = new Shopify(shopifyOptions);

async function fetchProducts(){
	var response = await shopify.product
	  	.list({ limit: 5, "status": "active", "published_status": "published" });
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

async function mShopifyAgent(query){
	const llm = new ChatOpenAI({
	    modelName: "gpt-4-turbo-preview",
	    temperature: 0,
	});

	var getOrderListTool = new ShopifyGetOrders(shopifyOptions);
	var getProductListTool = new ShopifyGetProducts(shopifyOptions);
	var getCustomerDetailTool = new GetCustomerDetail(shopifyOptions);
	var getProductTool = new GetCustomerList(shopifyOptions);
	var getCustomerOrderTool = new GetCustomerOrders(shopifyOptions);
	var searchCustomersTool = new SearchCustomers(shopifyOptions);

	const tools = [getOrderListTool, getProductListTool, getCustomerDetailTool, getProductTool, getCustomerOrderTool, searchCustomersTool];

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
	mShopifyAgent
}