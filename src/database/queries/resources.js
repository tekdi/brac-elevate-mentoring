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

	static async deleteResourceByIdWithSessionValidation(resourceId, sessionId, tenantCode) {
		try {
			// First, find the resource to validate it exists and belongs to the specified session
			const resource = await Resources.findOne({
				where: { id: resourceId, session_id: sessionId, tenant_code: tenantCode },
				attributes: ['id', 'session_id'],
			})

			if (!resource) {
				return 0 // No resource found or session mismatch
			}

			// Validate that the session exists and belongs to the same tenant
			const session = await Session.findOne({
				where: { id: sessionId, tenant_code: tenantCode },
				attributes: ['id'],
			})
			if (!session) {
				return 0 // Session not found or invalid
			}
			// Delete the resource using destroy with where clause for reliable deletion
			const deletedCount = await Resources.destroy({
				where: { id: resourceId, session_id: sessionId, tenant_code: tenantCode },
			})
			return deletedCount > 0 ? 1 : 0
		} catch (error) {
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
			const ResourcesData = await Resources.findAll({
				where: whereClause,
				attributes: projection,
				raw: true,
			})
			return ResourcesData
		} catch (error) {
			return error
		}
	}
}
