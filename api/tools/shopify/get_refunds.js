const { z } = require("zod");
const { GET_REFUNDS } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyGetRefunds extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_refunds"
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
            value: GET_REFUNDS
        });
    }

    extractRefunds(refunds){
        var fRefunds = [];

        for(var refund of refunds){
            var temp = {};
            temp['id'] = refund['id'];
            temp['order_id'] = refund['order_id'];
            temp['created_at'] = refund['created_at'];
            temp['processed_at'] = refund['processed_at'];
            temp['transactions'] = refund['transactions'];
            temp['refund_line_items'] = [];
            for(var item of refund['refund_line_items']){
                var tItem = {};
                tItem['quantity'] = item['quantity'];
                tItem['subtotal'] = item['subtotal'];
                tItem['total_tax'] = item['total_tax'];
                tItem['name'] = item['line_item']['name'];
                tItem['price'] = item['line_item']['price'];

                temp['refund_line_items'].push(tItem);
            }
            
            fRefunds.push(temp);
        }

        return fRefunds;
    }

    async _call(arg) {
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

                if(!arg['customer_id']){
                    return "Please provide your valid customer id or registered email to get refund details.";
                }

                const cancelledOrders = await this.shopify.customer.orders(arg['customer_id'], {"status": "cancelled"});
                cancelledOrders.sort((a, b) => {
                  return new Date(b.created_at) - new Date(a.created_at);
                });
                if(cancelledOrders.length === 0){
                    return "No cancelled order found!!!"
                }

                var refundDetails = JSON.stringify(this.extractRefunds(cancelledOrders[0].refunds));
                return refundDetails;
            }
            const response = await this.shopify.refund.list(arg['orderId']);
            return JSON.stringify(this.extractRefunds(response));    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetRefunds}; 