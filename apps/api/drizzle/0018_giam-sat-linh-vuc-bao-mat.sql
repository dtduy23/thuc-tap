-- ============================================================================
-- Giám sát theo lĩnh vực (0017). Người được giao lĩnh vực THẤY mọi dự án của lĩnh
-- vực đó ở mọi đơn vị — chỉ XEM: các policy ghi của dự án vẫn chỉ theo đơn vị,
-- nên không có lối nào để người giám sát sửa hay xác nhận.
-- ============================================================================

-- Dự án thuộc lĩnh vực tôi giám sát.
CREATE FUNCTION app_du_an_giam_sat() RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT coalesce(array_agg(d.id), '{}') FROM du_an d
  JOIN giam_sat_linh_vuc g ON g.linh_vuc_id = d.linh_vuc_id
  WHERE g.tai_khoan_id = app_tai_khoan_id() AND g.deleted_at IS NULL AND d.deleted_at IS NULL
$$;
--> statement-breakpoint
-- Dự án tôi được XEM ngoài đơn vị: là thành viên, hoặc giám sát lĩnh vực.
CREATE FUNCTION app_du_an_xem() RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT app_du_an_thanh_vien() || app_du_an_giam_sat()
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_du_an_giam_sat() FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_du_an_xem() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_du_an_giam_sat() TO gdos_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_du_an_xem() TO gdos_app;
--> statement-breakpoint

-- ── Đọc dự án và mọi bảng con: thêm lối "giám sát lĩnh vực" ─────────────────
ALTER POLICY doc ON du_an USING (don_vi_id = ANY (app_don_vi_ids()) OR id = ANY (app_du_an_xem()));
--> statement-breakpoint
ALTER POLICY doc ON du_an_buoc USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_xem()));
--> statement-breakpoint
ALTER POLICY doc ON du_an_phien_ban USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_xem()));
--> statement-breakpoint
ALTER POLICY doc ON du_an_van_ban USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_xem()));
--> statement-breakpoint
ALTER POLICY doc ON du_an_von USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_xem()));
--> statement-breakpoint
ALTER POLICY doc ON du_an_giai_ngan USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_xem()));
--> statement-breakpoint
ALTER POLICY doc ON du_an_vuong_mac USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_xem()));
--> statement-breakpoint
ALTER POLICY doc ON du_an_don_doc USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_xem()));
--> statement-breakpoint
-- Thành viên: người giám sát thấy danh sách thành viên; nhà thầu vẫn chỉ thấy dòng của mình.
ALTER POLICY doc ON du_an_thanh_vien USING (
  don_vi_id = ANY (app_don_vi_ids()) OR tai_khoan_id = app_tai_khoan_id()
  OR du_an_id = ANY (app_du_an_giam_sat()));
--> statement-breakpoint

-- ── Bảng giao giám sát: quản trị đơn vị của tài khoản đó thấy và giao ──────
ALTER TABLE giam_sat_linh_vuc ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON giam_sat_linh_vuc FOR SELECT
  USING (don_vi_id = ANY (app_don_vi_ids()) OR tai_khoan_id = app_tai_khoan_id());
--> statement-breakpoint
CREATE POLICY them ON giam_sat_linh_vuc FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
CREATE POLICY sua ON giam_sat_linh_vuc FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids())) WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON giam_sat_linh_vuc TO gdos_app;
--> statement-breakpoint
-- don_vi_id luôn = đơn vị của tài khoản được giao — app không tự khai được.
CREATE FUNCTION dat_don_vi_theo_tai_khoan() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  SELECT don_vi_id INTO NEW.don_vi_id FROM tai_khoan WHERE id = NEW.tai_khoan_id;
  IF NEW.don_vi_id IS NULL THEN RAISE EXCEPTION 'Tài khoản không tồn tại'; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION dat_don_vi_theo_tai_khoan() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER dat_don_vi BEFORE INSERT OR UPDATE ON giam_sat_linh_vuc
  FOR EACH ROW EXECUTE FUNCTION dat_don_vi_theo_tai_khoan();
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON giam_sat_linh_vuc FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON giam_sat_linh_vuc FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
