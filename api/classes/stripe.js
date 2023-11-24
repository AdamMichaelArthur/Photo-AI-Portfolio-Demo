var express = require("express");
var router = express.Router();
var Mongo = require("@classes/mongo");
var mongoose = require("mongoose");
var Model = mongoose.model("Stripe");
var helpers = require("@classes/helpers");
var validation = require("@classes/validation");
var voca = require("voca");

router.get(
  "/createPaymentIntent",
  validation.checkInput({
    amount: "Number",
    currency: { type: "String", optional: true }
  }),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    var currency = "usd";
    var amount = req.body.amount;
    if (req.body.currency != null) {
      currency = req.body.currency;
    }
    await stripe.createPaymentIntent(amount, currency);
  },
  validation.checkOutput({})
);

// List Products
router.get(
  "/products",
  validation.checkInput({}),
  listProducts,
  validation.checkOutput({})
);

async function listProducts(req, res, next) {
  var stripe = new Stripe(req, res, next);
  await stripe.listProducts();
}

router.get(
  "/product/id/:id",
  validation.checkInput({}),
  getProduct,
  validation.checkOutput({})
);

async function getProduct(req, res, next) {
  var stripe = new Stripe(req, res, next);
  await stripe.getProduct(req.params.id);
}

router.delete(
  "/product/id/:id",
  validation.checkInput({}),
  deleteProduct,
  validation.checkOutput({})
);

async function deleteProduct(req, res, next) {
  var stripe = new Stripe(req, res, next);
  await stripe.deleteProduct(req.params.id);
}

router.post(
  "/product",
  validation.checkInput({
    productName: "String",
    productDescription: { type: "String", optional: true }
  }),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.createProduct(
      req.body.productName,
      req.body.productDescription
    );
  },
  validation.checkOutput({})
);

router.get(
  "/customer/id/:id",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.getCustomer(req.params.id);
  },
  validation.checkOutput({})
);

router.get(
  "/customers",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.getCustomers();
  },
  validation.checkOutput({})
);

router.delete(
  "/customer/id/:id",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.deleteCustomer(req.params.id);
  },
  validation.checkOutput({})
);

router.post(
  "/customer",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.createCustomer();
  },
  validation.checkOutput({})
);

router.patch(
  "/customer",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.updateCustomer();
  },
  validation.checkOutput({})
);

router.get(
  "/plan/id/:id",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.getPlan(req.params.id);
  },
  validation.checkOutput({})
);

router.get(
  "/plans",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.getPlans();
  },
  validation.checkOutput({})
);

router.delete(
  "/plan/id/:id",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.deletePlan(req.params.id);
  },
  validation.checkOutput({})
);

/* POST Create Plan */
router.post(
  "/plan",
  validation.checkInput({
    id: "String",
    productId: "String",
    amount: "Number",
    metadata: { type: "Object", optional: true }
  }),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    // Since metadata is optional, we need to check and see if it was supplied
    if (typeof req.body.metadata != "undefined")
      await stripe.createPlan(
        req.body.id,
        req.body.productId,
        req.body.amount,
        req.body.metadata
      );
    else
      await stripe.createPlan(req.body.id, req.body.productId, req.body.amount);
  },
  validation.checkOutput({})
);

router.patch(
  "/plan",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.updatePlan();
  },
  validation.checkOutput({})
);

router.get(
  "/subscription/id/:id",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.getSubscription(req.params.id);
  },
  validation.checkOutput({})
);

router.get(
  "/subscriptions",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.getSubscriptions();
  },
  validation.checkOutput({})
);

router.delete(
  "/subscription/id/:id",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.deleteSubscription(req.params.id);
  },
  validation.checkOutput({})
);

router.post(
  "/subscription",
  validation.checkInput({
    planId: "String"
  }),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.createSubscription(req.body.planId);
  },
  validation.checkOutput({})
);

router.patch(
  "/subscription/id/:id/plan/:plan",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.updateSubscription(req.params.id, req.params.plan);
  },
  validation.checkOutput({})
);

router.post(
  "/method",
  validation.checkInput({
    paymentMethod: "Object"
  }),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    console.log(255, req.body.paymentMethod)
    await stripe.addPaymentMethod(req.body.paymentMethod);
  },
  validation.checkOutput({})
);

router.delete(
  "/method/id/:id",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.deletePaymentMethod(req.params.id);
  },
  validation.checkOutput({})
);

router.get(
  "/methods",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.getPaymentMethods();
  },
  validation.checkOutput({})
);

