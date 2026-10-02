-- ============================================================================
-- Xin gia hạn bước (0030) + khóa cấu hình 'luong-duyet'.
--
-- Yêu cầu gia hạn: thấy như mọi bảng con của dự án (đơn vị chủ đầu tư, thành viên,
-- người giám sát lĩnh vực). GỬI: đơn vị chủ đầu tư, hoặc thành viên dự án (nhà thầu,
-- tư vấn) gửi cho CHÍNH mình. DUYỆT (sửa): chỉ đơn vị chủ đầu tư. Người gửi ngoài
-- đơn vị chỉ được RÚT yêu cầu của mình — trigger chặn mọi thay đổi khác.
-- ============================================================================
ALTER TABLE du_an_gia_han ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON du_an_gia_han FOR SELECT
  USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_xem()));
--> statement-breakpoint
CREATE POLICY them ON du_an_gia_han FOR INSERT WITH CHECK (
  don_vi_id = ANY (app_don_vi_ids())
  OR (du_an_id = ANY (app_du_an_thanh_vien()) AND nguoi_xin = app_tai_khoan_id() AND trang_thai = 'cho-duyet')
);
--> statement-breakpoint
CREATE POLICY sua ON du_an_gia_han FOR UPDATE
  USING (don_vi_id = ANY (app_don_vi_ids()) OR (nguoi_xin = app_tai_khoan_id() AND trang_thai = 'cho-duyet'))
  WITH CHECK (don_vi_id = ANY (app_don_vi_ids()) OR (nguoi_xin = app_tai_khoan_id() AND trang_thai = 'da-rut'));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON du_an_gia_han TO gdos_app;
--> statement-breakpoint
-- Người ngoài đơn vị chủ đầu tư chỉ đổi được trạng thái sang "đã rút" — không tự sửa hạn
-- xin, không tự ghi kết quả duyệt. (Dự án đổi chủ đầu tư chỉ đổi don_vi_id: cho qua.)
CREATE FUNCTION du_an_gia_han_chi_rut() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.don_vi_id = ANY (app_don_vi_ids()) THEN
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - 'don_vi_id' - 'updated_at') = (to_jsonb(OLD) - 'don_vi_id' - 'updated_at') THEN
    RETURN NEW;
  END IF;
  IF NEW.trang_thai <> 'da-rut'
     OR (to_jsonb(NEW) - 'trang_thai' - 'don_vi_id' - 'updated_at')
        <> (to_jsonb(OLD) - 'trang_thai' - 'don_vi_id' - 'updated_at') THEN
    RAISE EXCEPTION 'Người gửi chỉ được rút yêu cầu gia hạn của mình' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER chi_rut BEFORE UPDATE ON du_an_gia_han FOR EACH ROW EXECUTE FUNCTION du_an_gia_han_chi_rut();
--> statement-breakpoint
CREATE TRIGGER dong_bo_don_vi BEFORE INSERT OR UPDATE ON du_an_gia_han FOR EACH ROW EXECUTE FUNCTION dong_bo_don_vi_du_an();
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON du_an_gia_han FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON du_an_gia_han FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
-- Dự án đổi chủ đầu tư → mọi bảng con đổi theo (thêm bảng gia hạn).
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
  UPDATE du_an_gia_han SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  RETURN NEW;
END
$$;
--> statement-breakpoint
-- Cấu hình hệ thống: mở thêm khóa 'luong-duyet' (Tầng 2 › Luồng phê duyệt).
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
  IF p_khoa NOT IN ('bao-mat', 'nhan-dien', 'canh-bao', 'trang-dau', 'luong-duyet')
     OR jsonb_typeof(p_gia_tri) <> 'object' THEN
    RAISE EXCEPTION 'Cấu hình không hợp lệ' USING ERRCODE = '22023';
  END IF;
  INSERT INTO cau_hinh (khoa, gia_tri, don_vi_id, tai_khoan_id)
  VALUES (p_khoa, p_gia_tri, dv, app_tai_khoan_id())
  ON CONFLICT (khoa) DO UPDATE
    SET gia_tri = EXCLUDED.gia_tri, don_vi_id = EXCLUDED.don_vi_id,
        tai_khoan_id = EXCLUDED.tai_khoan_id, updated_at = now();
END
$$;
