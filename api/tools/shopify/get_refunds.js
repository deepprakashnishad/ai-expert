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
                customer_email: z.string().optional().describe("A valid email id of user"),
                customer_phone: z.string().optional()
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
            arg['customer_id'] = await this.getCustomerId(arg);

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
            var cancelledOrder;
            for(var order of cancelledOrders){
                try{
                    if((!arg['orderId'] && orders.length===1) || (order.id === arg['orderId'] || order.order_number===parseInt(arg["orderId"].replace("#", ""), 10))){
                        cancelledOrder = order;
                        await this.shopify.refund.create(order.id);
                        break;
                    }
                }catch(e){
                    console.log(e);
                }
            }
            var refundDetails = JSON.stringify(this.extractRefunds(cancelledOrder.refunds));
            return refundDetails;
        }catch(ex){
            console.log(ex);
            return "Due to a technical issue we are unable to cancel this order right now.";
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetRefunds}; 