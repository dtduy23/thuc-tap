CREATE TABLE "benh_vien_thu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"loai" text NOT NULL,
	"ma" text NOT NULL,
	"gia_tri" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "benh_vien_thu_loai_ck" CHECK ("benh_vien_thu"."loai" in ('phim', 'goi-y', 'nguon-phim', 'nghien-cuu', 'ket-noi', 'bhyt', 'lao', 'nhac-lao', 'gui-lao'))
);
--> statement-breakpoint
ALTER TABLE "benh_vien_thu" ADD CONSTRAINT "benh_vien_thu_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "benh_vien_thu_ma_uq" ON "benh_vien_thu" USING btree ("don_vi_id","loai","ma");
--> statement-breakpoint
ALTER TABLE benh_vien_thu ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY theo_don_vi ON benh_vien_thu USING (don_vi_id = ANY (app_don_vi_ids()))
  WITH CHECK (don_vi_id = ANY (app_don_vi_ids()));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON benh_vien_thu TO gdos_app;
--> statement-breakpoint
CREATE TRIGGER dat_updated_at BEFORE UPDATE ON benh_vien_thu FOR EACH ROW EXECUTE FUNCTION dat_updated_at();
--> statement-breakpoint
CREATE TRIGGER ghi_nhat_ky AFTER INSERT OR UPDATE OR DELETE ON benh_vien_thu FOR EACH ROW EXECUTE FUNCTION ghi_nhat_ky();
