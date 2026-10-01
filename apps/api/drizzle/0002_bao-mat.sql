-- ============================================================================
-- Lớp bảo mật — ADR-0004, ADR-0006. Chặn bằng DATABASE, không trông vào code.
--
--   1. Role gdos_app: MỌI request của API chạy dưới role này (SET LOCAL ROLE).
--      Nó không sở hữu bảng → RLS luôn có hiệu lực với nó.
--   2. RLS theo đơn vị trên mọi bảng có dữ liệu của đơn vị.
--   3. gdos_app KHÔNG có quyền DELETE → xóa mềm là cách xóa DUY NHẤT.
--   4. gdos_app KHÔNG đọc được cột mat_khau_bam.
--   5. Nhật ký thao tác: CHỈ trigger ghi; gdos_app chỉ đọc; không ai sửa/xóa.
--   6. Hàm SECURITY DEFINER hẹp cho đăng nhập — lúc đăng nhập chưa biết đơn vị.
--
-- Mỗi câu lệnh một khối breakpoint: PGlite (dùng trong test) chỉ nhận một câu
-- lệnh mỗi lần gọi.
--
-- Triển khai thật: người chạy migration phải có quyền CREATEROLE, hoặc DBA tạo
-- sẵn gdos_app. API đăng nhập bằng một role LOGIN riêng là thành viên gdos_app
-- (GRANT gdos_app TO gdos_api) — không bao giờ bằng chủ bảng.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gdos_app') THEN
    CREATE ROLE gdos_app NOLOGIN;
  END IF;
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO gdos_app;
--> statement-breakpoint

-- ── Ngữ cảnh request ─────────────────────────────────────────────────────────
-- Chưa đặt ngữ cảnh thì trả NULL → mọi policy so với NULL → không thấy dòng nào.
-- Mặc định là KHÔNG THẤY GÌ, không phải thấy hết.
CREATE FUNCTION app_don_vi_ids() RETURNS uuid[]
LANGUAGE sql STABLE AS $$
  SELECT string_to_array(nullif(current_setting('app.don_vi_ids', true), ''), ',')::uuid[]
