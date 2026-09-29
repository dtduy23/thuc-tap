/**
 * Lược đồ Drizzle. Chưa có bảng nào — bảng đầu tiên thuộc Mốc 1:
 * don_vi (cây), tai_khoan (native_user_id), vai_tro, quyen, nhat_ky_thao_tac.
 *
 * Luật cho MỌI bảng nghiệp vụ (ADR-0004): có organization_id + bật RLS,
 * có deleted_at (xóa mềm), mọi thay đổi ghi nhật ký thao tác.
 */
export {}
