-- ============================================================================
-- Cấu hình hệ thống (bảng cau_hinh, 0006). Không bí mật → không RLS, app chỉ
-- ĐỌC. Ghi qua MỘT hàm hẹp, hàm tự kiểm bằng database người ghi là quản trị
-- đang hoạt động ở đơn vị GỐC — cấu hình chung của cả hệ thống không để một
-- quản trị cấp xã trong hệ thống nhiều xã tự đổi.
-- ============================================================================

GRANT SELECT ON cau_hinh TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON cau_hinh FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
CREATE FUNCTION cau_hinh_ghi(p_khoa text, p_gia_tri jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  dv uuid;
BEGIN
  SELECT t.don_vi_id INTO dv
  FROM tai_khoan t JOIN don_vi d ON d.id = t.don_vi_id
  WHERE t.id = app_tai_khoan_id() AND t.la_quan_tri AND t.trang_thai = 'hoat-dong'
    AND t.deleted_at IS NULL AND d.cha_id IS NULL AND d.deleted_at IS NULL;
  IF dv IS NULL THEN
    RAISE EXCEPTION 'Chỉ quản trị ở đơn vị gốc được sửa cấu hình hệ thống' USING ERRCODE = '42501';
  END IF;
  IF p_khoa NOT IN ('bao-mat', 'nhan-dien') OR jsonb_typeof(p_gia_tri) <> 'object' THEN
    RAISE EXCEPTION 'Cấu hình không hợp lệ' USING ERRCODE = '22023';
  END IF;
  INSERT INTO cau_hinh (khoa, gia_tri, don_vi_id, tai_khoan_id)
  VALUES (p_khoa, p_gia_tri, dv, app_tai_khoan_id())
  ON CONFLICT (khoa) DO UPDATE
    SET gia_tri = EXCLUDED.gia_tri, don_vi_id = EXCLUDED.don_vi_id,
        tai_khoan_id = EXCLUDED.tai_khoan_id, updated_at = now();
END
$$;
--> statement-breakpoint
-- Đơn vị gốc (không có cấp trên) — cho màn đăng nhập, lúc chưa có ngữ cảnh đơn vị.
-- Chỉ trả tên, không trả gì khác.
CREATE FUNCTION don_vi_goc() RETURNS TABLE (id uuid, ten text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT d.id, d.ten FROM don_vi d
  WHERE d.cha_id IS NULL AND d.deleted_at IS NULL
  ORDER BY d.created_at
  LIMIT 1
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION cau_hinh_ghi(text, jsonb) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION don_vi_goc() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION cau_hinh_ghi(text, jsonb) TO gdos_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION don_vi_goc() TO gdos_app;
