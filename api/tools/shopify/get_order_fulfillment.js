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
                customer_email: z.string().optional(),
                customer_phone: z.string().optional()
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

    /*expectedDeliveryDate(startDateStr, n=3) {
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
    }*/

    expectedDeliveryDate(startDateStr, n = 3, isWeekendDelivery=false) {
        // Parse the input date string
        const startDate = new Date(startDateStr);
        if (isNaN(startDate)) {
            throw new Error("Invalid date format. Please use 'YYYY-MM-DDTHH:mm:ss+TZD'.");
        }

        const currentDate = new Date();
        let daysAdded = 0;
        let futureDate = new Date(startDate);

        // Calculate the future date considering only weekdays
        while (daysAdded < n) {
            futureDate.setDate(futureDate.getDate() + 1);
            daysAdded++;
            // Check if the future date is a weekday (Monday to Friday)
            if ((futureDate.getDay() === 0 || futureDate.getDay() === 6) && !isWeekendDelivery) { // 0 = Sunday, 6 = Saturday
                daysAdded--;
            }
        }

        // Compare futureDate with currentDate
        if (futureDate < currentDate) {
            return -1; // Future date is in the past
        } else if (futureDate.toDateString() === currentDate.toDateString()) {
            return 0; // Future date is the same as the current date
        }

        // Format the future date for output
        const options = { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' };
        return futureDate.toLocaleDateString('en-US', options);
    }



    async _call(arg) {
        var response;
        try{

            arg['customer_id'] = await this.getCustomerId(arg);

            if(!arg['customer_id']){
                return "Please provide your valid registered email or phone to get order fulfillment details.";
            }

            const orders = await this.shopify.customer.orders(arg['customer_id'], {"status": "any"});
            orders.sort((a, b) => {
              return new Date(b.created_at) - new Date(a.created_at);
            });
            if(orders.length === 0){
                return "No order found!!!";
            }
            var selectedOrder = orders[0];
            for(var order of orders){
                if((!arg['orderId'] && orders.length===1) || (order.id === arg['orderId'] || order.order_number===parseInt(arg["orderId"].replace("#", ""), 10))){
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

            let expectedDeliveryDate = this.expectedDeliveryDate(selectedOrder.created_at);

            if(expectedDeliveryDate===0){
                expectedDeliveryDate = "Your order should arrive by today.";
            }else if(expectedDeliveryDate<0){
                if(fulfillments.length>0){
                    expectedDeliveryDate = "Your order should have reached you by now. Please use the tracking url provided to track the order.";    
                }else{
                    expectedDeliveryDate = "Your order should have reached you by now. Please contact customer care about the delivery.";    
                }
                
            }

            return JSON.stringify({
                "fulfillments": fulfillments, 
                "order_status_url": selectedOrder.order_status_url,
                "fulfillment_status": selectedOrder.fulfillment_status,
                "expected_delivery": expectedDeliveryDate
            });
        }catch(e){
            console.log(e)
        }
        return "Due to technical issue unable to fetch the results right now. Try again later.";
    }
}
 
module.exports = {ShopifyGetOrderFulfillment}; 