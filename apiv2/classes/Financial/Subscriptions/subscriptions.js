/*    This is our Base class, all classes in this project extend this class
 *
 *    Any functionality that needs to be made available to all classes should be implemented here
 *
 */
import Errors from '../Errors/errors.js'
import Response from '../Response/response.js'
import Authorization from '../Authorization/authorization.js'
import Voca from 'voca'

/*
	Refund Policy

	Initial Subscription: - User pays immediately and receives 30 days of access into the future
	On Upgrade: - User pays difference between the upgrade cost remaining for the current subscription time
	On Downgrade: - User receives diffference between the downgrade pricing and amount already paid
	On Cancel: - User continues to enjoy access until the expiration date

*/


export default class Subscriptions {

    constructor() {
        
    }

    /* Site Admin Level Access */
    
    /// Returns a list of all available subscription tiers
    getAllSubscriptionTiers(){

    }

    /// Returns the details of a particular subscription
    getSubscription(subscription_plan_id){

    }

    /// Adds a new subscription tier
    addSubscriptionTier(){

    }

    /// Removes a subscription tier
    removeSubscriptionTier(subscription_plan_id){

    }

    /// Retrieves subscription history for a particular account
    getSubscriptionHistory(user_id){

    }

    /// Cancels a subscription, removing all access to the user
    cancelSubscription(user_id){

    }

    /* Account Admin Access Level */
    /// Gets the current subscription for the logged in account
    getCurrentSubscription(){

    }

    /// Cancels the current subscription without upgrading or downgrading
    cancelActiveSubscription(){

    }

    /// Upgrades the current subscription
    upgradeActiveSubscription(subscription_plan_id){

    }

    /// Downgrade current subscription
    downgradeActiveSubscription(subscription_plan_id){

    }

    /// Starts a new Subscription
    startNewSubscription(subscription_plan_id){

    }

}