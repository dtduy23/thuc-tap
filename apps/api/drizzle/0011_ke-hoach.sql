CREATE TABLE "du_an_phien_ban" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"so" integer NOT NULL,
	"ngay" date NOT NULL,
	"ly_do" text NOT NULL,
	"can_cu" text,
	"so_ngay_lui" integer DEFAULT 0 NOT NULL,
	"ngay_ket_thuc" date,
	"anh_chup" jsonb NOT NULL,
	"nguoi_chot" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "du_an_buoc" ALTER COLUMN "thu_tu" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "du_an_phien_ban" ADD CONSTRAINT "du_an_phien_ban_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_phien_ban" ADD CONSTRAINT "du_an_phien_ban_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "du_an_phien_ban_so_uq" ON "du_an_phien_ban" USING btree ("du_an_id","so");--> statement-breakpoint
ALTER TABLE "du_an" DROP COLUMN "ke_hoach_chot";