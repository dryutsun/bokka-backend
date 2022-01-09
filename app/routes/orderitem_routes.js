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
// https://stackoverflow.com/questions/24414975/mongoose-populate-sub-sub-document
router.get('/:orderid', requireToken, (req, res, next) => {
	Order.findById(req.params.orderid)
		.then((orders) => {
			console.log(orders.orderItems)
			if (!orders.orderItems || orders.orderItems === 0 ) {
				return next (new HttpError('Could not find any orders~!'))
			}
			return orders.orderItems.map((orderItem) => orderItem.toObject())
		})
		.then((orderItem) => res.status(200).json({ orderItems: orderItem }))
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
// ! WORKS, BUT IF NO RESPONSE HANGS
router.post('/:orderid', requireToken, (req, res, next) => {
	// set owner of new order item to be current user
	// req.body.order.owner = req.user.id
	console.log(req.body)
	Order.findById(req.params.orderid)
		.then((order) => {
			console.log(order.orderItems)
			order.orderItems.push(req.body.orderItem)
			return order.save()
		})
		.then(orderItem => res.status(201).json({ orderItem: orderItem.toObject() }))
		.catch(next)
})

// UPDATE
// PATCH /orders/5a7db6c74d55bc51bdf39793
router.patch('/:orderid/:itemid', requireToken, removeBlanks, (req, res, next) => {
	Order.findByIdAndUpdate(req.params.orderid)
		.then(handle404)
		.then((order) => {
            const orderItem = order.orderItems.id(req.params.itemid)			
			orderItem.set(req.body.orderItem)
			console.log(orderItem) // WTF THIS WORKED
			return order.save()
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

