const Resources = require('../models/index').Resources
const Session = require('../models/index').Session

module.exports = class ResourcessData {
	static async bulkCreate(data, tenantCode) {
		try {
			// Assign tenant_code to all data entries
			const dataWithTenant = data.map((item) => ({
				...item,
				tenant_code: tenantCode,
			}))

			const resources = await Resources.bulkCreate(dataWithTenant, {
				returning: true, // to return the inserted records
			})
			return resources
		} catch (error) {
			return error
		}
	}

	static async create(data, tenantCode) {
		try {
			data.tenant_code = tenantCode
			const resources = await Resources.create(data, { returning: true })
			return resources
		} catch (error) {
			return error
		}
	}

	static async findOneResources(filter, tenantCode, projection = {}) {
		try {
			const whereClause = {
				...filter,
				tenant_code: tenantCode,
			}
			const ResourcesData = await Resources.findOne({
				where: whereClause,
				attributes: projection,
				raw: true,
			})
			return ResourcesData
		} catch (error) {
			return error
		}
	}

	static async deleteResource(sessionId, tenantCode, projection = {}) {
		try {
			const ResourcesData = await Resources.destroy({
				where: { session_id: sessionId, tenant_code: tenantCode },
				raw: true,
			})
			return ResourcesData
		} catch (error) {
			return error
		}
	}

	static async deleteResourceById(resourceId, sessionId, tenantCode) {
		try {
			const ResourcesData = await Resources.destroy({
				where: { id: resourceId, session_id: sessionId, tenant_code: tenantCode },
				raw: true,
			})
			return ResourcesData
		} catch (error) {
			return error
		}
	}

	static async deleteResourceByIdWithSessionValidation(resourceId, tenantCode) {
		try {
			console.log(
				`🗑️ [DELETE RESOURCE] Starting deletion for resourceId: ${resourceId}, tenantCode: ${tenantCode}`
			)

			// First, find the resource without include to get the session_id
			const resource = await Resources.findOne({
				where: { id: resourceId, tenant_code: tenantCode },
				attributes: ['id', 'session_id'],
			})

			if (!resource) {
				console.log(
					`❌ [DELETE RESOURCE] Resource not found - resourceId: ${resourceId}, tenantCode: ${tenantCode}`
				)
				return 0 // No resource found
			}

			console.log(`✅ [DELETE RESOURCE] Resource found - id: ${resource.id}, session_id: ${resource.session_id}`)

			// Validate that the session exists and belongs to the same tenant
			const session = await Session.findOne({
				where: { id: resource.session_id, tenant_code: tenantCode },
				attributes: ['id'],
			})

			if (!session) {
				console.log(
					`❌ [DELETE RESOURCE] Session not found or invalid - session_id: ${resource.session_id}, tenantCode: ${tenantCode}`
				)
				return 0 // Session not found or invalid
			}

			console.log(`✅ [DELETE RESOURCE] Session validated - session_id: ${resource.session_id}`)

			// Delete the resource using destroy with where clause for reliable deletion
			const deletedCount = await Resources.destroy({
				where: { id: resourceId, tenant_code: tenantCode },
			})

			console.log(
				`📊 [DELETE RESOURCE] Deletion result - deletedCount: ${deletedCount}, resourceId: ${resourceId}`
			)

			if (deletedCount > 0) {
				console.log(`✅ [DELETE RESOURCE] Successfully deleted resource - resourceId: ${resourceId}`)
			} else {
				console.log(
					`⚠️ [DELETE RESOURCE] No rows deleted - resourceId: ${resourceId}, tenantCode: ${tenantCode}`
				)
			}

			return deletedCount > 0 ? 1 : 0
		} catch (error) {
			console.error(`❌ [DELETE RESOURCE] Error deleting resource - resourceId: ${resourceId}, error:`, error)
			return error
		}
	}

	static async find(filter, tenantCode, projection = {}) {
		try {
			const whereClause = {
				...filter,
				deleted_at: null,
				tenant_code: tenantCode,
			}
			console.log(`🔍 [RESOURCE FIND] Querying resources with filter:`, JSON.stringify(whereClause, null, 2))
			const ResourcesData = await Resources.findAll({
				where: whereClause,
				attributes: projection,
				raw: true,
			})
			console.log(`📊 [RESOURCE FIND] Found ${ResourcesData?.length || 0} resources`)
			if (ResourcesData && ResourcesData.length > 0) {
				console.log(`📋 [RESOURCE FIND] Resource IDs: [${ResourcesData.map((r) => r.id).join(', ')}]`)
			}
			return ResourcesData
		} catch (error) {
			console.error(`❌ [RESOURCE FIND] Error querying resources:`, error)
			return error
		}
	}
}
