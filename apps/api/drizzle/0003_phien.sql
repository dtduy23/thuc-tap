-- ============================================================================
-- Phiên đăng nhập — ADR-0003. Các hàm SECURITY DEFINER hẹp, vì lúc làm mới
-- phiên hay đăng xuất, API chưa biết người dùng là ai nên RLS che hết.
-- ============================================================================

-- Phạm vi dữ liệu của một tài khoản = đơn vị của nó + mọi đơn vị cấp dưới.
-- Tài khoản cấp tỉnh thấy mọi xã trực thuộc; tài khoản cấp xã chỉ thấy xã mình.
CREATE FUNCTION don_vi_pham_vi(p_don_vi uuid) RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH RECURSIVE cay AS (
    SELECT id FROM don_vi WHERE id = p_don_vi AND deleted_at IS NULL
    UNION ALL
    SELECT d.id FROM don_vi d JOIN cay c ON d.cha_id = c.id WHERE d.deleted_at IS NULL
  )
  SELECT coalesce(array_agg(id), '{}') FROM cay
$$;
--> statement-breakpoint

-- Đổi token làm mới, xoay vòng. Trả đúng một dòng nếu đổi được, KHÔNG dòng nào nếu không.
--
--   - Token không tồn tại / hết hạn                 → không đổi
--   - Tài khoản bị xóa hoặc bị quản trị KHÓA         → thu hồi phiên, không đổi
--   - Token ĐÃ bị thu hồi mà bị dùng lại            → dấu hiệu bị đánh cắp:
--       thu hồi MỌI phiên của tài khoản
--     trừ khi vừa thu hồi dưới 10 giây — đó là hai tab cùng làm mới một lúc,
--     không phạt người dùng thật.
--
-- Khóa TẠM do nhập sai mật khẩu (khoa_den) không giết phiên đang dùng: nếu có,
-- kẻ khác chỉ cần cố tình gõ sai 5 lần là đá được người thật ra khỏi hệ thống.
CREATE FUNCTION phien_doi(
  p_cu text, p_moi text, p_het_han timestamptz, p_ip text, p_trinh_duyet text
)
RETURNS TABLE (tai_khoan_id uuid, don_vi_id uuid, la_quan_tri boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  p  phien_dang_nhap%ROWTYPE;
  tk tai_khoan%ROWTYPE;
BEGIN
  SELECT * INTO p FROM phien_dang_nhap WHERE token_bam = p_cu FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF p.thu_hoi_luc IS NOT NULL THEN
    IF p.thu_hoi_luc < now() - interval '10 seconds' THEN
      UPDATE phien_dang_nhap SET thu_hoi_luc = now()
      WHERE phien_dang_nhap.tai_khoan_id = p.tai_khoan_id AND thu_hoi_luc IS NULL;
    END IF;
    RETURN;
  END IF;

  IF p.het_han <= now() THEN
    RETURN;
  END IF;

  SELECT * INTO tk FROM tai_khoan WHERE id = p.tai_khoan_id;
  UPDATE phien_dang_nhap SET thu_hoi_luc = now() WHERE id = p.id;
  IF tk.deleted_at IS NOT NULL OR tk.trang_thai <> 'hoat-dong' THEN
    RETURN;
  END IF;

  INSERT INTO phien_dang_nhap (tai_khoan_id, token_bam, het_han, dia_chi_ip, trinh_duyet)
  VALUES (tk.id, p_moi, p_het_han, p_ip, p_trinh_duyet);

  RETURN QUERY SELECT tk.id, tk.don_vi_id, tk.la_quan_tri;
END
$$;
--> statement-breakpoint

-- Đăng xuất: thu hồi đúng phiên có token này. Không lộ gì ra ngoài.
CREATE FUNCTION phien_thu_hoi(p_token text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  UPDATE phien_dang_nhap SET thu_hoi_luc = now() WHERE token_bam = p_token AND thu_hoi_luc IS NULL
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION don_vi_pham_vi(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION phien_doi(text, text, timestamptz, text, text) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION phien_thu_hoi(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION don_vi_pham_vi(uuid) TO gdos_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION phien_doi(text, text, timestamptz, text, text) TO gdos_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION phien_thu_hoi(text) TO gdos_app;
