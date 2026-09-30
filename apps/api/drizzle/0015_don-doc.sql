CREATE TABLE "du_an_don_doc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"du_an_id" uuid NOT NULL,
	"don_vi_id" uuid NOT NULL,
	"ngay" date NOT NULL,
	"noi_dung" text NOT NULL,
	"dot" uuid NOT NULL,
	"nguoi_gui" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "du_an_don_doc" ADD CONSTRAINT "du_an_don_doc_du_an_id_du_an_id_fk" FOREIGN KEY ("du_an_id") REFERENCES "public"."du_an"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "du_an_don_doc" ADD CONSTRAINT "du_an_don_doc_don_vi_id_don_vi_id_fk" FOREIGN KEY ("don_vi_id") REFERENCES "public"."don_vi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "du_an_don_doc_du_an_idx" ON "du_an_don_doc" USING btree ("du_an_id","ngay");