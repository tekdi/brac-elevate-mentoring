const userRequest = require('@services/users')

var messageReceived = function (message) {
	return new Promise(async function (resolve, reject) {
		try {
			console.log('[MENTORING KAFKA UPDATE USER] Message received')
			console.log('[MENTORING KAFKA UPDATE USER] entityId:', message.entityId)
			console.log('[MENTORING KAFKA UPDATE USER] eventType:', message.eventType)
			console.log('[MENTORING KAFKA UPDATE USER] tenant_code in message:', message.tenant_code)
			console.log('[MENTORING KAFKA UPDATE USER] oldValues.tenant_code:', message.oldValues?.tenant_code)
			console.log(
				'[MENTORING KAFKA UPDATE USER] newValues keys:',
				message.newValues ? Object.keys(message.newValues) : []
			)

			message.userId = message.entityId.toString()
			message.tenantCode = message?.tenant_code || message.oldValues?.tenant_code
			console.log('[MENTORING KAFKA UPDATE USER] resolved tenantCode:', message.tenantCode)

			const response = await userRequest.update(message)
			console.log(
				'[MENTORING KAFKA UPDATE USER] ✅ update() completed, response statusCode:',
				response?.statusCode
			)
			return resolve(response)
		} catch (error) {
			return reject(error)
		}
	})
}

var errorTriggered = function (error) {
	return new Promise(function (resolve, reject) {
		try {
			return resolve('Error Processed')
		} catch (error) {
			return reject(error)
		}
	})
}

module.exports = {
	messageReceived: messageReceived,
	errorTriggered: errorTriggered,
}
