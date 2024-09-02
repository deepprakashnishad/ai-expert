const { z } = require("zod");
const { GET_ORDER_FULFILLMENT } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyGetOrderFulfillment extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_order_fulfillment"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                orderId: z.number().optional(),
                customer_id: z.number().optional(),
                customer_email: z.string().optional()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_ORDER_FULFILLMENT
        });
    }

    extractFulfillments(fulfillments){
        var mFulfillments = [];
        for(var fulfillment of fulfillments){
            var temp = fulfillment;
            
            mFulfillments.push(temp);
        }
        return mFulfillments;
    }

    async _call(arg) {
        var response;
        try{
            if(!arg['orderId']){
                if(!arg['customer_id']){
                    if(!arg['customer_email']){
                        return "Need orderId or customer email or customer id to get refund details."
                    }else{
                        var customers = await this.shopify.customer.search({email: arg['customer_email']});
                        if(customers.length === 0){
                            return "Shopify account for given email doesn't exist"
                        }

                        arg['customer_id'] = customers[0].id;
                    }
                }
                const orders = await this.shopify.customer.orders(arg['customer_id'], {"status": "open"});
                if(orders.length === 0){
                    return "No cancelled order found!!!"
                }
                var order = {};
                order['id'] = orders[0]['id'];
                var fulfillments = this.extractFulfillments(orders[0].fulfillments);
                order['fulfillments'] = fulfillments;
                return JSON.stringify(order);
            }
            response = await shopify.order.fulfillmentOrders(arg['orderId']);
            return JSON.stringify(response);    
        }catch(e){
            console.log(e)
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetOrderFulfillment}; 