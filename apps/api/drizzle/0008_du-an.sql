CREATE TABLE "danh_muc_gia_tri" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loai" text NOT NULL,
	"ma" text NOT NULL,
	"ten" text NOT NULL,
	"mau" text,
	"thu_tu" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "danh_muc_gia_tri_loai_ck" CHECK ("danh_muc_gia_tri"."loai" in ('linh-vuc', 'nguon-von', 'loai-van-ban'))
);
--> statement-breakpoint
CREATE TABLE "du_an" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"ma" text NOT NULL,
	"ten" text NOT NULL,
	"trang_thai" text DEFAULT 'dang-thuc-hien' NOT NULL,
	"quy_trinh_ma" text,
	"hinh_thuc" text NOT NULL,
	"loai_chi" text NOT NULL,
	"nhom_du_an" text,
	"linh_vuc_id" uuid,
	"can_cu" text,
	"tong_muc" numeric(15, 0) DEFAULT 0 NOT NULL,
	"ngay_bat_dau" date NOT NULL,
	"tien_do_mo_ta" text,
	"cap_nhat_ngay" date,
	"can_bo_id" uuid,
	"ke_hoach_chot" jsonb,
	"don_doc_ngay" date,
	"nguoi_tao" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "du_an_trang_thai_ck" CHECK ("du_an"."trang_thai" in ('dang-thuc-hien', 'hoan-thanh', 'tam-dung', 'huy')),
	CONSTRAINT "du_an_loai_chi_ck" CHECK ("du_an"."loai_chi" in ('dtpt', 'ctx')),
	CONSTRAINT "du_an_nhom_ck" CHECK ("du_an"."nhom_du_an" is null or "du_an"."nhom_du_an" in ('A', 'B', 'C')),
	CONSTRAINT "du_an_hinh_thuc_ck" CHECK ("du_an"."hinh_thuc" in ('dau-tu', 'thue', 'mua-sam', 'chi-thuong-xuyen', 'khac'))
);
--> statement-breakpoint
CREATE TABLE "du_an_buoc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"thu_tu" integer NOT NULL,
	"cha_id" uuid,
	"giai_doan" text NOT NULL,
	"stt" text NOT NULL,
	"la_nhom" boolean DEFAULT false NOT NULL,
	"bat_buoc" boolean DEFAULT true NOT NULL,
	"ten" text NOT NULL,
	"so_ngay" integer DEFAULT 0 NOT NULL,
	"han_ghi_de" date,
	"han" date,
	"ngay_hoan_thanh" date,
	"so_van_ban" text,
	"don_vi_thuc_hien" text,
	"ben_thuc_hien" text DEFAULT 'chu-dau-tu' NOT NULL,
	"ghi_chu" text,
	"bo_qua" boolean DEFAULT false NOT NULL,
	"ly_do_bo_qua" text,
	"cho_xac_nhan" jsonb,
	"san_pham" text,
	"an_tong_quan" boolean DEFAULT false NOT NULL,
	"la_nhap" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "du_an_buoc_giai_doan_ck" CHECK ("du_an_buoc"."giai_doan" in ('I', 'II', 'III')),
	CONSTRAINT "du_an_buoc_ben_ck" CHECK ("du_an_buoc"."ben_thuc_hien" in ('chu-dau-tu', 'tu-van', 'nha-thau'))
);
--> statement-breakpoint
CREATE TABLE "du_an_thanh_vien" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"tai_khoan_id" uuid NOT NULL,
	"vai_tro" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "du_an_thanh_vien_vai_ck" CHECK ("du_an_thanh_vien"."vai_tro" in ('phu-trach', 'nha-thau', 'tu-van', 'giam-sat'))
);
--> statement-breakpoint
CREATE TABLE "quy_trinh_mau" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ma" text NOT NULL,
	"ten" text NOT NULL,
	"can_cu" text,
	"hinh_thuc" text NOT NULL,
	"buoc" jsonb NOT NULL,
	"khoa" boolean DEFAULT false NOT NULL,
	"thu_tu" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "quy_trinh_mau_hinh_thuc_ck" CHECK ("quy_trinh_mau"."hinh_thuc" in ('dau-tu', 'thue', 'mua-sam', 'chi-thuong-xuyen', 'khac'))
);
--> statement-breakpoint
ALTER TABLE "don_vi" DROP CONSTRAINT "don_vi_cap_ck";--> statement-breakpoint
ALTER TABLE "du_an" ADD CONSTRAINT "du_an_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an" ADD CONSTRAINT "du_an_linh_vuc_id_danh_muc_gia_tri_id_fk" FOREIGN KEY ("linh_vuc_id") REFERENCES "public"."danh_muc_gia_tri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an" ADD CONSTRAINT "du_an_can_bo_id_tai_khoan_id_fk" FOREIGN KEY ("can_bo_id") REFERENCES "public"."tai_khoan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_buoc" ADD CONSTRAINT "du_an_buoc_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_buoc" ADD CONSTRAINT "du_an_buoc_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_buoc" ADD CONSTRAINT "du_an_buoc_cha_id_du_an_buoc_id_fk" FOREIGN KEY ("cha_id") REFERENCES "public"."du_an_buoc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_thanh_vien" ADD CONSTRAINT "du_an_thanh_vien_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_thanh_vien" ADD CONSTRAINT "du_an_thanh_vien_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_thanh_vien" ADD CONSTRAINT "du_an_thanh_vien_tai_khoan_id_tai_khoan_id_fk" FOREIGN KEY ("tai_khoan_id") REFERENCES "public"."tai_khoan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "danh_muc_gia_tri_loai_ma_uq" ON "danh_muc_gia_tri" USING btree ("loai","ma");--> statement-breakpoint
CREATE UNIQUE INDEX "du_an_ma_uq" ON "du_an" USING btree ("ma");--> statement-breakpoint
CREATE INDEX "du_an_don_vi_idx" ON "du_an" USING btree ("don_vi_id");--> statement-breakpoint
CREATE INDEX "du_an_buoc_du_an_idx" ON "du_an_buoc" USING btree ("du_an_id","thu_tu");--> statement-breakpoint
CREATE INDEX "du_an_buoc_han_idx" ON "du_an_buoc" USING btree ("don_vi_id","han");--> statement-breakpoint
CREATE INDEX "du_an_thanh_vien_tai_khoan_idx" ON "du_an_thanh_vien" USING btree ("tai_khoan_id");--> statement-breakpoint
CREATE INDEX "du_an_thanh_vien_du_an_idx" ON "du_an_thanh_vien" USING btree ("du_an_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quy_trinh_mau_ma_uq" ON "quy_trinh_mau" USING btree ("ma");--> statement-breakpoint
ALTER TABLE "don_vi" ADD CONSTRAINT "don_vi_cap_ck" CHECK ("don_vi"."cap" in ('tinh', 'so-nganh', 'co-quan-dang', 'xa', 'doanh-nghiep'));