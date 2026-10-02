-- Nguồn dữ liệu vào (0028): cùng luật như mọi bảng nghiệp vụ — RLS theo đơn vị, không DELETE,
-- nhật ký và updated_at bằng trigger. Riêng kho bí mật: không nhật ký (như lien_ket_native).
ALTER TABLE nguon_du_lieu ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON nguon_du_lieu FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY them ON nguon_du_lieu FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON nguon_du_lieu FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON nguon_du_lieu TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON nguon_du_lieu FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON nguon_du_lieu FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
ALTER TABLE chi_tieu_lan_nap ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON chi_tieu_lan_nap FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY them ON chi_tieu_lan_nap FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON chi_tieu_lan_nap FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON chi_tieu_lan_nap TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON chi_tieu_lan_nap FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON chi_tieu_lan_nap FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
ALTER TABLE chi_tieu_so_lieu ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON chi_tieu_so_lieu FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY them ON chi_tieu_so_lieu FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON chi_tieu_so_lieu FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON chi_tieu_so_lieu TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON chi_tieu_so_lieu FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON chi_tieu_so_lieu FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
ALTER TABLE nguon_du_lieu_bi_mat ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON nguon_du_lieu_bi_mat FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY them ON nguon_du_lieu_bi_mat FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON nguon_du_lieu_bi_mat FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON nguon_du_lieu_bi_mat TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON nguon_du_lieu_bi_mat FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE POLICY xoa ON nguon_du_lieu_bi_mat FOR DELETE USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT DELETE ON nguon_du_lieu_bi_mat TO gdos_app;
