/*
	A "Pricelet" is a made-up term for Saas Product

	It is defined as a mechanism whereby dynamic, real-time pricing can be affected
	based on relevant factors.

	The price can change on a global basis, Brand basis, or even on a per-user
	basis.

	One common use of a pricelet is to allow for the adjustment of a price based on time
	So, for example, a price may be set to increase or decrease based on a timer.  The timer
	can go up or down.  Price changes can be scheduled for intervals, so for example if you want
	to affect the pricing of an object between Friday 8:00 - 12:00, you can.

	Other factors that can affect pricing is total profit per cart, advertising cost, etc.

	This entire implementation is highly experimental

	A client will connect via a WebSocket and send a request for a dynamic price
	The server will lookup the Pricelet and send back real-time Price updates

	The client can send new information to the server to see if it affects
	the price.  For example, maybe it will send cart_total: 50, 

	An example might be
	
	The client will send this information to the server

	referrel source
	cpc cost

	The server will calculate the estimated cost of this user if they convert
	So let's say we expect to pay $0.25 per click, at 2% conversion rate.  That means
	each conversion costs us $12.50.  We must factor this expense into our cost

	Next lets say our goal is to make $30 per sale, and our starting markup is 50%

	The customer adds one item, it get's added full price

	Let's say a pair of shoes for $35.  The shoe costs $15, so we're making $20.  But,
	our conversion rate at this price is very low.  Say "Add Another Item and get $10 off the shoes.

	So the customer adds another item.  We dynamically price this so that we encourage the user"

	So let's say that we have a product.  The product will have these mandatory fields

	wholesale_cost
	standard markup {
		< $10 = 200%
		< $20 > $10 = 100%
		> $20 = 35%
	}
	or price $

	Let's say we have a product
	$16
	$5
	---
	$21

	
	The expected behavior of the pricelet needs to be stored
	It needs to be associated with specific products
	It needs to be able to control behavior - display and server

	Visitor types in a search query

	Server returns search results

	Search results displayed on page

	Customer adds item to cart

	That information is sent to server

	Server sends back information updating dynamic pricing

	Search Results [
		12345,
		67891,
		09876,
		54321
	]

	Webpage dynamically loads these and displays information
	Stores search results array for future use, keeps track of what is
	displayed on page

	Customer adds something to cart
	Via websocket client sends server search results and cart.  cart[12345], search[]
	Search Results [
			12345,
			67891,
			09876,
			54321
		]

	Server sends back new pricing [
		12345:1.25,
		67891:3.25,
		09876:4.22,
		54321:2.32
	]


	Maybe the client has code like this

	updatePricesFromArray(priceArray)
	 priceArray = [ 
	 
	 { 	"item_code":"12345", 
	 	"display_price":"$1.29", 
	 	"price":"1.29", 
	 	"estimated_shipping":"0.00", 
	 	"currency":"EU", 
	 	"currency_symbol":"€"
	 },
	 { 	"item_code":"67890", 
	 	"display_price":"$1.29", 
	 	"price":"1.29", 
	 	"estimated_shipping":"0.00", 
	 	"currency":"EU", 
	 	"currency_symbol":"€"
	 }

	 ]

	which then iterates through and calls something like
	updatePrice(priceObj) for each price object

	Client updates search results pricing
	
	$30,000 per month
 
	Prices Cheaper than Walmart and Amazon for Baby Products

	How we do it

	We have a dynamic pricing model.  Our premise is simple.  If you only buy one thing from us, 
	this costs us a lot more than if you buy multiple things.  So if you buy multiple things, we
	dynamically calculate our costs and lower your pricing.  

	The more you buy,the more you save.



	start_date
	end_date
	type { timer_up, timer_down, algorithmic }
	profit_goal
	





*/



module.exports = class Pricelets {

	constructor() 
		{
	
		}


		createPricelet()
		{
			// Adds a Pricelet to the Database

		}


		getPricelet(id) 
		{
			// Gets a Pricelet by the MongoDB database ID of the pricelet


		}

		getPricelets(owner)
		{
			// Returns a list of Pricelets by account owner


		}




}