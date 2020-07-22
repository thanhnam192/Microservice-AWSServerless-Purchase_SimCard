
const AWS = require('aws-sdk');
AWS.config.update({region: 'ap-southeast-2'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const PHONE_CARD_RESULT_SQS_URL = process.env.PHONE_CARD_RESULT_SQS_URL;
const PHONE_CARD_ORDER_SQS_URL = process.env.PHONE_CARD_ORDER_SQS_URL;
const PhoneCardOrder = require('../../model/PhoneCardOrder');
const OrderStatus = require('../../model/OrderStatusEnum');

exports.handler = async (event) => {
    console.log(event);
    const message = event.Records[0];
    if( !message ) return;

    const body = JSON.parse(message.body);
    console.log("body");
    console.log(JSON.stringify(body, null, 2));

    const phoneCardOrder = new PhoneCardOrder(body);

     if (  phoneCardOrder.mockSpeed && phoneCardOrder.mockSpeed.toLowerCase() === "slow"  ) {
         console.log("Mock Speed: SLOW");
         console.log("Simulate case 3rd party process order very slow (30 ~ 120 seconds)");

        await new Promise(resolve => setTimeout(resolve, 31 * 1000));
        phoneCardOrder.cardNumber = Math.floor(100000000 + Math.random() * 900000000);
        phoneCardOrder.status = OrderStatus.FINISH;
        phoneCardOrder.message = "Your Phone Card Order is successfully - Slow Case";

    } else if ( phoneCardOrder.mockSpeed && phoneCardOrder.mockSpeed.toLowerCase() === "error" ) {
         console.log("Mock Speed: ERROR");
         console.log("Simulate case 3rd got error when processing order");
        phoneCardOrder.cardNumber = "";
        phoneCardOrder.status = OrderStatus.ERROR;
        phoneCardOrder.message = "3rd party failed when processing order - Error Case";
    } else {
         console.log("Mock Speed: FAST/NORMAL");
         console.log("Simulate case 3rd process order fast/normal");
        phoneCardOrder.cardNumber = Math.floor(100000000 + Math.random() * 900000000);
        phoneCardOrder.status = OrderStatus.FINISH;
        phoneCardOrder.message = "Your Phone Card Order is successfully - Fast Case";
    }



    // send message to success queue
    console.log("phoneCardOrder");
    console.log(JSON.stringify(phoneCardOrder, null, 2));
    const params = {
        MessageBody: JSON.stringify(phoneCardOrder),
        QueueUrl: PHONE_CARD_RESULT_SQS_URL
    };
    console.log("Send message to success queue");
    await  sqs.sendMessage(params).promise();
    //delete message
    const deleteParam = {
        ReceiptHandle: message.receiptHandle,
        QueueUrl: PHONE_CARD_ORDER_SQS_URL
    };
    console.log("deleteParam");
    console.log(JSON.stringify(deleteParam, null, 2));
    await sqs.deleteMessage(deleteParam).promise();
}
