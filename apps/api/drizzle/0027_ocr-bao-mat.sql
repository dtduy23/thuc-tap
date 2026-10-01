-- OCR (0026): cùng luật như mọi bảng nghiệp vụ — RLS theo đơn vị, không DELETE,
-- nhật ký và updated_at bằng trigger.
ALTER TABLE ocr_loai ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON ocr_loai FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY them ON ocr_loai FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON ocr_loai FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON ocr_loai TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON ocr_loai FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON ocr_loai FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
ALTER TABLE ocr_chung_tu ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON ocr_chung_tu FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY them ON ocr_chung_tu FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON ocr_chung_tu FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON ocr_chung_tu TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON ocr_chung_tu FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON ocr_chung_tu FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
