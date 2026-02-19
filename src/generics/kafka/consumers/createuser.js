const userRequest = require('@services/users')

var messageReceived = function (message) {
	return new Promise(async function (resolve, reject) {
		try {
			console.log('[MENTORING KAFKA CREATE USER] Message received')
			console.log('[MENTORING KAFKA CREATE USER] entityId:', message.entityId || message.id)
			console.log('[MENTORING KAFKA CREATE USER] tenant_code:', message.tenant_code)
			console.log('[MENTORING KAFKA CREATE USER] eventType:', message.eventType)
			console.log('[MENTORING KAFKA CREATE USER] organizations count:', message.organizations?.length || 0)

			const org = message.organizations?.[0]

			if (!org) {
				console.error('[MENTORING KAFKA CREATE USER] ❌ Organization missing in message')
				return reject(new Error('Organization ID is missing in create user event'))
			}
			message.organization_id = org.id
			message.organization_code = org.code
			message.user_roles = (org.roles || []).map((role) => ({ title: role.title }))
			message.roles = message.user_roles

			console.log('[MENTORING KAFKA CREATE USER] organization_id:', message.organization_id)
			console.log('[MENTORING KAFKA CREATE USER] organization_code:', message.organization_code)
			console.log(
				'[MENTORING KAFKA CREATE USER] roles:',
				message.user_roles.map((r) => r.title)
			)

			// Convert id to string to match validation requirements
			message.id = message.id.toString()

			const response = await userRequest.add(message, message.id, message.organization_id, message.tenant_code)
			console.log('[MENTORING KAFKA CREATE USER] ✅ add() completed, response statusCode:', response?.statusCode)

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
