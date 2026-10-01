CREATE TABLE "du_an_giai_ngan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"nam" integer NOT NULL,
	"nguon_von_id" uuid NOT NULL,
	"ngay" date NOT NULL,
	"so_tien" numeric(15, 0) NOT NULL,
	"dot" text,
	"so_ky_hieu" text,
	"ghi_chu" text,
	"nguoi_tao" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "du_an_van_ban" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"buoc_id" uuid,
	"giai_ngan_id" uuid,
	"ten_tep" text NOT NULL,
	"khoa_tep" text NOT NULL,
	"loai_tep" text NOT NULL,
	"kich_thuoc" integer NOT NULL,
	"tieu_de" text,
	"so_ky_hieu" text,
	"ngay_ky" date,
	"nguoi_ky" text,
	"to_so" text,
	"ghi_chu" text,
	"nguoi_tai" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "du_an_von" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"nam" integer NOT NULL,
	"nguon_von_id" uuid NOT NULL,
	"ke_hoach" numeric(15, 0) DEFAULT 0 NOT NULL,
	"ghi_chu" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "du_an_vuong_mac" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"buoc_id" uuid,
	"noi_dung" text NOT NULL,
	"ngay_neu" date NOT NULL,
	"ngay_giai_quyet" date,
	"ket_qua" text,
	"nguoi_neu" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "du_an_giai_ngan" ADD CONSTRAINT "du_an_giai_ngan_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_giai_ngan" ADD CONSTRAINT "du_an_giai_ngan_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_giai_ngan" ADD CONSTRAINT "du_an_giai_ngan_nguon_von_id_danh_muc_gia_tri_id_fk" FOREIGN KEY ("nguon_von_id") REFERENCES "public"."danh_muc_gia_tri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_van_ban" ADD CONSTRAINT "du_an_van_ban_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_van_ban" ADD CONSTRAINT "du_an_van_ban_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_van_ban" ADD CONSTRAINT "du_an_van_ban_buoc_id_du_an_buoc_id_fk" FOREIGN KEY ("buoc_id") REFERENCES "public"."du_an_buoc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_von" ADD CONSTRAINT "du_an_von_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_von" ADD CONSTRAINT "du_an_von_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_von" ADD CONSTRAINT "du_an_von_nguon_von_id_danh_muc_gia_tri_id_fk" FOREIGN KEY ("nguon_von_id") REFERENCES "public"."danh_muc_gia_tri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD CONSTRAINT "du_an_vuong_mac_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD CONSTRAINT "du_an_vuong_mac_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD CONSTRAINT "du_an_vuong_mac_buoc_id_du_an_buoc_id_fk" FOREIGN KEY ("buoc_id") REFERENCES "public"."du_an_buoc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "du_an_giai_ngan_du_an_idx" ON "du_an_giai_ngan" USING btree ("du_an_id","ngay");--> statement-breakpoint
CREATE INDEX "du_an_van_ban_du_an_idx" ON "du_an_van_ban" USING btree ("du_an_id");--> statement-breakpoint
CREATE INDEX "du_an_von_du_an_idx" ON "du_an_von" USING btree ("du_an_id","nam");--> statement-breakpoint
CREATE INDEX "du_an_vuong_mac_du_an_idx" ON "du_an_vuong_mac" USING btree ("du_an_id");