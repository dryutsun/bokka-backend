const express = require('express')
const passport = require('passport')
const Order = require('../models/order')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
// this is middleware that will remove blank fields from `req.body`, e.g.
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })
const orderItem = require('../models/orderitem')

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// Get All Order Items from One Order
router.get('/:orderid', requireToken, (req, res, next) => {
	Order.findById(req.params.orderid)
		.then((orders) => {
			return orders.orderItem.map((orderItem) => orderItem.toObject())
		})
		.then((orderItem) => res.status(200).json({ orderItem: orderItem }))
		.catch(next)
})

// SHOW
// GET One Order Item from One Order
router.get('/:orderid/:itemid', requireToken, (req, res, next) => {
	Order.findById(req.params.orderid)
		.then((order) => {
			return order.orderItem.id(req.params.itemid)
		})
		.then(handle404)
		.then((order) => res.status(200).json({ orderItem: orderItem.toObject() }))
		.catch(next)
})

// CREATE ONE ORDER ITEM FROM ONE ORDER
// POST /orders/:orderid
router.post('/:orderid', requireToken, (req, res, next) => {
	// set owner of new order item to be current user
	req.body.order.owner = req.user.id
	Order.findById(req.params.order)
		.then((order) => {
			order.orderItem.push(req.body.orderItem)
			return order.save()
		})
		.catch(next)
})

// UPDATE
// PATCH /orders/5a7db6c74d55bc51bdf39793
router.patch('/:orderid/:itemid', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	delete req.body.order.owner

	Order.findByIdAndUpdate(req.params.orderid)
		.then(handle404)
		.then((order) => {
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			requireOwnership(req, order)
			// pass the result of Mongoose's `.update` to the next `.then`
			return order.updateOne(req.body.order)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// DESTROY
// DELETE /orders/5a7db6c74d55bc51bdf39793
router.delete('/:orderid/:itemid', requireToken, (req, res, next) => {
	Order.findById(req.params.orderid)
		.then(handle404)
		.then((order) => {
			// throw an error if current user doesn't own `order`
			requireOwnership(req, order)
			// delete the order ONLY IF the above didn't throw
			order.orderItem.pull(req.params.itemid)
			return order.save()
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router

