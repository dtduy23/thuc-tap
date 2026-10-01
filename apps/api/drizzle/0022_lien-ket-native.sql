CREATE TABLE "lien_ket_native" (
	"tai_khoan_id" uuid PRIMARY KEY NOT NULL,
	"native_user_id" text NOT NULL,
	"native_ten" text NOT NULL,
	"refresh_ma_hoa" text NOT NULL,
	"lien_ket_luc" timestamp with time zone DEFAULT now() NOT NULL,
	"lam_moi_luc" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lien_ket_native" ADD CONSTRAINT "lien_ket_native_tai_khoan_id_tai_khoan_id_fk" FOREIGN KEY ("tai_khoan_id") REFERENCES "public"."tai_khoan"("id") ON DELETE no action ON UPDATE no action;