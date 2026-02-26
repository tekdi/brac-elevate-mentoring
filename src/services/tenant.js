'use strict'

const { Op } = require('sequelize')
const db = require('@database/models/index')
const NotificationTemplateQueries = require('@database/queries/notificationTemplate')
const FormQueries = require('@database/queries/form')
const EntityTypeQueries = require('@database/queries/entityType')
const EntityQueries = require('@database/queries/entity')
const QuestionQueries = require('@database/queries/questions')
const QuestionSetQueries = require('@database/queries/question-set')
const ReportTypeQueries = require('@database/queries/reportTypes')
const ReportQueries = require('@database/queries/reports')
const ReportQueryQueries = require('@database/queries/reportQueries')
const ReportRoleMappingQueries = require('@database/queries/reportRoleMapping')
const RoleExtensionQueries = require('@database/queries/roleExtentions')

module.exports = class TenantService {
	static async replicateConfigFromDefaultTenant(newTenantCode, newOrgId, newOrgCode, options = {}) {
		const defaultTenantCode = process.env.DEFAULT_TENANT_CODE
		const defaultOrgCode = process.env.DEFAULT_ORGANISATION_CODE

		if (!defaultTenantCode || !defaultOrgCode) {
			throw new Error('DEFAULT_TENANT_CODE and DEFAULT_ORGANISATION_CODE env vars are required for replication')
		}

		if (newTenantCode === defaultTenantCode) {
			console.log('[TENANT REPLICATION] Skipping — source and target are the same tenant')
			return
		}

		const newOrgIdStr = newOrgId ? newOrgId.toString() : process.env.DEFAULT_ORG_ID

		if (!newOrgIdStr) {
			throw new Error('newOrgId is required when DEFAULT_ORG_ID env var is not set')
		}

		const keysToStrip = ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by']
		const stripMeta = (record) => {
			const copy = { ...record }
			keysToStrip.forEach((key) => delete copy[key])
			return copy
		}

		const transaction = await db.sequelize.transaction()
		try {
			// ── 1. Notification Templates ────────────────────────────────────────
			const notifTemplates = await NotificationTemplateQueries.findTemplatesByFilter({
				organization_code: defaultOrgCode,
				tenant_code: defaultTenantCode,
			})
			if (notifTemplates.length) {
				let skipNotifTemplates = false
				if (options.backfill) {
					const existingTemplates = await NotificationTemplateQueries.findTemplatesByFilter({
						tenant_code: newTenantCode,
					})
					if (
						existingTemplates.length > 0 &&
						existingTemplates.some((t) => t.organization_code !== defaultOrgCode)
					) {
						skipNotifTemplates = true
						console.log(
							`[TENANT REPLICATION] Skipping notification templates — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipNotifTemplates) {
					const newTemplates = notifTemplates.map((t) => ({
						...stripMeta(t),
						tenant_code: newTenantCode,
						organization_id: newOrgIdStr,
					}))
					await NotificationTemplateQueries.bulkCreate(newTemplates, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Notification templates copied: ${newTemplates.length}`)
				}
			}

			// ── 2. Forms ─────────────────────────────────────────────────────────
			const forms = await FormQueries.findFormsByFilter({ organization_code: defaultOrgCode }, [
				defaultTenantCode,
			])
			if (forms.length) {
				let skipForms = false
				if (options.backfill) {
					const existingForms = await FormQueries.findFormsByFilter({}, [newTenantCode])
					if (existingForms.length > 0 && existingForms.some((f) => f.organization_code !== defaultOrgCode)) {
						skipForms = true
						console.log(
							`[TENANT REPLICATION] Skipping forms — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipForms) {
					const newForms = forms.map((f) => ({
						...stripMeta(f),
						tenant_code: newTenantCode,
						organization_id: newOrgIdStr,
						version: 0,
					}))
					await FormQueries.bulkCreate(newForms, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Forms copied: ${newForms.length}`)
				}
			}

			// ── 3. Entity Types ───────────────────────────────────────────────────
			const entityTypes = await EntityTypeQueries.findAllEntityTypes([defaultOrgCode], [defaultTenantCode], null)

			const entityTypeIdMap = {}

			if (entityTypes.length) {
				let skipEntityTypes = false
				if (options.backfill) {
					const existingEntityType = await EntityTypeQueries.findOneEntityType({}, newTenantCode)
					if (existingEntityType && existingEntityType.organization_code !== defaultOrgCode) {
						skipEntityTypes = true
						console.log(
							`[TENANT REPLICATION] Skipping entity types — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipEntityTypes) {
					const newEntityTypes = entityTypes.map((et) => ({
						...stripMeta(et),
						tenant_code: newTenantCode,
						organization_id: newOrgIdStr,
						parent_id: null,
					}))
					const createdEntityTypes = await EntityTypeQueries.bulkCreate(newEntityTypes, newTenantCode, {
						transaction,
					})

					let typesToMap = createdEntityTypes
					if (createdEntityTypes.length < newEntityTypes.length) {
						console.log(
							`[TENANT REPLICATION] Entity types: ${
								newEntityTypes.length - createdEntityTypes.length
							} duplicate(s) skipped — fetching existing records to complete ID mapping`
						)
						typesToMap = await EntityTypeQueries.findAllEntityTypes([defaultOrgCode], [newTenantCode], null)
					}

					for (const oldET of entityTypes) {
						const newET = typesToMap.find(
							(c) => c.value === oldET.value && c.organization_code === oldET.organization_code
						)
						if (newET) entityTypeIdMap[oldET.id] = newET.id
					}
					console.log(`[TENANT REPLICATION] Entity types copied: ${createdEntityTypes.length}`)
				}
			}

			// ── 4. Entities ───────────────────────────────────────────────────────
			// Skipped automatically when entity types are skipped (entityTypeIdMap stays empty)
			const oldEntityTypeIds = Object.keys(entityTypeIdMap).map(Number)
			if (oldEntityTypeIds.length) {
				const entities = await EntityQueries.findAllEntities(
					{ entity_type_id: { [Op.in]: oldEntityTypeIds } },
					defaultTenantCode
				)
				if (entities.length) {
					const newEntities = entities
						.filter((e) => entityTypeIdMap[e.entity_type_id] !== undefined)
						.map((e) => ({
							...stripMeta(e),
							tenant_code: newTenantCode,
							entity_type_id: entityTypeIdMap[e.entity_type_id],
						}))
					await EntityQueries.bulkCreate(newEntities, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Entities copied: ${newEntities.length}`)
				}
			}

			// ── 5. Questions ──────────────────────────────────────────────────────
			const questions = await QuestionQueries.find({
				organization_code: defaultOrgCode,
				tenant_code: defaultTenantCode,
			})
			const questionIdMap = {}

			if (questions.length) {
				let skipQuestions = false
				if (options.backfill) {
					const existingQuestions = await QuestionQueries.find({ tenant_code: newTenantCode })
					if (
						existingQuestions.length > 0 &&
						existingQuestions.some((q) => q.organization_code !== defaultOrgCode)
					) {
						skipQuestions = true
						console.log(
							`[TENANT REPLICATION] Skipping questions — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipQuestions) {
					const newQuestions = questions.map((q) => ({
						...stripMeta(q),
						tenant_code: newTenantCode,
					}))
					const createdQuestions = await QuestionQueries.bulkCreate(newQuestions, newTenantCode, {
						transaction,
						returning: true,
					})

					let questionsToMap = createdQuestions
					if (createdQuestions.length < newQuestions.length) {
						console.log(
							`[TENANT REPLICATION] Questions: ${
								newQuestions.length - createdQuestions.length
							} duplicate(s) skipped — fetching existing records to complete ID mapping`
						)
						questionsToMap = await QuestionQueries.find({ tenant_code: newTenantCode })
					}

					for (const oldQ of questions) {
						const newQ = questionsToMap.find(
							(c) => c.name === oldQ.name && c.organization_code === oldQ.organization_code
						)
						if (newQ) questionIdMap[oldQ.id] = newQ.id
					}
					console.log(`[TENANT REPLICATION] Questions copied: ${createdQuestions.length}`)
				}
			}

			// ── 6. Question Sets ──────────────────────────────────────────────────
			const questionSets = await QuestionSetQueries.findQuestionSets({
				organization_code: defaultOrgCode,
				tenant_code: defaultTenantCode,
			})
			if (questionSets.length) {
				let skipQuestionSets = false
				if (options.backfill) {
					const existingQuestionSets = await QuestionSetQueries.findQuestionSets({
						tenant_code: newTenantCode,
					})
					if (
						existingQuestionSets.length > 0 &&
						existingQuestionSets.some((qs) => qs.organization_code !== defaultOrgCode)
					) {
						skipQuestionSets = true
						console.log(
							`[TENANT REPLICATION] Skipping question sets — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (questions.length > 0 && Object.keys(questionIdMap).length === 0) {
					skipQuestionSets = true
					console.log('[TENANT REPLICATION] Skipping question sets — questions were skipped, ID map is empty')
				}

				if (!skipQuestionSets) {
					const newQuestionSets = questionSets.map((qs) => ({
						...stripMeta(qs),
						tenant_code: newTenantCode,
						questions: (qs.questions || []).map((qId) => {
							const numericId = typeof qId === 'string' ? parseInt(qId, 10) : qId
							return questionIdMap[numericId] !== undefined ? questionIdMap[numericId] : qId
						}),
					}))
					await QuestionSetQueries.bulkCreate(newQuestionSets, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Question sets copied: ${newQuestionSets.length}`)
				}
			}

			// ── 7. Report Types ──────────────────────────────────────────────────
			const reportTypes = await ReportTypeQueries.findAllByFilter(
				{ organization_code: defaultOrgCode },
				defaultTenantCode
			)
			if (reportTypes.length) {
				let skipReportTypes = false
				if (options.backfill) {
					const existing = await ReportTypeQueries.findAllByFilter({}, newTenantCode)
					if (existing.length > 0 && existing.some((r) => r.organization_code !== defaultOrgCode)) {
						skipReportTypes = true
						console.log(
							`[TENANT REPLICATION] Skipping report types — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipReportTypes) {
					const newReportTypes = reportTypes.map((rt) => ({
						...stripMeta(rt),
						tenant_code: newTenantCode,
						organization_code: newOrgCode || defaultOrgCode,
					}))
					await ReportTypeQueries.bulkCreate(newReportTypes, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Report types copied: ${newReportTypes.length}`)
				}
			}

			// ── 8. Reports ───────────────────────────────────────────────────────
			const reports = await ReportQueries.findAllReports({ organization_code: defaultOrgCode }, defaultTenantCode)
			if (reports.length) {
				let skipReports = false
				if (options.backfill) {
					const existing = await ReportQueries.findAllReports({}, newTenantCode)
					if (existing.length > 0 && existing.some((r) => r.organization_code !== defaultOrgCode)) {
						skipReports = true
						console.log(
							`[TENANT REPLICATION] Skipping reports — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipReports) {
					const newReports = reports.map((r) => ({
						...stripMeta(r),
						tenant_code: newTenantCode,
						organization_id: newOrgIdStr,
						organization_code: newOrgCode || defaultOrgCode,
					}))
					await ReportQueries.bulkCreate(newReports, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Reports copied: ${newReports.length}`)
				}
			}

			// ── 9. Report Queries ────────────────────────────────────────────────
			const reportQueries = await ReportQueryQueries.findReportQueries(
				{ organization_code: defaultOrgCode },
				defaultTenantCode
			)
			if (reportQueries.length) {
				let skipReportQueries = false
				if (options.backfill) {
					const existing = await ReportQueryQueries.findReportQueries({}, newTenantCode)
					if (existing.length > 0 && existing.some((r) => r.organization_code !== defaultOrgCode)) {
						skipReportQueries = true
						console.log(
							`[TENANT REPLICATION] Skipping report queries — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipReportQueries) {
					const newReportQueries = reportQueries.map((rq) => ({
						...stripMeta(rq),
						tenant_code: newTenantCode,
						organization_id: newOrgIdStr,
						organization_code: newOrgCode || defaultOrgCode,
					}))
					await ReportQueryQueries.bulkCreate(newReportQueries, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Report queries copied: ${newReportQueries.length}`)
				}
			}

			// ── 10. Report Role Mappings ─────────────────────────────────────────
			const reportRoleMappings = await ReportRoleMappingQueries.findAllByFilter(
				{ organization_code: defaultOrgCode },
				defaultTenantCode
			)
			if (reportRoleMappings.length) {
				let skipReportRoleMappings = false
				if (options.backfill) {
					const existing = await ReportRoleMappingQueries.findAllByFilter({}, newTenantCode)
					if (existing.length > 0 && existing.some((r) => r.organization_code !== defaultOrgCode)) {
						skipReportRoleMappings = true
						console.log(
							`[TENANT REPLICATION] Skipping report role mappings — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipReportRoleMappings) {
					const newMappings = reportRoleMappings.map((rm) => ({
						...stripMeta(rm),
						tenant_code: newTenantCode,
						organization_code: newOrgCode || defaultOrgCode,
					}))
					await ReportRoleMappingQueries.bulkCreate(newMappings, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Report role mappings copied: ${newMappings.length}`)
				}
			}

			// ── 11. Role Extensions ──────────────────────────────────────────────
			const roleExtensions = await RoleExtensionQueries.findAllByFilter(
				{ organization_code: defaultOrgCode },
				defaultTenantCode
			)
			if (roleExtensions.length) {
				let skipRoleExtensions = false
				if (options.backfill) {
					const existing = await RoleExtensionQueries.findAllByFilter({}, newTenantCode)
					if (existing.length > 0 && existing.some((r) => r.organization_code !== defaultOrgCode)) {
						skipRoleExtensions = true
						console.log(
							`[TENANT REPLICATION] Skipping role extensions — tenant ${newTenantCode} already has data with a different organization_code`
						)
					}
				}

				if (!skipRoleExtensions) {
					const newRoleExtensions = roleExtensions.map((re) => ({
						...stripMeta(re),
						tenant_code: newTenantCode,
						organization_id: newOrgIdStr,
						organization_code: newOrgCode || defaultOrgCode,
					}))
					await RoleExtensionQueries.bulkCreate(newRoleExtensions, newTenantCode, { transaction })
					console.log(`[TENANT REPLICATION] Role extensions copied: ${newRoleExtensions.length}`)
				}
			}

			await transaction.commit()
			console.log(`[TENANT REPLICATION] Complete for tenant: ${newTenantCode}`)
		} catch (error) {
			await transaction.rollback()
			console.error(`[TENANT REPLICATION] Failed for tenant ${newTenantCode}:`, error.message)
			throw error
		}
	}
}
