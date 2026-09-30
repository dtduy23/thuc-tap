-- Văn bản (0020): cùng luật như mọi bảng nghiệp vụ — RLS theo đơn vị, không DELETE,
-- nhật ký và updated_at bằng trigger.
ALTER TABLE van_ban ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON van_ban FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY them ON van_ban FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON van_ban FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON van_ban TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON van_ban FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON van_ban FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
