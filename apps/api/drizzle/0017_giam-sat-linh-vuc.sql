CREATE TABLE "giam_sat_linh_vuc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tai_khoan_id" uuid NOT NULL,
	"linh_vuc_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"nguoi_tao" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "du_an" ADD COLUMN "dia_diem" text;--> statement-breakpoint
ALTER TABLE "giam_sat_linh_vuc" ADD CONSTRAINT "giam_sat_linh_vuc_tai_khoan_id_tai_khoan_id_fk" FOREIGN KEY ("tai_khoan_id") REFERENCES "public"."tai_khoan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giam_sat_linh_vuc" ADD CONSTRAINT "giam_sat_linh_vuc_linh_vuc_id_danh_muc_gia_tri_id_fk" FOREIGN KEY ("linh_vuc_id") REFERENCES "public"."danh_muc_gia_tri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giam_sat_linh_vuc" ADD CONSTRAINT "giam_sat_linh_vuc_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "giam_sat_linh_vuc_uq" ON "giam_sat_linh_vuc" USING btree ("tai_khoan_id","linh_vuc_id") WHERE "giam_sat_linh_vuc"."deleted_at" is null;