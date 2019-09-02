/*

https://help.shopify.com/en/api/guides/payment-gateway/hosted-payment-sdk/develop-gateway

Shopify checkout -> this app -> back to Shopify

Transaction type can be set to 'sale' (to capture the payment immediately) or 'authorization' (to capture later)
We create a response, sign it, and send it back to checkout.
We also send an async request to x_url_callback indicating success, just in case the customer's Shopify connection dies.

If capturing later, when the merchant hits 'capture' from the order admin,
a request comes through to /capture, we respond to the x_url_callback with transaction type 'capture'

If store is set to auto capture, Shopify will automatically send the request (eliminating the button)

*/

const express = require('express')
const ngrok = require('ngrok')
const bodyParser = require('body-parser')
const app = express()
const port = 3000
const { verifySignature, generateResponse } = require('./utils')
const querystring = require('querystring')
const request = require('request')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/pay', verifySignature, (req, res) => {
  const { body } = req

  // Create the response
  const response = querystring.stringify(generateResponse(body, 'sale'))

  // Redirect back to Shopify
  const redirect = `${body.x_url_complete}?${response}`

  res.redirect(redirect)

  // POST a callback asynchronously to x_url_callback with the same Response Values
  // https://help.shopify.com/en/api/guides/payment-gateway/hosted-payment-sdk/checkout-process
  request({
    headers: {
      'Content-Length': response.length,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    uri: body.x_url_callback,
    body: response,
    method: 'POST'
  }, (err, res, body) => {
    console.log('Sent')
    console.log(err, res, body)
  })

})

app.post('/capture', verifySignature, (req, res) => {
  const { body } = req

  const response = querystring.stringify(generateResponse(body, 'capture'))

  // POST a callback asynchronously to x_url_callback with the same Response Values
  // https://help.shopify.com/en/api/guides/payment-gateway/hosted-payment-sdk/checkout-process
  request({
    headers: {
      'Content-Length': response.length,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    uri: body.x_url_callback,
    body: response,
    method: 'POST'
  }, (err, res, body) => {
    console.log('Sent')
    console.log(err, res, body)
  })

  res.sendStatus(200)
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
