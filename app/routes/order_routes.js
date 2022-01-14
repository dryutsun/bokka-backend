const express = require('express')
const passport = require('passport')
const Order = require('../models/order')
const User = require('../models/user')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
// this is middleware that will remove blank fields from `req.body`, e.g.
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })
const mongoose = require("mongoose")
// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// Show All Orders By One Owner
// I can get it from the middleware
router.get('/owner/:ownerid', requireToken, (req,res,next) => {
	Order.find()
		.populate('porter', 'email')
		// .populate('owner')
		.then((orders)=> {
			// console.log("first orders", orders[0].owner.toString())
			ownerOrders = orders.filter((order) => {
				orderString = "" + order.owner // WTF WHY DOES THIS WORK! Ask tim..
				// console.log(`ORDER.PORTER.ID: ${orderString} \t REQ.PARAM: ${req.params.porterid}`)
				return orderString === req.params.ownerid
			})

			// if (!ownerOrders || ownerOrders === 0 ) {
			// 	return next (new HttpError('Could not find any orders~!'))
			// }
			// console.log(ownerOrders)
			
			return ownerOrders.map((order) => order.toObject())
		})
		.then((orders) => res.status(200).json({ orders: orders},))
		.catch(next)
})

// Show All Orders Assigned To One Porter
//const user = UserModel.findOne({...});
// const { _id, username, ...others } = user.toObject(); 
// I can send the porterid as part of the payload of GET request
router.get('/porter/:porterid', requireToken, (req,res,next) => {
	// porterid = mongoose.Types.ObjectId(req.params.porterid)
	console.log("This PiD", req.params.porterid)
	Order.find()
		// .populate('porter', 'email id')
		.then((orders)=> {
			console.log(orders)
			porterOrders = orders.filter((order) => {
				orderString = "" + order.porter // WTF WHY DOES THIS WORK
				// console.log(`OS:${orderString} \t PiD: ${req.params.porterid}`)
				// console.log(orderString + " == " + req.params.porterid )
				return orderString === req.params.porterid
			})	
			
			console.log(porterOrders)
			return porterOrders.map((order) => order.toObject())
		})
		.then((orders) => res.status(200).json({ orders: orders}))
		.catch(next)
})

// ! THIS WORKS
router.get('/', requireToken, (req, res, next) => {
	Order.find()
		.then((orders) => {
			return orders.map((order) => order.toObject())
		})
		.then((orders) => res.status(200).json({ orders: orders }))
		.catch(next)
})

// CREATE
// POST /orders
router.post('/', requireToken, (req, res, next) => {
	// set owner of new order to be current user
	req.body.order.owner = req.user.id
	Order.create(req.body.order)
		.then((order) => {
			res.status(201).json({ order: order.toObject() })
		})
		.catch(next)
})


// SHOW
// GET /orders/5a7db6c74d55bc51bdf39793
// ! THIS WORKS
router.get('/:id', requireToken, (req, res, next) => {
	Order.findById(req.params.id)
		.then(handle404)
		.then((order) => res.status(200).json({ order: order.toObject() }))
		.catch(next)
})

// UPDATE
// PATCH /orders/5a7db6c74d55bc51bdf39793
// THIS WORKS: NEED TO REMOVE OWNERSHIP BECAUSE PORTER NEEDS TO CHANGE
router.patch('/:id', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	delete req.body.order.owner

	Order.findById(req.params.id)
		.then(handle404)
		.then((order) => {
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner

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
router.delete('/:id', requireToken, (req, res, next) => {
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
// SHOW Get All Orders From One Owner
// ! THIS DOESNT WORK?
// https://stackoverflow.com/questions/59138481/mongoose-find-by-reference-field
//https://stackoverflow.com/questions/59907539/mongoose-casterror-cast-to-objectid-failed-for-value-at-path-id-for-mode
// https://stackoverflow.com/questions/60070267/how-to-get-the-list-of-all-the-posts-by-a-particular-user-in-express-mongo

// THERE IS A URL CONFLICT WITH ORDERITEM ROUTES
//https://stackoverflow.com/questions/62225742/how-to-handle-404-response-with-mongoose



module.exports = router

