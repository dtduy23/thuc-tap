-- Liên kết Native (0022): kho bí mật của TỪNG người — chỉ chủ tài khoản đọc/ghi dòng
-- của mình. Được DELETE (hủy liên kết là xóa bí mật, không phải dữ liệu nghiệp vụ).
ALTER TABLE lien_ket_native ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY cua_chinh_minh ON lien_ket_native
  USING (tai_khoan_id = app_tai_khoan_id()) WITH CHECK (tai_khoan_id = app_tai_khoan_id());
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON lien_ket_native TO gdos_app;
