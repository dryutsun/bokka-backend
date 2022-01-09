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

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX

router.get('/orders', requireToken, (req, res, next) => {
	Order.find()
		.then((orders) => {
			return orders.map((order) => order.toObject())
		})
		.then((orders) => res.status(200).json({ orders: orders }))
		.catch(next)
})

// SHOW
// GET /orders/5a7db6c74d55bc51bdf39793
router.get('/orders/:id', requireToken, (req, res, next) => {
	Order.findById(req.params.id)
		.then(handle404)
		.then((order) => res.status(200).json({ order: order.toObject() }))
		.catch(next)
})

// SHOW Get All Orders From One Owner

router.get('/orders/owner/:userid'), requireToken, (req,res,next) => {
	Order.find({owner: req.params.id })
		.then((orders)=> {
			return orders.map((order) => order.toObject())
		})
		.then((orders) => res.status(200).json({ orders: orders}))
		.catch(next)
}

// Show All Orders From One Porter
router.get('/orders/porter/:userid'), requireToken, (req,res,next) => {
	Order.find({porter: req.params.id })
		.then((orders)=> {
			return orders.map((order) => order.toObject())
		})
		.then((orders) => res.status(200).json({ orders: orders}))
		.catch(next)
}

// CREATE
// POST /orders
router.post('/orders', requireToken, (req, res, next) => {
	// set owner of new order to be current user
	req.body.order.owner = req.user.id
	Order.create(req.body.order)
		.then((order) => {
			res.status(201).json({ order: order.toObject() })
		})
		.catch(next)
})

//

// UPDATE
// PATCH /orders/5a7db6c74d55bc51bdf39793
router.patch('/orders/:id', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	delete req.body.order.owner

	Order.findById(req.params.id)
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
router.delete('/orders/:id', requireToken, (req, res, next) => {
	Order.findById(req.params.id)
		.then(handle404)
		.then((order) => {
			// throw an error if current user doesn't own `order`
			requireOwnership(req, order)
			// delete the order ONLY IF the above didn't throw
			order.deleteOne()
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router
