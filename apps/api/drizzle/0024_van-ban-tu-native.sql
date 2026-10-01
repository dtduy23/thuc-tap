ALTER TABLE "van_ban" ALTER COLUMN "khoa_tep" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "van_ban" ALTER COLUMN "loai_tep" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "van_ban" ALTER COLUMN "kich_thuoc" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "van_ban" ADD COLUMN "nguoi_tao_native" text;