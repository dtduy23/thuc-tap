-- ============================================================================
-- Đếm chỗ đang dùng một giá trị danh mục / một quy trình mẫu — TOÀN hệ thống,
-- kể cả đơn vị người sửa không thấy (RLS). Không có số này thì xã A có thể xóa
-- lĩnh vực mà xã B đang dùng. Chỉ trả con số, không lộ dự án nào.
-- ============================================================================
CREATE FUNCTION dem_dung_danh_muc(p_id uuid) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT (
      (SELECT count(*) FROM du_an WHERE linh_vuc_id = p_id AND deleted_at IS NULL)
    + (SELECT count(*) FROM du_an_von WHERE nguon_von_id = p_id AND deleted_at IS NULL)
    + (SELECT count(*) FROM du_an_giai_ngan WHERE nguon_von_id = p_id AND deleted_at IS NULL)
    + (SELECT count(*) FROM giam_sat_linh_vuc WHERE linh_vuc_id = p_id AND deleted_at IS NULL)
  )::int
$$;
--> statement-breakpoint
CREATE FUNCTION dem_dung_quy_trinh(p_ma text) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT count(*)::int FROM du_an WHERE quy_trinh_ma = p_ma AND deleted_at IS NULL
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION dem_dung_danh_muc(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION dem_dung_quy_trinh(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION dem_dung_danh_muc(uuid) TO gdos_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION dem_dung_quy_trinh(text) TO gdos_app;