router.post(
  "/associate",
  validation.checkInput({
    paymentMethodId: "String"
  }),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.associatePaymentMethod(req.body.paymentMethodId);
  },
  validation.checkOutput({})
);

router.post(
  "/source",
  validation.checkInput({
    paymentMethodId: "String"
  }),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.associatePaymentMethod(req.body.paymentMethodId);
  },
  validation.checkOutput({})
);

/* Set Default Payment Method */
router.post(
  "/default/id/:id",
  validation.checkInput({}),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.defaultPaymentMethod(req.params.id);
  },
  validation.checkOutput({})
);

/*	POST /charge/account
	Initiates a one-time charge
	User must be logged in and authenticated and have a default payment
	method on file.
*/
router.post(
  "/charge",
  validation.checkInput({
    amount: "Number"
  }),
  async function(req, res, next) {
    var stripe = new Stripe(req, res, next);
    await stripe.chargeOnce(req.body.amount);
  },
  validation.checkOutput({})
);

class Stripe {
  constructor(req, res, next) {
    //if(typeof req != 'undefined'){
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    //}
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    this.stripe = stripe;
  }

  output(Obj) {
    var defaultResponse = helpers.defaultResponseObject("stripe");
    defaultResponse["stripe"] = Obj;
    this.res.status(200);
    this.res.json(defaultResponse);
  }

  error(err) {
    console.log(352, err);
    console.log(352)
    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    if (err.raw.message != null) {
      defaultErrorResponse.error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }

    this.res.status(200);
    this.res.json(defaultErrorResponse);
  }

