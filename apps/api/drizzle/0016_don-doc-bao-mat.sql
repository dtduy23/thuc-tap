-- Đôn đốc (0015): cùng luật như các bảng con của dự án; là vết nên không có UPDATE.
ALTER TABLE du_an_don_doc ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY doc ON du_an_don_doc FOR SELECT
  USING (don_vi_id = ANY (app_don_vi_ids()) OR du_an_id = ANY (app_du_an_thanh_vien()));
--> statement-breakpoint
CREATE POLICY them ON du_an_don_doc FOR INSERT WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT ON du_an_don_doc TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dong_bo_don_vi BEFORE INSERT ON du_an_don_doc FOR EACH ROW EXECUTE FUNCTION dong_bo_don_vi_du_an();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON du_an_don_doc FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
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
  UPDATE du_an_don_doc SET don_vi_id = NEW.don_vi_id WHERE du_an_id = NEW.id;
  RETURN NEW;
END
$$;
