-- ============================================================================
-- Văn bản, vốn, giải ngân, vướng mắc (0013) — cùng luật bảo mật như bước dự án:
-- thấy khi đơn vị trong phạm vi HOẶC là thành viên; chỉ đơn vị chủ đầu tư ghi;
-- không DELETE; don_vi_id lấy theo dự án; nhật ký + updated_at do trigger.
-- ============================================================================
ALTER TABLE du_an_van_ban ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON du_an_van_ban FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_thanh_vien()));
--> statement-breakpoint
CREATE POLICY them ON du_an_van_ban FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON du_an_van_ban FOR UPDATE USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON du_an_van_ban TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dong_bo_don_vi BEFORE INSERT OR UPDATE ON du_an_van_ban FOR EACH ROW EXECUTE FUNCTION dong_bo_don_vi_du_an();
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON du_an_van_ban FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON du_an_van_ban FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
ALTER TABLE du_an_von ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON du_an_von FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_thanh_vien()));
--> statement-breakpoint
CREATE POLICY them ON du_an_von FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON du_an_von FOR UPDATE USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON du_an_von TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dong_bo_don_vi BEFORE INSERT OR UPDATE ON du_an_von FOR EACH ROW EXECUTE FUNCTION dong_bo_don_vi_du_an();
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON du_an_von FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON du_an_von FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
ALTER TABLE du_an_giai_ngan ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON du_an_giai_ngan FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_thanh_vien()));
--> statement-breakpoint
CREATE POLICY them ON du_an_giai_ngan FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON du_an_giai_ngan FOR UPDATE USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON du_an_giai_ngan TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dong_bo_don_vi BEFORE INSERT OR UPDATE ON du_an_giai_ngan FOR EACH ROW EXECUTE FUNCTION dong_bo_don_vi_du_an();
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON du_an_giai_ngan FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON du_an_giai_ngan FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
ALTER TABLE du_an_vuong_mac ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON du_an_vuong_mac FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_thanh_vien()));
--> statement-breakpoint
CREATE POLICY them ON du_an_vuong_mac FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON du_an_vuong_mac FOR UPDATE USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON du_an_vuong_mac TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dong_bo_don_vi BEFORE INSERT OR UPDATE ON du_an_vuong_mac FOR EACH ROW EXECUTE FUNCTION dong_bo_don_vi_du_an();
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON du_an_vuong_mac FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON du_an_vuong_mac FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
-- Dự án đổi chủ đầu tư → mọi bảng con đổi theo.
CREATE OR REPLACE FUNCTION du_an_doi_don_vi() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE du_an_buoc SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  UPDATE du_an_thanh_vien SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  UPDATE du_an_phien_ban SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  UPDATE du_an_van_ban SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  UPDATE du_an_von SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  UPDATE du_an_giai_ngan SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  UPDATE du_an_vuong_mac SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  RETURN NEW;
END
$$;