  async createPaymentIntent(amount, currency) {
    // Do some validation on the amount and currency objects

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: currency
    });
    this.paymentIntent = paymentIntent;
    this.output(paymentIntent);
  }

  /*	A 'SetupIntent' is a Stripe Objec that is used to so that we can collect
		and save Credit Card information now, and use it later.
		
	*/
  async createSetupIntent() {}

  async confirmCardPayment(client_secret) {}

  /*	Products API
		REQUIRED	@productName : String
		OPTIONAL	@productDescription : String
		OPTIONAL	@productType : String
		OPTIONAL	@attributes : Array		
	*/
  async createProduct(
    productName,
    productDescription,
    productType,
    attributes
  ) {
    // Create the product object we will pass to the Stripe API
    var product = {};

    product["name"] = productName;

    if (productDescription != null) product["description"] = productDescription;

    // The default product type is a 'service'
    if (productType == null) product["type"] = "service";
    else product["type"] = productType;

    if (attributes != null) product["attributes"] = attributes;

    const stripeProduct = await this.stripe.products.create(product);
    this.output(stripeProduct);
  }

  /*	List Products
		Currently only supports up to 100.  ToDo: implement pagination
	*/
  async listProducts() {
    try {
      const stripeProducts = await this.stripe.products.list();
      this.output(stripeProducts);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Get Product
		REQUIRED	@productId : String
	*/
  async getProduct(productId) {
    try {
      const stripeProduct = await this.stripe.products.retrieve(productId);
      this.output(stripeProduct);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Delete Product
		REQUIRED	@productId : String
	*/
  async deleteProduct(productId) {
    try {
      const stripeDeletedProduct = await this.stripe.products.del(productId);
      this.output(stripeDeletedProduct);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Create Customer
   */
  async createCustomer() {
    console.log(362, "creatingCustomer");
    var user = this.user;
    try {
      const stripeCustomer = await this.stripe.customers.create({
        email: user.email,
        name: user.settings.first_name + user.settings.last_name,
        id: String(user._id)
      });
      this.output(stripeCustomer);
    } catch (err) {
      console.log(332, err);
      return this.error(err);
    }
  }

  /*	Get Customer
   */
  async getCustomer(customerId) {
    customerId = "cus_NzomlpjnxYxkaX";
    try {
      const stripeCustomer = await this.stripe.customers.retrieve(customerId);
      this.output(stripeCustomer);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Update Customer
   */
  async updateCustomer(customerId, params) {
    try {
      const stripeCustomer = await this.stripe.customers.update(
        customerId,
        params
      );
      this.output(stripeCustomer);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Delete Customer
   */
  async deleteCustomer(customerId) {
    try {
      const stripeCustomer = await this.stripe.customers.del(customerId);
      this.output(stripeCustomer);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Get Customers
   */
  async getCustomers() {
    try {
      const stripeCustomer = await this.stripe.customers.list();
      this.output(stripeCustomer);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Create Plan
      POST Create Plan
   */
  async createPlan(planId, product, amount, metadata = {}) {
    var user = this.user;
    try {
      const stripePlan = await this.stripe.plans.create({
        id: planId,
        currency: "usd",
        interval: "month",
        product: product,
        amount: amount,
        billing_scheme: "per_unit",
        interval_count: 1,
        metadata: metadata
      });
      this.output(stripePlan);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Get Plan
   */
  async getPlan(customerId) {
    console.log(540);
    customerId = "cus_NzomlpjnxYxkaX"
    try {
      const stripePlan = await this.stripe.plans.retrieve(customerId);
      this.output(stripePlan);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Update Plan
   */
  async updatePlan(customerId, params) {
        console.log(554);
    customerId = "cus_NzomlpjnxYxkaX"
    try {
      const stripePlan = await this.stripe.plans.update(customerId, params);
      this.output(stripePlan);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Delete Plan
   */
  async deletePlan(customerId) {
    try {
      const stripePlan = await this.stripe.plans.del(customerId);
      this.output(stripePlan);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Get Plans
   */
  async getPlans() {
    try {
      const stripePlan = await this.stripe.plans.list();

      var plans = [];
      for (var i = 0; i < stripePlan.data.length; i++) {
        var plan = stripePlan.data[i];
        delete plan.object;
        delete plan.active;
        delete plan.aggregate_usage;
        delete plan.amount_decimal;
        delete plan.billing_scheme;
        delete plan.created;
        delete plan.interval_count;
        delete plan.livemode;
        // delete plan.metadata;
        delete plan.nickname;
        delete plan.product;
        delete plan.tiers;
        delete plan.tiers_mode;
        delete plan.transform_usage;
        delete plan.trial_period_days;
        delete plan.usage_type;
        if (plan.currency == "usd") plan.amount = plan.amount / 100;
        if (plan.interval == "month") plan.interval = "Monthly";
        else if (plan.interval == "year") plan.interval = "Annually";
        plan.amount = `$${plan.amount}`;
        plan.name = voca.capitalize(plan.id);
        // plan.metadata = plan.metadata;
        plans.push(plan);
      }

      this.output({ plans: plans });
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Create Subscription
   */
  async createSubscription(planId) {
    console.log(612, planId)
        console.log(540);
    let customerId = "cus_NzomlpjnxYxkaX"

    var user = this.user;
    try {
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ plan: planId }]
      });
      this.output(stripeSubscription);
    } catch (err) {
      console.log(467, err);
      return this.error(err);
    }
  }

  /*	Get Subscription
   */
  async getSubscription(customerId) {
    console.log(629, customerId)
    // Testing 6/2/23
    customerId = "cus_NzomlpjnxYxkaX";

    try {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        customerId
      );
      this.output(stripeSubscription);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Update Subscription
   */
  async updateSubscription(id, planId) {
    var params = {
      items: [
        {
          id: "starter",
          plan: "professional"
        }
      ]
    };

    const subscription = await this.stripe.subscriptions.retrieve(id);

    console.log(585, subscription.items.data[0].id);
    console.log(586, subscription.items.data);

    try {
      const stripeSubscription = await this.stripe.subscriptions.update(id, {
        cancel_at_period_end: false,
        items: [
          {
            id: subscription.items.data[0].id,
            plan: planId
          }
        ]
      });
      this.output(stripeSubscription);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Delete Subscription
   */
  async deleteSubscription(customerId) {
    try {
      const stripeSubscription = await this.stripe.subscriptions.del(
        customerId
      );
      this.output(stripeSubscription);
    } catch (err) {
      return this.error(err);
    }
  }

  /*	Get Subscriptions
   */
  async getSubscriptions() {
    console.log(700);

    try {
      const stripeSubscription = await this.stripe.subscriptions.list();
      var subscriptions = [];
      for (var i = 0; i < stripeSubscription.data.length; i++) {
        var subscription = stripeSubscription.data[i];

        delete subscription.object;
        delete subscription.application_fee_percent;
        delete subscription.billing_cycle_anchor;
        delete subscription.billing_thresholds;
        delete subscription.cancel_at;
        delete subscription.cancel_at_period_end;
        delete subscription.canceled_at;
        delete subscription.collection_method;
        delete subscription.created;
        delete subscription.current_period_end;
        delete subscription.current_period_start;
        delete subscription.customer;
        delete subscription.days_until_due;
        delete subscription.default_source;
        delete subscription.default_tax_rates;
        delete subscription.discount;
        delete subscription.ended_at;
        delete subscription.default_payment_method;
        delete subscription.latest_invoice;
        delete subscription.livemode;
        delete subscription.metadata;
        delete subscription.next_pending_invoice_item_invoice;
        delete subscription.pending_invoice_item_interval;
        delete subscription.pending_setup_intent;
        delete subscription.quantity;
        delete subscription.schedule;
        delete subscription.start_date;
        delete subscription.tax_percent;
        delete subscription.trial_end;
        delete subscription.trial_start;

        var plans = [];
        //console.log(612, subscription.items.data)
        for (var y = 0; y < subscription.items.data.length; y++) {
          var plan = subscription.items.data[y].plan;
          delete plan.object;
          delete plan.active;
          delete plan.aggregate_usage;
          delete plan.amount_decimal;
          delete plan.billing_scheme;
          delete plan.created;
          delete plan.interval_count;
          delete plan.livemode;
          delete plan.metadata;
          delete plan.nickname;
          delete plan.product;
          delete plan.tiers;
          delete plan.tiers_mode;
          delete plan.transform_usage;
          delete plan.trial_period_days;
          delete plan.usage_type;
          if (plan.currency == "usd") plan.amount = plan.amount / 100;
          if (plan.interval == "month") plan.interval = "Monthly";
          else if (plan.interval == "year") plan.interval = "Annually";
          plan.amount = `$${plan.amount}.00`;
          plan.name = voca.capitalize(plan.id);
          subscription.plan = plan;
          //plans.push(plan)
        }
        //subscription.plans = plans;
        delete subscription.items;
        subscriptions.push(subscription);
        //delete subscription.plan
      }
      this.output({ subscriptions: subscriptions });
    } catch (err) {
      return this.error(err);
    }
  }

  /* Payment Methods
   */
  async addPaymentMethod(paymentMethod) {

    console.log(784);
    paymentMethod["default"] = false;
    var itemPos = this.user.paymentMethods.unshift(paymentMethod);
    this.user.markModified("paymentMethods");
    await this.user.save();
    //this.output(this.user.paymentMethods);
    // Attach Payment Method

    // Check and see if we have a default payment method
    // If not, associate one.
    var paymentMethods = this.user.paymentMethods;
    var firstMethod = {};
    var bDefault = false;
    for (var i = 0; i < paymentMethods.length; i++) {
      if (i == 0) firstMethod = paymentMethods[0];
      if (paymentMethods[i].default == true) {
        bDefault = true;
      }
    }

    var error = false;
    var worked = true;

    if (bDefault == false) {
      console.log(573, "Updating Default");

      try {
        const paymentAssociation = await this.stripe.paymentMethods.attach(paymentMethod.id, {         customer: "cus_NzomlpjnxYxkaX"} );
      }
      catch(err){
        console.log(793, err);
        this.error(err)
        return false;
      }
      var associateWorked = true;






      // var associateWorked = await this.associatePaymentMethod(
      //   paymentMethod.id,
      //   true
      // );



      var setDefault = false;
      if (associateWorked) {
        console.log(576, "We associated the payment Method");
        var setDefault = await this.defaultPaymentMethod(
          paymentMethod.id,
          true
        );
      } else {
        console.log(576, "We DID NOT associate the payment Method");
      }
      console.log(583, "setDefault is", setDefault);
      if (setDefault == true) {
        this.user.paymentMethods[0].default = true;
        var storedCard = {};
        for (var y = 1; y < this.user.paymentMethods.length; y++) {
          this.user.paymentMethods[y].default = false;
        }
        this.user.markModified("paymentMethods");
        await this.user.save();
      } else {
        // Return error to client
      }
    } else {
      // We've already got a default payment method -- just associate
      console.log(854)
      try {
        const paymentAssociation = await this.stripe.paymentMethods.attach(paymentMethod.id, {         customer: "cus_NzomlpjnxYxkaX", } );
      }
      catch(err){
        console.log(793, err);
        this.error(err)
        return false;
      }
      var worked = true;


    }

    if (worked) {
      this.output(paymentMethod);
    } else {
      this.error({
        "Add Payment Method Failed": true
      });
    }
  }

  async associatePaymentMethod(paymentMethodId, bSilent = false) {
    console.log(880);

    try {
      const paymentAssociation = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        {
                  customer: "cus_NzomlpjnxYxkaX",
        }
      );

      if (!bSilent) this.output(paymentAssociation);
      else return true;
    } catch (err) {
      console.log(834, err);
      if (!bSilent) return this.error(err);
      else return false;
    }
    return false;
  }

  async deletePaymentMethod(paymentMethodId) {
    console.log(901)
    try {
      const stripeDeletedProduct = await this.stripe.paymentMethods.detach(
        paymentMethodId
      );
        if(paymentMethodId == this.user.paymentMethod){
          this.user.defaultPaymentMethod  = "";
          this.user.save();
          // set another payment method as default automatically?
        }
      this.output({ method: stripeDeletedProduct });
    } catch (err) {
      return this.error(err);
    }
  }

  /*  POST Set Defaullt Payment Method
      /stripe/default/id/:id
      /stripe/default/id/pm_1FuCCIGzpSbuU0iyfdoRPaoe
      :id is a "Payment Method" that can be obtained
      by calling "/stripe/methods"
  */
  async defaultPaymentMethod(paymentMethodId, bSilent = false) {

    console.log(891, paymentMethodId)

    this.user.defaultPaymentMethod = paymentMethodId;

    this.user.save();

    // var associateWorked = await this.associatePaymentMethod(
    //   paymentMethodId,
    //   true
    // );

    //console.log(861, associateWorked);

    //try {
      const paymentAssociation = await this.stripe.customers.update(
        String(this.user._id),
        {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        }
      );

      if(!bSilent){
        this.output({ "default_payment_method" : paymentAssociation.invoice_settings.default_payment_method })
      } else {
        return true;
      }

      // trying to update methods by Noor
      // const methodUpdate = await this.stripe.paymentMethods.update(
      //   { id: paymentMethodId },
      //   { $set: { default: true } }
      // );
      // trying to update methods by Noor end

      //console.log(883, "Success", paymentAssociation);

    //   if (!bSilent) this.output(paymentAssociation);
    //   else return true;
    // } catch (err) {
    //   console.log(625, "Failure");
    //   if (!bSilent) return this.error(err);
    //   else return false;
    // }
    // return false;
  }
  
  async getPaymentMethods() {

        var customerId = "cus_NzomlpjnxYxkaX";
    console.log(976)

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 100
      });
      
      var data = paymentMethods.data;
      var cards = [];
      var storedCards = this.user.paymentMethods;

      var bSetAsDefault = false;

      if((this.user.defaultPaymentMethod == "")||(typeof this.user.defaultPaymentMethod == "undefined")){
        console.log(971, "its empty", paymentMethods.data.length)
        if(paymentMethods.data.length == 1){
          bSetAsDefault = true;
        }
      }

      if(data.length == 0){
        this.user.defaultPaymentMethod = "";
        await this.user.save();
      }

      if(data.length == 1){
        console.log(982, data);

        this.user.defaultPaymentMethod = data[0].id;
        await this.user.save();
      }

      for (var i = 0; i < data.length; i++) {
        var card = data[i].card;
        card["id"] = data[i].id;
        var storedCard = {};
        for (var y = 0; y < storedCards.length; y++) {
          if (storedCards[y].id == card["id"]) storedCard = storedCards[y];
        }
        card["default"] = storedCard["default"];
        delete card.checks;
        delete card.fingerprint;
        delete card.funding;
        delete card.generated_from;
        delete card.three_d_secure_usage;
        delete card.wallet;
        console.log(990, card.id, this.user.defaultPaymentMethod)
        if(card.id == this.user.defaultPaymentMethod){
          card.default = true;
        }
        if(bSetAsDefault){
          this.user.defaultPaymentMethod = card.id;
          await this.user.save();
          card.default = true;
        }
        cards.push(card);
      }
      this.output({ methods: cards });
    } catch (err) {
      return this.error(err);
    }
  }

  async chargeOnce(amount) {
    console.log(1040)
    // First, we need to create a payment intent.
    try {
      var paymentIntent = await this.stripe.paymentIntents.create({
        amount: 2000,
        currency: "usd",
        payment_method_types: ["card"],
        customer: "cus_NzomlpjnxYxkaX",
        payment_method: "pm_1FtPPrGzpSbuU0iyDL7jPEnt"
      });

      //this.output(paymentIntent);
    } catch (err) {
      return this.error(err);
    }

    try {
      var capture = await this.stripe.paymentIntents.confirm(paymentIntent.id);
      this.output(capture);
    } catch (err) {
      return this.error(err);
    }
    // 	try {
    // 	var result = await this.stripe.charges.create(
    // 	  {
    // 	    amount: 2000,
    // 	    currency: 'usd',
    // 	    customer: String(this.user._id),
    // 	    source: paymentIntent.id,
    // 	    description: 'Charge for jenny.rosen@example.com'
    // 	  })
    // 	this.output(result);
    // } catch(err){
    // 	this.error(err);
    // }
  }

}

//module.exports = Stripe;
module.exports = router;
