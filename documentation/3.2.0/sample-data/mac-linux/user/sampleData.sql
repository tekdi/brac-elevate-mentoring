

INSERT INTO public.users (id, name, email, email_verified, roles, status, password, has_accepted_terms_and_conditions, about, location, languages, preferred_language, share_link, image, custom_entity_text, meta, created_at, updated_at, deleted_at, tenant_code, phone, phone_code, username) VALUES (1, 'Aarav Patel', '8d1f1e11989cf7b739c9daa972c56c5083b46d490f8023a67eb89d28a2b615ef', 'false', '{5}', 'ACTIVE', '\$2a\$10\$NTzc2CjEbwB4DavjEKU11eqJXJLrODnvAwvXWor9Dz/gXr55Pvyj.', false, 'MENTEE', NULL, '{en_in}', 'en', NULL, 'users/801-1754620428088-cafer_mert_ceyhan_i8z9clwc9ie_unsplash_jpg', NULL, '{}', '2025-08-05 06:39:10.129+00', '2025-08-08 03:10:09.342+00', NULL, 'default', NULL, NULL, 'Arav_patel');
INSERT INTO public.users (id, name, email, email_verified, roles, status, password, has_accepted_terms_and_conditions, about, location, languages, preferred_language, share_link, image, custom_entity_text, meta, created_at, updated_at, deleted_at, tenant_code, phone, phone_code, username) VALUES (2, 'Arunima Reddy', '0f34042735bb359f1c227b4497cf5074b372085830eef69db07dd80789c25dd5', 'false', '{4}', 'ACTIVE', '\$2a\$10\$NTzc2CjEbwB4DavjEKU11eqJXJLrODnvAwvXWor9Dz/gXr55Pvyj.', false, 'MENTEE', NULL, '{en_in}', 'en', NULL, 'users/801-1754620428088-cafer_mert_ceyhan_i8z9clwc9ie_unsplash_jpg', NULL, '{}', '2025-08-05 06:39:10.129+00', '2025-08-08 03:10:09.342+00', NULL, 'default', NULL, NULL, 'Arunima_reddy');
INSERT INTO public.users (id, name, email, email_verified, roles, status, password, has_accepted_terms_and_conditions, about, location, languages, preferred_language, share_link, image, custom_entity_text, meta, created_at, updated_at, deleted_at, tenant_code, phone, phone_code, username) VALUES (3, 'Devika Singh', '1e8828f2f98d16ff63a424620f9d582a1de88268414606a0593c73eb5316543c', 'false', '{7,1,5}', 'ACTIVE', '\$2a\$10\$NTzc2CjEbwB4DavjEKU11eqJXJLrODnvAwvXWor9Dz/gXr55Pvyj.', false, 'MENTEE', NULL, '{en_in}', 'en', NULL, 'users/801-1754620428088-cafer_mert_ceyhan_i8z9clwc9ie_unsplash_jpg', NULL, '{}', '2025-08-05 06:39:10.129+00', '2025-08-08 03:10:09.342+00', NULL, 'default', NULL, NULL, 'Devika_singh');

INSERT INTO public.user_organizations (user_id, organization_code,tenant_code,  created_at, updated_at, deleted_at) VALUES (1, 'default_code','default',  '2024-04-18 08:12:19.407+00', '2024-04-18 08:12:19.407+00', NULL);
INSERT INTO public.user_organizations (user_id, organization_code,tenant_code,   created_at, updated_at, deleted_at) VALUES (2, 'default_code', 'default', '2024-04-18 08:12:19.407+00', '2024-04-18 08:12:19.407+00', NULL);
INSERT INTO public.user_organizations (user_id, organization_code,tenant_code,  created_at, updated_at, deleted_at) VALUES (3, 'default_code', 'default', '2024-04-18 08:12:19.407+00', '2024-04-18 08:12:19.407+00', NULL);

-- SELECT nextval('user_organizations_id_seq'::regclass) FROM public.user_organizations;

INSERT INTO public.user_organization_roles VALUES ('default',1,'default_code', 5,  '2025-05-13 16:42:26.491+05:30', '2025-05-13 16:42:26.491+05:30', NULL);
INSERT INTO public.user_organization_roles VALUES ('default', 2,'default_code', 4,  '2025-05-13 16:42:26.491+05:30', '2025-05-13 16:42:26.491+05:30', NULL);
INSERT INTO public.user_organization_roles VALUES ('default', 3,'default_code', 5,  '2025-05-13 16:42:26.491+05:30', '2025-05-13 16:42:26.491+05:30', NULL);



SELECT NULL;
