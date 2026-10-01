-- ============================================================================
-- Quản trị Tầng 2 — tài khoản, đơn vị (ADR-0004, ADR-0006).
-- ============================================================================

-- Tạo đơn vị cấp dưới. Policy chung của don_vi đòi `id` nằm trong phạm vi —
-- dòng MỚI thì chưa có id nào trong phạm vi, nên INSERT luôn bị chặn. Cho thêm
-- khi CHA nằm trong phạm vi: quản trị tỉnh tạo được xã của tỉnh mình, không tạo
-- được xã cho tỉnh khác. (Policy cùng lệnh được OR với nhau.)
CREATE POLICY them_cap_duoi ON don_vi FOR INSERT WITH CHECK (cha_id = ANY (app_don_vi_ids()));
--> statement-breakpoint

-- Thu hồi MỌI phiên của một tài khoản — khi quản trị khóa tài khoản hoặc đặt
-- lại mật khẩu. RLS của phien_dang_nhap chỉ cho thấy phiên của chính mình, nên
-- cần một lối hẹp, và lối này tự kiểm hai điều bằng database:
--   - người gọi đang có cờ quản trị (không trông vào API đã kiểm)
--   - tài khoản đích nằm trong phạm vi đơn vị của người gọi
CREATE FUNCTION phien_thu_hoi_tai_khoan(p_tai_khoan uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  n integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tai_khoan
    WHERE id = app_tai_khoan_id() AND la_quan_tri AND deleted_at IS NULL AND trang_thai = 'hoat-dong'
  ) THEN
    RAISE EXCEPTION 'Chỉ quản trị hệ thống được thu hồi phiên của người khác' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE id = p_tai_khoan AND don_vi_id = ANY (app_don_vi_ids())) THEN
    RAISE EXCEPTION 'Tài khoản nằm ngoài phạm vi đơn vị' USING ERRCODE = '42501';
  END IF;
  UPDATE phien_dang_nhap SET thu_hoi_luc = now() WHERE tai_khoan_id = p_tai_khoan AND thu_hoi_luc IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION phien_thu_hoi_tai_khoan(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION phien_thu_hoi_tai_khoan(uuid) TO gdos_app;
--> statement-breakpoint
-- Cột mới của tai_khoan (0004): quyền đọc theo cột phải cấp riêng — xem 0002.
GRANT SELECT (phai_doi_mat_khau) ON tai_khoan TO gdos_app;
