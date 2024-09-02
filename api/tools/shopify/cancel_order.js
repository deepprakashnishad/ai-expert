const { z } = require("zod");
const { CANCEL_ORDER } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyCancelOrder extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "shopify_cancel_order"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                orderId: z.number(),
                customer_email: z.string().optional(),
                customer_id: z.string().optional(),
                cancellation_reason: z.string().default("customer")
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: CANCEL_ORDER
        });
    }

    async _call(arg) {
        try{
            var orders = await this.shopify.customer.orders(arg['customer_id']);
            var selectedOrder;
            for(var order of orders){
                if(order.id === arg['orderId'] || order.order_number===arg['orderId']){
                    selectedOrder = order;
                }
            }
            if(!selectedOrder){
                return "Order cannot be cancelled. Check if the given order number is correct or not.";
            }
            // var order = await this.shopify.order.get(arg['orderId']);
            
            const response = await this.shopify.order.cancel(selectedOrder.id, {"amount": selectedOrder.total_price, "currency": selectedOrder.currency, "email": selectedOrder.email});
            return JSON.stringify(response);    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyCancelOrder}; 