const { z } = require("zod");
const { GET_CUSTOMER_ORDERS } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class GetCustomerOrders extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_customer_orders"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                customer_email: z.string().optional(),
                customer_phone: z.string().optional(),
                customer_id: z.number(),
                orderNumber: z.number().optional(),
                status: z.enum(["open", "closed", "cancelled", "any"]).optional()
            })/*.refine(data => 
                data.customer_id !== undefined || 
                data.customer_phone !== undefined || 
                data.customer_email !== undefined, 
                {
                    message: "At least one of customer_id, customer_phone, or customer_email must be provided",
                    path: ["customer_id", "customer_phone", "customer_email"]
                }
            )*/
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_CUSTOMER_ORDERS
        });
    }

    extractOrders(orders){
        var fOrders = [];
        for(var order of orders){
            if(order.financial_status==="refunded"){
                continue;
            }
            var temp = {};
            temp["contact_email"] = order['contact_email'];
            temp['created_at'] = order['created_at'];
            temp['currency'] = order['currency'];
            temp['subtotal_price'] = order['current_subtotal_price'];
            temp['total_additional_fees_set'] = order['current_total_additional_fees_set'];
            temp['total_discounts'] = order['current_total_discounts'];
            temp['total_price'] = order['current_total_price'];
            temp['total_tax'] = order['current_total_tax'];
            temp['discount_codes'] = order['discount_codes'];
            temp['email'] = order['email'];
            temp['financial_status'] = order['financial_status'];
            temp['fulfillment_status'] = order['fulfillment_status'];
            temp['order_number'] = order['order_number'];
            temp['order_status_url'] = order['order_status_url'];
            temp['phone'] = order['phone'];
            temp['tax_lines'] = order['tax_lines'];
            temp['billing_address'] = order['billing_address'];
            temp['line_items'] = order['line_items'];
            temp['shipping_address'] = order['shipping_address'];
            fOrders.push(temp);
        }
        return fOrders;
    }

    async _call(arg) {
        if(!arg['customer_id']){
            return "Please provide your valid customer id or registered email to get list of orders.";
        }
        var customer_id = arg['customer_id'];
        if(!customer_id){
            return JSON.stringify({msg: "No valid customer found for the provided email and phone"})
        }
        const response = await this.shopify.customer.orders(customer_id, arg);
        const orders = this.extractOrders(response);
        if(!arg['orderNumber']){
        	orders.sort((a, b) => {
	          return new Date(b.created_at) - new Date(a.created_at);
	        });
	        return JSON.stringify(orders);
        }else{
        	const order = orders.find(order => order.order_number === givenOrderNumber);
        	return JSON.stringify(order);
        }
    }
}
 
module.exports = {GetCustomerOrders}; 