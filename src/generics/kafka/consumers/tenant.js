'use strict'

const tenantQueries = require('@database/queries/tenants')
const tenantService = require('@services/tenant')

var messageReceived = function (message) {
	return new Promise(async function (resolve, reject) {
		try {
			const {
				entity,
				eventType,
				code,
				name,
				status,
				description,
				logo,
				meta,
				theming,
				created_by,
				updated_by,
				org_id,
				org_code,
				backfill,
			} = message

			if (entity !== 'tenant') {
				console.warn(`Non-tenant entity received in tenant consumer: ${entity}`)
				return resolve(`Skipped non-tenant entity: ${entity}`)
			}

			switch (eventType) {
				case 'create': {
					const tenantData = {
						code,
						name,
						status: status || 'ACTIVE',
						description: description || null,
						logo: logo || null,
						meta: meta || null,
						theming: theming || null,
						created_by: created_by ? created_by.toString() : null,
						updated_by: created_by ? created_by.toString() : null,
					}
					const { created } = await tenantQueries.upsert(tenantData)
					if (created) {
						console.log(`✅ [TENANT] Created new tenant: ${code}`)
					} else {
						console.log(`ℹ️ [TENANT] Tenant already exists: ${code}`)
					}
					const replicationOptions = { backfill: backfill === true }
					await tenantService.replicateConfigFromDefaultTenant(code, org_id, org_code, replicationOptions)
					break
				}

				case 'update': {
					const { newValues = {} } = message
					const updateData = {}
					if (!message.entityId) {
						console.warn(`[TENANT] Update event missing entityId, skipping`)
						return resolve(`Skipped update: missing entityId`)
					}

					if (newValues.name !== undefined) updateData.name = newValues.name
					if (newValues.status !== undefined) updateData.status = newValues.status
					if (newValues.description !== undefined) updateData.description = newValues.description
					if (newValues.logo !== undefined) updateData.logo = newValues.logo
					if (newValues.meta !== undefined) updateData.meta = newValues.meta
					if (newValues.theming !== undefined) updateData.theming = newValues.theming
					if (updated_by !== undefined) updateData.updated_by = updated_by ? updated_by.toString() : null

					if (Object.keys(updateData).length > 0) {
						const result = await tenantQueries.update(message.entityId, updateData)
						console.log(`✅ [TENANT] Update result for ${message.entityId}: ${result}`)
					}
					break
				}

				default:
					console.warn(`Unknown tenant event type: ${eventType}`)
					return resolve(`Unknown event type: ${eventType}`)
			}

			return resolve(`Tenant ${eventType} event processed for: ${code || message.entityId}`)
		} catch (error) {
			console.error(`Error processing tenant event: ${error.message}`, {
				eventType: message.eventType,
				entityId: message.entityId,
				error: error.stack,
			})
			return reject(error)
		}
	})
}

var errorTriggered = function (error) {
	return new Promise(function (resolve, reject) {
		try {
			console.error('Tenant Kafka consumer error:', error)
			return resolve('Tenant Error Processed')
		} catch (error) {
			return reject(error)
		}
	})
}

module.exports = {
	messageReceived: messageReceived,
	errorTriggered: errorTriggered,
}
