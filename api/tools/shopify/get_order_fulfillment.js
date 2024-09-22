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

    expectedDeliveryDate(startDateStr, n=8) {
        // Parse the input date string
        const startDate = new Date(startDateStr);
        if (isNaN(startDate)) {
            throw new Error("Invalid date format. Please use 'YYYY-MM-DDTHH:mm:ss+TZD'.");
        }

        let daysAdded = 0;
        let futureDate = new Date(startDate);

        while (daysAdded < n) {
            futureDate.setDate(futureDate.getDate() + 1);
            // Check if the future date is a weekday (Monday to Friday)
            if (futureDate.getDay() !== 0 && futureDate.getDay() !== 6) { // 0 = Sunday, 6 = Saturday
                daysAdded++;
            }
        }

        // Format the future date
        const options = { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' };
        return futureDate.toLocaleDateString('en-US', options);
    }


    async _call(arg) {
        var response;
        try{
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
                return "Please provide your valid customer id or registered email to get order fulfillment details.";
            }

            const orders = await this.shopify.customer.orders(arg['customer_id'], {"status": "any"});
            if(orders.length === 0){
                return "No order found!!!";
            }
            var selectedOrder = orders[0];
            for(var order of orders){
                if((!arg['orderId'] && orders.length===1) || (order.id === arg['orderId'] || order.order_number===arg['orderId'])){
                    selectedOrder = order;
                    break;
                }
            }
            if(!selectedOrder){
                return "No order found!!!";
            }
            // order['id'] = orders[0]['id'];
            var fulfillments = this.extractFulfillments(selectedOrder.fulfillments);
            // order['fulfillments'] = fulfillments;

            return JSON.stringify({
                "fulfillments": fulfillments, 
                "order_status_url": selectedOrder.order_status_url,
                "fulfillment_status": selectedOrder.fulfillment_status,
                "expected_delivery": this.expectedDeliveryDate(selectedOrder.created_at)
            });
        }catch(e){
            console.log(e)
        }
        return "Due to technical issue unable to fetch the results right now. Try again later.";
    }
}
 
module.exports = {ShopifyGetOrderFulfillment}; 