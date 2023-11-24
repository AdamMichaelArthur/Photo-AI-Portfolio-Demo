import Stripe from '../stripe.js'

export default class PaymentMethods extends Stripe {

  constructor(){
    super();
  }

  attachPaymentMethod(paymentMethodId ="", customerId =""){
  	
  }

}