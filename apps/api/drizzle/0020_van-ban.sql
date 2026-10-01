CREATE TABLE "van_ban" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"ten" text NOT NULL,
	"loai" text NOT NULL,
	"nguon" text DEFAULT 'tai-len' NOT NULL,
	"ten_tep" text NOT NULL,
	"khoa_tep" text NOT NULL,
	"loai_tep" text NOT NULL,
	"kich_thuoc" integer NOT NULL,
	"native_id" text,
	"trang_thai" text DEFAULT 'chua-gui' NOT NULL,
	"noi_dung_goc" text,
	"tom_tat" text,
	"so_ky_tu_goc" integer,
	"so_ky_tu_tom_tat" integer,
	"mo_hinh" text,
	"loi" text,
	"da_hieu_chinh" boolean DEFAULT false NOT NULL,
	"nguoi_tao" uuid,
	"dong_bo_luc" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "van_ban_trang_thai_ck" CHECK ("van_ban"."trang_thai" in ('chua-gui', 'cho', 'dang-xu-ly', 'xong', 'loi')),
	CONSTRAINT "van_ban_nguon_ck" CHECK ("van_ban"."nguon" in ('tai-len', 'qlvb', 'cong-dvc', 'email', 'khac'))
);
--> statement-breakpoint
ALTER TABLE "van_ban" ADD CONSTRAINT "van_ban_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "van_ban_don_vi_idx" ON "van_ban" USING btree ("don_vi_id","created_at");