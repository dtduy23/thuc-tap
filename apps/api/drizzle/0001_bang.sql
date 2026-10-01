CREATE TABLE "don_vi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ma" text NOT NULL,
	"ten" text NOT NULL,
	"cap" text NOT NULL,
	"cha_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "don_vi_cap_ck" CHECK ("don_vi"."cap" in ('tinh', 'xa'))
);
--> statement-breakpoint
CREATE TABLE "nhat_ky_thao_tac" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"luc" timestamp with time zone DEFAULT now() NOT NULL,
	"tai_khoan_id" uuid,
	"don_vi_id" uuid,
	"hanh_dong" text NOT NULL,
	"bang" text NOT NULL,
	"ban_ghi_id" text,
	"gia_tri_cu" jsonb,
	"gia_tri_moi" jsonb
);
--> statement-breakpoint
CREATE TABLE "phan_cong" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tai_khoan_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"vai" text NOT NULL,
	"pham_vi" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "phan_cong_vai_ck" CHECK ("phan_cong"."vai" in ('LANH_DAO', 'CHUYEN_VIEN', 'THANH_TRA'))
);
--> statement-breakpoint
CREATE TABLE "phien_dang_nhap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tai_khoan_id" uuid NOT NULL,
	"token_bam" text NOT NULL,
	"het_han" timestamp with time zone NOT NULL,
	"thu_hoi_luc" timestamp with time zone,
	"dia_chi_ip" text,
	"trinh_duyet" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tai_khoan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"ten_dang_nhap" "citext" NOT NULL,
	"ho_ten" text NOT NULL,
	"mat_khau_bam" text NOT NULL,
	"la_quan_tri" boolean DEFAULT false NOT NULL,
	"native_user_id" text,
	"trang_thai" text DEFAULT 'hoat-dong' NOT NULL,
	"so_lan_sai" integer DEFAULT 0 NOT NULL,
	"khoa_den" timestamp with time zone,
	"doi_mat_khau_luc" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tai_khoan_trang_thai_ck" CHECK ("tai_khoan"."trang_thai" in ('hoat-dong', 'khoa'))
);
--> statement-breakpoint
ALTER TABLE "don_vi" ADD CONSTRAINT "don_vi_cha_id_don_vi_id_fk" FOREIGN KEY ("cha_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phan_cong" ADD CONSTRAINT "phan_cong_tai_khoan_id_tai_khoan_id_fk" FOREIGN KEY ("tai_khoan_id") REFERENCES "public"."tai_khoan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phan_cong" ADD CONSTRAINT "phan_cong_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phien_dang_nhap" ADD CONSTRAINT "phien_dang_nhap_tai_khoan_id_tai_khoan_id_fk" FOREIGN KEY ("tai_khoan_id") REFERENCES "public"."tai_khoan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tai_khoan" ADD CONSTRAINT "tai_khoan_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "don_vi_ma_uq" ON "don_vi" USING btree ("ma");--> statement-breakpoint
CREATE INDEX "nhat_ky_don_vi_luc_idx" ON "nhat_ky_thao_tac" USING btree ("don_vi_id","luc");--> statement-breakpoint
CREATE INDEX "nhat_ky_ban_ghi_idx" ON "nhat_ky_thao_tac" USING btree ("bang","ban_ghi_id");--> statement-breakpoint
CREATE INDEX "phan_cong_tai_khoan_idx" ON "phan_cong" USING btree ("tai_khoan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phien_token_bam_uq" ON "phien_dang_nhap" USING btree ("token_bam");--> statement-breakpoint
CREATE INDEX "phien_tai_khoan_idx" ON "phien_dang_nhap" USING btree ("tai_khoan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tai_khoan_ten_dang_nhap_uq" ON "tai_khoan" USING btree ("ten_dang_nhap");--> statement-breakpoint
CREATE INDEX "tai_khoan_don_vi_idx" ON "tai_khoan" USING btree ("don_vi_id");