$$;
--> statement-breakpoint
CREATE FUNCTION app_tai_khoan_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.tai_khoan_id', true), '')::uuid
$$;
--> statement-breakpoint

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Không dùng FORCE: chủ bảng cần vượt RLS cho migration và các hàm SECURITY
-- DEFINER bên dưới. App không bao giờ chạy bằng chủ bảng (xem đầu file).
ALTER TABLE don_vi ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY theo_don_vi ON don_vi USING (id = ANY (app_don_vi_ids()));
--> statement-breakpoint
ALTER TABLE tai_khoan ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY theo_don_vi ON tai_khoan USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
ALTER TABLE phan_cong ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY theo_don_vi ON phan_cong USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
ALTER TABLE phien_dang_nhap ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY cua_chinh_minh ON phien_dang_nhap USING (tai_khoan_id = app_tai_khoan_id());
--> statement-breakpoint
ALTER TABLE nhat_ky_thao_tac ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY theo_don_vi ON nhat_ky_thao_tac FOR SELECT USING (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint

-- ── Quyền của gdos_app ──────────────────────────────────────────────────────
-- Không cấp DELETE ở đâu cả.
GRANT SELECT, INSERT, UPDATE ON don_vi, phan_cong, phien_dang_nhap TO gdos_app;
--> statement-breakpoint
-- tai_khoan: đọc mọi cột TRỪ mat_khau_bam. Một endpoint lỡ `select *` sẽ lỗi
-- ngay thay vì lặng lẽ trả bản băm mật khẩu ra ngoài.
GRANT SELECT (
  id, don_vi_id, ten_dang_nhap, ho_ten, la_quan_tri, native_user_id, trang_thai,
  so_lan_sai, khoa_den, doi_mat_khau_luc, created_at, updated_at, deleted_at
) ON tai_khoan TO gdos_app;
--> statement-breakpoint
GRANT INSERT, UPDATE ON tai_khoan TO gdos_app;
--> statement-breakpoint
GRANT SELECT ON nhat_ky_thao_tac TO gdos_app;
--> statement-breakpoint

-- ── updated_at tự cập nhật — không để code nhớ ─────────────────────────────
CREATE FUNCTION dat_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON don_vi FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON tai_khoan FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON phan_cong FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint

-- ── Nhật ký thao tác ────────────────────────────────────────────────────────
-- Trigger ghi — không phải code: một endpoint quên gọi hàm ghi nhật ký thì
-- thay đổi vẫn được ghi. Bỏ các cột bí mật khỏi bản ghi nhật ký.
CREATE FUNCTION ghi_nhat_ky() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  cu   jsonb := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
  moi  jsonb := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
  dong jsonb := coalesce(moi, cu);
  hanh text  := TG_OP;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- So trên dòng ĐẦY ĐỦ: đổi riêng mật khẩu cũng phải được ghi.
    IF OLD IS NOT DISTINCT FROM NEW THEN
      RETURN NEW;
    END IF;
    IF cu ->> 'deleted_at' IS NULL AND moi ->> 'deleted_at' IS NOT NULL THEN
      hanh := 'XOA_MEM';
    ELSIF (cu ->> 'mat_khau_bam') IS DISTINCT FROM (moi ->> 'mat_khau_bam') THEN
      hanh := 'DOI_MAT_KHAU';
    END IF;
  END IF;

  INSERT INTO nhat_ky_thao_tac (tai_khoan_id, don_vi_id, hanh_dong, bang, ban_ghi_id, gia_tri_cu, gia_tri_moi)
  VALUES (
    app_tai_khoan_id(),
    coalesce(
      (dong ->> 'don_vi_id')::uuid,
      CASE WHEN TG_TABLE_NAME = 'don_vi' THEN (dong ->> 'id')::uuid END
    ),
    hanh,
    TG_TABLE_NAME,
    dong ->> 'id',
    cu - 'mat_khau_bam' - 'token_bam',
    moi - 'mat_khau_bam' - 'token_bam'
  );
  RETURN coalesce(NEW, OLD);
END
$$;
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON don_vi FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON tai_khoan FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON phan_cong FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
--> statement-breakpoint

-- Nhật ký chỉ được thêm, không sửa, không xóa — kể cả chủ bảng. Muốn dọn
-- theo thời hạn lưu trữ thì phải tắt trigger này một cách có chủ đích.
CREATE FUNCTION chan_sua_nhat_ky() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Nhật ký thao tác không được sửa hoặc xóa';
END
$$;
--> statement-breakpoint
CREATE TRIGGER chan_sua_nhat_ky BEFORE UPDATE OR DELETE ON nhat_ky_thao_tac FOR EACH ROW EXECUTE FUNCTION chan_sua_nhat_ky();
--> statement-breakpoint

-- ── Đăng nhập ───────────────────────────────────────────────────────────────
-- Lúc đăng nhập chưa biết đơn vị nên RLS che hết. Hai hàm hẹp dưới đây là lối
-- DUY NHẤT vượt RLS, và chỉ làm đúng một việc.
CREATE FUNCTION dang_nhap_tim(p_ten citext)
RETURNS TABLE (
  id uuid, don_vi_id uuid, mat_khau_bam text, trang_thai text,
  so_lan_sai integer, khoa_den timestamptz, la_quan_tri boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT t.id, t.don_vi_id, t.mat_khau_bam, t.trang_thai, t.so_lan_sai, t.khoa_den, t.la_quan_tri
  FROM tai_khoan t
  WHERE t.ten_dang_nhap = p_ten AND t.deleted_at IS NULL
$$;
--> statement-breakpoint
-- Sai liên tiếp p_so_lan lần thì khóa p_phut phút; đúng thì xóa đếm.
CREATE FUNCTION dang_nhap_ghi(p_id uuid, p_dung boolean, p_so_lan integer DEFAULT 5, p_phut integer DEFAULT 15)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_dung THEN
    UPDATE tai_khoan SET so_lan_sai = 0, khoa_den = NULL
    WHERE id = p_id AND (so_lan_sai <> 0 OR khoa_den IS NOT NULL);
  ELSE
    UPDATE tai_khoan
    SET so_lan_sai = so_lan_sai + 1,
        khoa_den = CASE WHEN so_lan_sai + 1 >= p_so_lan THEN now() + make_interval(mins => p_phut) ELSE khoa_den END
    WHERE id = p_id;
  END IF;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION dang_nhap_tim(citext) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION dang_nhap_ghi(uuid, boolean, integer, integer) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION dang_nhap_tim(citext) TO gdos_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION dang_nhap_ghi(uuid, boolean, integer, integer) TO gdos_app;
