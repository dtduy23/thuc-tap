-- ============================================================================
-- Thêm hai nhóm cấu hình hệ thống: ngưỡng cảnh báo ('canh-bao') và trang mặc
-- định theo vai ('trang-dau'). Vẫn ghi qua MỘT hàm hẹp cau_hinh_ghi (0007):
-- chỉ quản trị đang hoạt động ở đơn vị GỐC ghi được; chỉ mở thêm hai khóa.
-- ============================================================================

CREATE OR REPLACE FUNCTION cau_hinh_ghi(p_khoa text, p_gia_tri jsonb) RETURNS void
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
  IF p_khoa NOT IN ('bao-mat', 'nhan-dien', 'canh-bao', 'trang-dau') OR jsonb_typeof(p_gia_tri) <> 'object' THEN
    RAISE EXCEPTION 'Cấu hình không hợp lệ' USING ERRCODE = '22023';
  END IF;
  INSERT INTO cau_hinh (khoa, gia_tri, don_vi_id, tai_khoan_id)
  VALUES (p_khoa, p_gia_tri, dv, app_tai_khoan_id())
  ON CONFLICT (khoa) DO UPDATE
    SET gia_tri = EXCLUDED.gia_tri, don_vi_id = EXCLUDED.don_vi_id,
        tai_khoan_id = EXCLUDED.tai_khoan_id, updated_at = now();
END
$$;
