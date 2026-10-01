CREATE TABLE "cau_hinh" (
	"khoa" text PRIMARY KEY NOT NULL,
	"gia_tri" jsonb NOT NULL,
	"don_vi_id" uuid,
	"tai_khoan_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cau_hinh" ADD CONSTRAINT "cau_hinh_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;