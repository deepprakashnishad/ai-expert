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
                orderId: z.number().optional(),
                customer_email: z.string().optional().describe("A valid email id of user"),
                customer_phone: z.string().optional(),
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
            if(!arg['customer_phone'] && !arg['customer_email']){
                return "Please provide your customer id or email to cancel an order.";
            }else if(arg['customer_phone']){
                try{
                    let response = await this.shopify.customer.search({phone: arg['customer_phone']});
                    if(response.length>1){
                        throw new Error("Multiple customers found!");
                    }
                    arg['customer_id'] = response[0]['id'];
                }catch(e){
                    let response = await this.shopify.customer.search({email: arg['customer_email']});
                    if(response.length>1){
                        throw new Error("Multiple customers found!");
                    }
                    arg['customer_id'] = response[0]['id'];    
                }
            }else if(arg['customer_email']){
                let response = await this.shopify.customer.search({email: arg['email']});
                arg['customer_id'] = response[0]['id'];    
            }
            var orders = await this.shopify.customer.orders(arg['customer_id']);
            orders.sort((a, b) => {
              return new Date(b.created_at) - new Date(a.created_at);
            });
            
            if(!arg['orderId'] && orders.length > 1){
                var orderNumberList = orders.map(ele => ele.order_number);
                var orderNumbers = orderNumberList.join(", ");
                return `Multiple orders present with following numbers ${orderNumbers}. Which order you want to cancel?`
            }

            var selectedOrder;

            for(var order of orders){
                try{
                    if((!arg['orderId'] && orders.length===1) || (order.id === arg['orderId'] || order.order_number===parseInt(arg["orderId"].replace("#", ""), 10))){
                        selectedOrder = order;                        
                        break;
                    }
                }catch(e){
                    console.log(e);
                }
            }
            if(!selectedOrder){
                return "Order cannot be cancelled. Check if the given order number is correct or not.";
            }
            // var order = await this.shopify.order.get(arg['orderId']);
            
            const cancelOrderResponse = await this.shopify.order.cancel(selectedOrder.id/*, {"amount": selectedOrder.total_price, "currency": selectedOrder.currency, "email": selectedOrder.email}*/);
            if(response['request_status']==="cancellation_requested"){
                try{
                    var response = await this.shopify.refund.create(selectedOrder.id);
                    return JSON.stringify({msg:`Order with order number ${order.number} has been cancelled successfully and refund has been created with id ${response['refund']['id']}`, order_detail: cancelOrderResponse});    
                }catch(e){
                    console.log(e);
                }
            }
            return JSON.stringify({msg:`Order with order number ${cancelOrderResponse.number} has been cancelled successfully`, order_detail: cancelOrderResponse});    
        }catch(ex){
            console.log(ex);
            return "Due to a technical issue we are unable to cancel this order right now.";
        }
        return "Due to a technical issue we are unable to cancel this order right now.";
    }
}
 
module.exports = {ShopifyCancelOrder}; 