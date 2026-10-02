CREATE TABLE "chi_tieu_lan_nap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"kenh" text NOT NULL,
	"nguon_id" uuid,
	"ten_nguon" text NOT NULL,
	"trang_thai" text NOT NULL,
	"so_dong" integer DEFAULT 0 NOT NULL,
	"so_loi" integer DEFAULT 0 NOT NULL,
	"loi" jsonb NOT NULL,
	"nguoi_nap" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "chi_tieu_lan_nap_kenh_ck" CHECK ("chi_tieu_lan_nap"."kenh" in ('api', 'excel')),
	CONSTRAINT "chi_tieu_lan_nap_trang_thai_ck" CHECK ("chi_tieu_lan_nap"."trang_thai" in ('xong', 'loi'))
);
--> statement-breakpoint
CREATE TABLE "chi_tieu_so_lieu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"ma_chi_tieu" text NOT NULL,
	"ky" text NOT NULL,
	"gia_tri" double precision NOT NULL,
	"kenh" text NOT NULL,
	"ten_nguon" text NOT NULL,
	"lan_nap_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "chi_tieu_so_lieu_kenh_ck" CHECK ("chi_tieu_so_lieu"."kenh" in ('api', 'excel')),
	CONSTRAINT "chi_tieu_so_lieu_ky_ck" CHECK ("chi_tieu_so_lieu"."ky" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
CREATE TABLE "nguon_du_lieu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"ten" text NOT NULL,
	"dia_chi" text NOT NULL,
	"xac_thuc" text DEFAULT 'khong' NOT NULL,
	"ten_header" text,
	"anh_xa" jsonb NOT NULL,
	"bat" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "nguon_du_lieu_xac_thuc_ck" CHECK ("nguon_du_lieu"."xac_thuc" in ('khong', 'bearer', 'header'))
);
--> statement-breakpoint
CREATE TABLE "nguon_du_lieu_bi_mat" (
	"nguon_id" uuid PRIMARY KEY NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"ma_hoa" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chi_tieu_lan_nap" ADD CONSTRAINT "chi_tieu_lan_nap_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chi_tieu_lan_nap" ADD CONSTRAINT "chi_tieu_lan_nap_nguon_id_nguon_du_lieu_id_fk" FOREIGN KEY ("nguon_id") REFERENCES "public"."nguon_du_lieu"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chi_tieu_so_lieu" ADD CONSTRAINT "chi_tieu_so_lieu_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chi_tieu_so_lieu" ADD CONSTRAINT "chi_tieu_so_lieu_lan_nap_id_chi_tieu_lan_nap_id_fk" FOREIGN KEY ("lan_nap_id") REFERENCES "public"."chi_tieu_lan_nap"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nguon_du_lieu" ADD CONSTRAINT "nguon_du_lieu_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nguon_du_lieu_bi_mat" ADD CONSTRAINT "nguon_du_lieu_bi_mat_nguon_id_nguon_du_lieu_id_fk" FOREIGN KEY ("nguon_id") REFERENCES "public"."nguon_du_lieu"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nguon_du_lieu_bi_mat" ADD CONSTRAINT "nguon_du_lieu_bi_mat_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chi_tieu_lan_nap_don_vi_idx" ON "chi_tieu_lan_nap" USING btree ("don_vi_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "chi_tieu_so_lieu_uq" ON "chi_tieu_so_lieu" USING btree ("don_vi_id","ma_chi_tieu","ky");--> statement-breakpoint
CREATE INDEX "nguon_du_lieu_don_vi_idx" ON "nguon_du_lieu" USING btree ("don_vi_id");