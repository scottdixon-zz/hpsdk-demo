const crypto = require('crypto')
const safeCompare = require('safe-compare')

const verifySignature = (req, res, next) => {
  const { body } = req
  const hash = sign(body)
  if (safeCompare(hash, body['x_signature'])) {
    next()
  } else {
    res.send(401)
  }

}

const sign = (content) => {
  // Gateway signing mechanism
  // https://help.shopify.com/en/api/guides/payment-gateway/hosted-payment-sdk/develop-gateway#gateway-signing-mechanism
  const message = []

  for (key in content) {
    if (key.startsWith('x_') && key != ('x_signature')) {
      message.push(`${key}${content[key]}`)
    }
  }

  return crypto
    .createHmac('sha256', 'somekey') // <-- key is a value known to both the Shopify merchant and you. This is typically the "Password" field for the merchant.
    .update(message.sort().join(''), 'utf8')
    .digest('hex')
}

const generateResponse = (request, transactionType) => {
  const response = {}
  response['x_account_id'] = request.x_account_id
  response['x_amount'] = request.x_amount
  response['x_currency'] = request.x_currency
  response['x_reference'] = request.x_reference
  response['x_test'] = request.x_test
  response['x_transaction_type'] = transactionType // 'sale' = capture // 'authorization' = don't capture yet
  response['x_timestamp'] = new Date().toISOString()
  response['x_result'] = 'completed' // Valid values are completed, failed, or pending.
  response['x_gateway_reference'] = Math.round(10000000 * Math.random())

  // Sign it
  response['x_signature'] = sign(response)
  return response
}

module.exports = { verifySignature, sign, generateResponse }
