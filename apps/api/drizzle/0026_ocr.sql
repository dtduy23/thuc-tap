CREATE TABLE "ocr_chung_tu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"native_id" text NOT NULL,
	"ma_loai" text NOT NULL,
	"ten_loai" text NOT NULL,
	"ten_tep" text NOT NULL,
	"loai_tep" text,
	"trang_thai" text NOT NULL,
	"do_tin_cay" double precision,
	"du_lieu" jsonb NOT NULL,
	"bang" jsonb NOT NULL,
	"native_tao_luc" timestamp with time zone,
	"native_cap_nhat_luc" timestamp with time zone,
	"lay_ve_luc" timestamp with time zone DEFAULT now() NOT NULL,
	"lay_boi" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "ocr_chung_tu_trang_thai_ck" CHECK ("ocr_chung_tu"."trang_thai" in ('da-xu-ly', 'da-xac-nhan'))
);
--> statement-breakpoint
CREATE TABLE "ocr_loai" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"ma" text NOT NULL,
	"ten" text NOT NULL,
	"mo_ta" text,
	"native_id" text NOT NULL,
	"hoat_dong" boolean DEFAULT true NOT NULL,
	"dinh_nghia" jsonb NOT NULL,
	"bat" boolean DEFAULT false NOT NULL,
	"dong_bo_luc" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ocr_chung_tu" ADD CONSTRAINT "ocr_chung_tu_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_loai" ADD CONSTRAINT "ocr_loai_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ocr_chung_tu_native_uq" ON "ocr_chung_tu" USING btree ("don_vi_id","native_id");--> statement-breakpoint
CREATE INDEX "ocr_chung_tu_loai_idx" ON "ocr_chung_tu" USING btree ("don_vi_id","ma_loai","native_cap_nhat_luc");--> statement-breakpoint
CREATE UNIQUE INDEX "ocr_loai_ma_uq" ON "ocr_loai" USING btree ("don_vi_id","ma");