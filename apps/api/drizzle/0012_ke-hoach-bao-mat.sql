-- ============================================================================
-- Phiên bản kế hoạch (0011) — cùng luật bảo mật như bước dự án (0009).
-- ============================================================================

ALTER TABLE du_an_phien_ban ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON du_an_phien_ban FOR SELECT
  USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_thanh_vien()));
--> statement-breakpoint
CREATE POLICY them ON du_an_phien_ban FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
-- Phiên bản đã chốt là vết lịch sử: không có policy UPDATE → không ai sửa được.
GRANT SELECT, INSERT ON du_an_phien_ban TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dong_bo_don_vi BEFORE INSERT ON du_an_phien_ban FOR EACH ROW EXECUTE FUNCTION dong_bo_don_vi_du_an();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON du_an_phien_ban FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint

-- Dự án đổi chủ đầu tư thì phiên bản đổi theo (bổ sung vào hàm của 0009).
CREATE OR REPLACE FUNCTION du_an_doi_don_vi() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE du_an_buoc SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  UPDATE du_an_thanh_vien SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  UPDATE du_an_phien_ban SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  RETURN NEW;
END
$$;
--> statement-breakpoint

-- Dự án tạo trước bản này chưa có phiên bản 1 — dựng từ kế hoạch hiện tại.
INSERT INTO du_an_phien_ban (du_an_id, don_vi_id, so, ngay, ly_do, ngay_ket_thuc, anh_chup, nguoi_chot)
SELECT d.id, d.don_vi_id, 1, d.ngay_bat_dau, 'Kế hoạch gốc theo quy trình mẫu',
       (SELECT max(b.han) FROM du_an_buoc b WHERE b.du_an_id = d.id AND NOT b.la_nhap AND b.deleted_at IS NULL),
       coalesce((SELECT jsonb_agg(jsonb_build_object('id', b.id, 'stt', b.stt, 'ten', b.ten, 'han', b.han) ORDER BY b.thu_tu)
                 FROM du_an_buoc b WHERE b.du_an_id = d.id AND NOT b.la_nhap AND b.deleted_at IS NULL), '[]'),
       d.nguoi_tao
FROM du_an d
WHERE NOT EXISTS (SELECT 1 FROM du_an_phien_ban p WHERE p.du_an_id = d.id);
