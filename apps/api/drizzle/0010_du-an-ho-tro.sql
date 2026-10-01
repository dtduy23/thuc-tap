-- ============================================================================
-- Hỗ trợ module Dự án (ADR-0008).
-- ============================================================================

-- Số thứ tự cho mã dự án tự sinh (DA-<năm>-<số>). Dùng sequence chung vì RLS che
-- dự án của đơn vị khác — đếm "số lớn nhất đang thấy" sẽ sinh mã trùng.
CREATE SEQUENCE du_an_so_thu_tu;
--> statement-breakpoint
GRANT USAGE ON SEQUENCE du_an_so_thu_tu TO gdos_app;
--> statement-breakpoint

-- Danh bạ tài khoản — để chọn cán bộ phụ trách, nhà thầu, tư vấn. Tài khoản ở đơn
-- vị doanh nghiệp nằm ngoài phạm vi của xã, nên không có hàm này thì chủ đầu tư
-- cấp xã không chọn được nhà thầu. Chỉ trả tên và đơn vị — không gì khác.
CREATE FUNCTION danh_ba_tai_khoan(p_tim text, p_cap text[] DEFAULT NULL)
RETURNS TABLE (id uuid, ho_ten text, ten_dang_nhap text, don_vi_ten text, don_vi_cap text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT t.id, t.ho_ten, t.ten_dang_nhap::text, d.ten, d.cap
  FROM tai_khoan t JOIN don_vi d ON d.id = t.don_vi_id
  WHERE app_tai_khoan_id() IS NOT NULL
    AND t.deleted_at IS NULL AND t.trang_thai = 'hoat-dong' AND d.deleted_at IS NULL
    AND (p_cap IS NULL OR d.cap = ANY (p_cap))
    AND (coalesce(p_tim, '') = ''
         OR t.ho_ten ILIKE '%' || p_tim || '%'
         OR t.ten_dang_nhap ILIKE '%' || p_tim || '%'
         OR d.ten ILIKE '%' || p_tim || '%')
  ORDER BY d.ten, t.ho_ten
  LIMIT 30
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION danh_ba_tai_khoan(text, text[]) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION danh_ba_tai_khoan(text, text[]) TO gdos_app;
--> statement-breakpoint

-- Tên hiển thị qua ranh giới phạm vi: nhà thầu cần thấy TÊN chủ đầu tư, chủ đầu
-- tư cần thấy TÊN nhà thầu — dù RLS che dòng của nhau. Chỉ trả tên.
CREATE FUNCTION ten_don_vi(p_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT ten FROM don_vi WHERE id = p_id
$$;
--> statement-breakpoint
CREATE FUNCTION ten_tai_khoan(p_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT ho_ten FROM tai_khoan WHERE id = p_id
$$;
--> statement-breakpoint
CREATE FUNCTION ten_don_vi_cua_tai_khoan(p_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT d.ten FROM tai_khoan t JOIN don_vi d ON d.id = t.don_vi_id WHERE t.id = p_id
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION ten_don_vi(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION ten_tai_khoan(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION ten_don_vi_cua_tai_khoan(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION ten_don_vi(uuid) TO gdos_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION ten_tai_khoan(uuid) TO gdos_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION ten_don_vi_cua_tai_khoan(uuid) TO gdos_app;
