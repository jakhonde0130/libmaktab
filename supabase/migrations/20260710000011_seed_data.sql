-- ============================================================================
-- ILMS schema — 11: seed data (roles, starter permission catalog, languages)
-- ============================================================================

insert into roles (code, name, description) values
  ('director', 'Director', 'Full system oversight and reporting'),
  ('administrator', 'Administrator', 'System configuration, users, and roles'),
  ('librarian', 'Librarian', 'Cataloging, circulation, and inventory'),
  ('operator', 'Operator', 'Day-to-day circulation desk operations'),
  ('teacher', 'Teacher', 'Reader with extended borrowing privileges'),
  ('reader', 'Reader', 'Standard library patron');

insert into permissions (code, module, description) values
  ('books.read', 'books', 'View bibliographic records'),
  ('books.write', 'books', 'Create/edit bibliographic records'),
  ('books.delete', 'books', 'Delete bibliographic records'),
  ('circulation.issue', 'circulation', 'Issue a book copy to a reader'),
  ('circulation.return', 'circulation', 'Process a return'),
  ('circulation.manage_penalties', 'circulation', 'Waive or adjust fines'),
  ('readers.read', 'readers', 'View reader accounts'),
  ('readers.write', 'readers', 'Create/edit reader accounts'),
  ('inventory.audit', 'inventory', 'Run stocktake / shelf-check sessions'),
  ('reports.view', 'reports', 'View analytics and export reports'),
  ('admin.manage_roles', 'admin', 'Manage roles and permissions'),
  ('admin.manage_settings', 'admin', 'Change system settings');

-- Baseline role -> permission grants. Fully editable afterwards from the
-- Admin Panel (Phase 14) via the role_permissions table.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.code = 'director';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.code = 'administrator';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'librarian'
  and p.code in (
    'books.read', 'books.write', 'circulation.issue', 'circulation.return',
    'circulation.manage_penalties', 'readers.read', 'readers.write',
    'inventory.audit', 'reports.view'
  );

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'operator'
  and p.code in ('books.read', 'circulation.issue', 'circulation.return', 'readers.read');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code in ('teacher', 'reader') and p.code = 'books.read';

insert into languages (code, name) values
  ('uz', 'O''zbek'),
  ('ru', 'Русский'),
  ('en', 'English');

insert into settings (key, value, description) values
  ('circulation.default_loan_days', '14', 'Default loan period in days'),
  ('circulation.max_renewals', '2', 'Maximum renewals allowed per loan'),
  ('circulation.max_active_loans', '5', 'Maximum concurrent active loans per reader'),
  ('circulation.overdue_fine_per_day', '1000', 'Fine amount per overdue day (UZS)'),
  ('electronic_library.download_enabled_default', 'true', 'Default download permission for newly uploaded files');
