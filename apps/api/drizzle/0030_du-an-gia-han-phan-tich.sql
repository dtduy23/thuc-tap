CREATE TABLE "du_an_gia_han" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"buoc_id" uuid NOT NULL,
	"han_cu" date,
	"han_moi" date NOT NULL,
	"ly_do" text NOT NULL,
	"can_cu" text,
	"trang_thai" text DEFAULT 'cho-duyet' NOT NULL,
	"nguoi_xin" uuid NOT NULL,
	"ngay_xin" date NOT NULL,
	"cac_cap" jsonb NOT NULL,
	"cap_hien_tai" integer DEFAULT 1 NOT NULL,
	"da_qua" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "du_an_gia_han_trang_thai_ck" CHECK ("du_an_gia_han"."trang_thai" in ('cho-duyet', 'da-duyet', 'tu-choi', 'da-rut'))
);
--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD COLUMN "nhom_nguyen_nhan" text;--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD COLUMN "nguyen_nhan" text;--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD COLUMN "giai_phap" text;--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD COLUMN "don_vi_xu_ly" text;--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD COLUMN "han_xu_ly" date;--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD COLUMN "muc_do" text DEFAULT 'trung-binh' NOT NULL;--> statement-breakpoint
ALTER TABLE "du_an_gia_han" ADD CONSTRAINT "du_an_gia_han_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_gia_han" ADD CONSTRAINT "du_an_gia_han_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_gia_han" ADD CONSTRAINT "du_an_gia_han_buoc_id_du_an_buoc_id_fk" FOREIGN KEY ("buoc_id") REFERENCES "public"."du_an_buoc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "du_an_gia_han_du_an_idx" ON "du_an_gia_han" USING btree ("du_an_id","created_at");--> statement-breakpoint
ALTER TABLE "du_an_vuong_mac" ADD CONSTRAINT "du_an_vuong_mac_muc_do_ck" CHECK ("du_an_vuong_mac"."muc_do" in ('thap', 'trung-binh', 'cao'));