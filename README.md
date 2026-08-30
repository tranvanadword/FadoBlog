# FadoBlog

## Cập nhật mới: Lịch sử chỉnh sửa bài viết

Đã thêm revision history cho bài viết:

- Mỗi lần lưu bài viết, hệ thống tự lưu phiên bản cũ trước khi cập nhật.
- Trang sửa bài viết hiển thị danh sách các phiên bản gần đây.
- Admin có thể bấm khôi phục để đưa bài viết về phiên bản cũ.
- Snapshot lưu title, slug, excerpt, content, status, ảnh đại diện, category, SEO và tags.
- Hoạt động được cả khi dùng local JSON và khi dùng PostgreSQL/Prisma.

FadoBlog là khung website tin tức kiểu CMS/WordPress, gồm frontend public, khu admin, quản lý nội dung động và workflow tạo bài nháp bằng AI.

## Cấu trúc chính

- `app/`: các trang public, admin và API routes.
- `components/site/`: Header, Footer, PostCard, Sidebar cho frontend.
- `components/admin/`: layout và thành phần nền cho CMS.
- `lib/content.ts`: lớp lấy/lưu nội dung. Nếu chưa có database thì dùng `data/content.json`; khi có `DATABASE_URL` thì dùng Prisma.
- `lib/seo.ts`: helper metadata, canonical URL, sitemap/RSS/robots.
- `prisma/schema.prisma`: mô hình dữ liệu PostgreSQL cho CMS và workflow AI.
- `public/uploads`: nơi lưu ảnh upload từ Media Library.

## Chạy local

```powershell
pnpm dev
```

Sau đó mở:

- Public site: http://localhost:3000
- Admin CMS: http://localhost:3000/admin

## Phân quyền CMS

Vai trò admin local được cấu hình bằng:

```text
ADMIN_ROLE="admin"
```

Các vai trò hiện có:

- `admin`: toàn quyền quản lý.
- `editor`: duyệt/xuất bản bài, quản lý chuyên mục, page và media.
- `author`: viết bài, gửi chờ duyệt, upload media.
- `ai_writer`: chạy AI workflow tạo bài nháp.

Dashboard sẽ hiển thị vai trò hiện tại và các quyền đang bật.

## Bật database PostgreSQL

1. Tạo file `.env` từ `.env.example`.
2. Điền `DATABASE_URL` PostgreSQL thật.
3. Chạy migration và seed:

```powershell
pnpm prisma:migrate
pnpm db:seed
```

Khi chưa có `DATABASE_URL`, website vẫn chạy bằng dữ liệu local trong `data/content.json`.

## Bật AI thật

Trang `/admin/ai-workflows` có thể tạo bài nháp ngay bằng Mock AI local. Để dùng OpenAI API thật, điền:

```text
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5.6"
```

Workflow sẽ gọi Responses API, nhận JSON bài viết, tạo post ở trạng thái nháp hoặc chờ duyệt, rồi chuyển admin sang màn hình sửa bài.

## Cấu hình AI Workflow

Trang `/admin/ai-workflows` hiện có hai chế độ:

- Tạo bài nháp nhanh từ một chủ đề nhập tay.
- Lưu workflow mẫu gồm tên luồng, chủ đề mẫu, chuyên mục đích, kiểu bài, lịch chạy, trạng thái sau khi sinh bài và bật/tắt workflow.

Workflow đã lưu có thể chạy thử ngay để tạo bài nháp. Ở local, cấu hình được lưu trong `data/content.json`; khi bật PostgreSQL, cấu hình sẽ lưu qua bảng `AiWorkflow`.

## Chạy workflow theo lịch

Endpoint chạy lịch:

```text
GET /api/ai/run-scheduled
POST /api/ai/run-scheduled
```

Endpoint này sẽ kiểm tra các workflow đang bật và chỉ chạy workflow đã đến hạn theo `scheduleRule`. Có thể bảo vệ endpoint bằng:

```text
CRON_SECRET="mot-chuoi-bi-mat"
```

Khi đã đặt secret, cron cần gọi một trong các cách:

```text
/api/ai/run-scheduled?secret=mot-chuoi-bi-mat
Authorization: Bearer mot-chuoi-bi-mat
x-cron-secret: mot-chuoi-bi-mat
```

Trong admin cũng có nút `Chạy workflow đến hạn` để test thủ công.

## SEO và feed

Các URL public đã có metadata tự động theo nội dung:

- Bài viết: dùng `seoTitle`, `metaDescription`, excerpt và ảnh đại diện.
- Page tĩnh: dùng trường SEO riêng hoặc nội dung page.
- Chuyên mục: dùng tên và mô tả chuyên mục.

Các endpoint đã có:

- Sitemap: http://localhost:3000/sitemap.xml
- Robots: http://localhost:3000/robots.txt
- RSS: http://localhost:3000/rss.xml

## Site Settings

Trang `/admin/settings` cho phép admin chỉnh:

- Tên site, mô tả site, logo URL và domain public.
- SEO title mặc định và meta description mặc định.
- Email liên hệ và social links.

Các settings này được dùng cho header, footer, trang chủ, metadata mặc định, sitemap, robots và RSS. Khi chưa có PostgreSQL, settings lưu trong `data/content.json`; khi có database sẽ lưu trong bảng `Setting`.

## Dashboard vận hành

Trang `/admin` hiện hiển thị:

- Tổng bài, bài đã đăng, bài chờ duyệt và workflow đang bật.
- Danh sách bài cần xử lý.
- Cảnh báo cấu hình như database chưa nối, OpenAI API chưa bật, domain còn là localhost.
- Phân bố bài viết theo trạng thái.
- AI jobs gần đây và workflow active.
- Vai trò hiện tại và các quyền đang bật.
- Thống kê pages, media và bài thiếu SEO.

## Navigation

Trang `/admin/navigation` cho phép admin chỉnh menu header và footer. Mỗi dòng dùng định dạng:

```text
Tên hiển thị | URL
```

Ví dụ:

```text
Công nghệ | /category/cong-nghe
Giới thiệu | /page/gioi-thieu
RSS | /rss.xml
```

Nếu chưa cấu hình menu riêng, header/footer sẽ tự dùng danh mục, page và RSS mặc định.

## Giao diện quản trị

Khu admin đã được chuyển sang phong cách dashboard công nghệ số:

- Nền xanh đen, card tối, viền mảnh.
- Sidebar nhóm chức năng và icon nét mảnh.
- Topbar có ô tìm kiếm, nút nhanh, thông báo và role.
- Public site vẫn giữ giao diện sáng riêng.

## Tìm kiếm nội bộ

Trang `/admin/search` gom kết quả từ:

- Bài viết.
- Page tĩnh.
- Chuyên mục.
- Media.
- AI Workflow.
- AI Job.

Ô tìm kiếm trên topbar sẽ gửi từ khóa tới trang này. Kết quả được lọc theo quyền hiện tại, nên role không được quản lý khu nào sẽ không thấy dữ liệu khu đó.

## Trình soạn thảo

Form bài viết và page đã có editor hỗ trợ:

- Gợi ý slug từ tiêu đề.
- Gợi ý meta description từ excerpt hoặc nội dung.
- Checklist SEO cơ bản.
- Preview kiểu kết quả tìm kiếm.
- Thống kê số từ, phút đọc và độ dài meta description.

## Giai đoạn hiện tại

Đã hoàn thành nền project, route public, đăng nhập admin, dashboard vận hành, giao diện admin dark tech, tìm kiếm nội bộ, trình soạn thảo có preview/checklist SEO, CRUD bài viết, CRUD chuyên mục, CRUD page tĩnh, quản lý navigation, phân quyền CMS theo role, AI workflow tạo bài nháp nhanh, cấu hình workflow mẫu, endpoint chạy workflow theo lịch, Site Settings, Media Library upload/xóa ảnh, chọn ảnh đại diện từ thư viện, và SEO tự động cho lớp xuất bản.

## Bước tiếp theo

Thêm hệ thống tag cho bài viết: quản lý tags, gán tags trong editor và hiển thị tags ở public.
# Cập nhật mới: Tags

Đã thêm hệ thống tags cho FadoBlog:

- Trang `/admin/tags` để quản lý danh sách tags.
- Trang tạo/sửa tag với tên và slug.
- Form bài viết có ô nhập tags, phân tách bằng dấu phẩy.
- Editor hiển thị gợi ý tags có sẵn.
- Trang public `/tag/[slug]` để đọc bài theo tag.
- Sidebar public hiển thị tags phổ biến.
- Trang chi tiết bài viết cho phép bấm vào từng tag.
- Sitemap tự động đưa thêm URL tag.
- Tìm kiếm quản trị đã tìm được cả tags và tags gắn trong bài viết.

## Bước tiếp theo đề xuất

Thêm lịch sử chỉnh sửa bài viết, để admin có thể xem các phiên bản cũ và khôi phục nội dung khi cần.

## Cập nhật mới: Visual Editor

Đã thêm bộ editor trực quan cho bài viết và page:

- Toolbar định dạng gồm đoạn văn, heading, quote, bold, italic, gạch ngang, danh sách, danh sách số, đường phân cách và link.
- Có chế độ soạn trực quan và chế độ xem/sửa HTML.
- Nội dung vẫn lưu vào trường `content`, nên luồng backend hiện tại tiếp tục dùng được.
- Public site render được HTML an toàn cho bài viết và page.
- Bộ đếm từ/phút đọc và gợi ý meta description đã bỏ qua HTML tag để tính đúng nội dung thật.

## Bước tiếp theo đề xuất

Thêm lịch sử chỉnh sửa bài viết, để admin có thể xem các phiên bản cũ và khôi phục nội dung khi cần.
## Cập nhật mới: Backup / Export

Đã thêm hệ thống backup dữ liệu CMS:

- Trang admin `/admin/backups` hiển thị nguồn dữ liệu và số lượng từng nhóm dữ liệu.
- API `/api/admin/backup` tải file JSON backup.
- API backup chỉ cho Admin truy cập.
- File backup gồm posts, pages, categories, tags, media metadata, settings, AI workflows/jobs, revisions, contact messages và page views.
- Hoạt động với cả local JSON và PostgreSQL/Prisma.

## Cập nhật mới: Production Readiness

Đã thêm các phần chuẩn bị deploy:

- `prisma.config.ts` thay cho cấu hình Prisma cũ trong `package.json`.
- Script `db:deploy`, `db:studio` và `prod:check`.
- Migration cho `ContactMessage` và `PageView`.
- Seed dữ liệu PostgreSQL sạch hơn cho admin, categories, tags, pages và bài mẫu.
- API `/api/health` để kiểm tra trạng thái app/database/env.
- Tài liệu checklist production tại `PRODUCTION.md`.

## Cập nhật mới: Analytics nội bộ

Đã thêm analytics cơ bản cho nội dung:

- Trang bài viết public tự ghi nhận lượt xem qua `/api/analytics/page-view`.
- Mỗi bài chỉ ghi một lượt xem trong cùng phiên trình duyệt để giảm spam số liệu.
- Admin có màn hình `/admin/analytics`.
- Dashboard analytics hiển thị tổng lượt xem, lượt xem bài viết, hôm nay và 7 ngày gần đây.
- Có top bài viết theo lượt đọc, nguồn truy cập cơ bản và lượt xem gần đây.
- Dữ liệu chạy được bằng local JSON hoặc PostgreSQL/Prisma.

## Cập nhật mới: Contact Form

Đã thêm form liên hệ và hộp thư admin:

- Trang `/page/lien-he` hiển thị form gửi liên hệ.
- API `/api/contact` nhận và kiểm tra dữ liệu liên hệ.
- Tin nhắn lưu được bằng local JSON hoặc PostgreSQL/Prisma.
- Admin có màn hình `/admin/messages` để xem tin mới.
- Có thao tác đánh dấu đã đọc và lưu trữ tin nhắn.
- Sidebar admin có mục `Liên hệ` trong nhóm hệ thống.

## Cập nhật mới: Duyệt bài

Đã thêm màn hình `/admin/reviews` cho luồng duyệt nội dung:

- Chỉ Admin/Editor được vào màn hình duyệt bài.
- Hiển thị các bài ở trạng thái `pending_review`.
- Có thống kê nhanh số bài chờ duyệt, nháp, bài đủ điều kiện xuất bản và tổng bài.
- Có nút xuất bản bài viết.
- Có nút trả bài về nháp để author/editor chỉnh tiếp.
- Khi đổi trạng thái, hệ thống tự revalidate trang public, category, RSS và sitemap.
## Cập nhật mới: Audit Log nhẹ

Đã thêm nhật ký quản trị theo hướng nhẹ dữ liệu:

- Trang `/admin/audit-logs` cho Admin xem 200 log gần nhất.
- Local JSON chỉ giữ tối đa 500 log gần nhất.
- Không ghi analytics, autosave hay request public thông thường.
- Không lưu full nội dung bài viết trong audit log.
- Đã ghi log cho login, tạo/sửa/xóa/restore bài viết, duyệt/trả nháp bài viết, export/import backup.
- Backup JSON có kèm audit logs để giữ lịch sử vận hành khi cần.

## Cập nhật mới: API Security / Rate Limit

Đã thêm lớp bảo vệ cơ bản cho API public:

- Contact API giới hạn 5 lần gửi / 10 phút theo IP và 3 lần / 30 phút theo email.
- Contact form có honeypot ẩn để giảm bot spam.
- Contact API chặn request không phải JSON và nội dung có script/iframe/javascript.
- Analytics API giới hạn 60 event / phút theo IP.
- Analytics API chỉ nhận đường dẫn `/post/...`.
- Endpoint `/api/ai/run-scheduled` bắt buộc có `CRON_SECRET`.
- Cron endpoint chỉ nhận secret qua `Authorization: Bearer ...` hoặc `x-cron-secret`, không nhận secret trên URL.

## Cập nhật mới: Restore / Import Backup

Đã thêm chức năng khôi phục dữ liệu từ backup:

- Trang `/admin/backups` có thêm form upload file JSON.
- Admin có thể import lại file backup đã xuất từ FadoBlog.
- Khi chạy local JSON, hệ thống ghi đè dữ liệu hiện tại bằng dữ liệu trong backup.
- Khi dùng PostgreSQL, import trực tiếp từ giao diện được khóa để tránh ghi đè nhầm database production.
- File import được kiểm tra định dạng FadoBlog và dữ liệu tối thiểu trước khi ghi.
- Sau khi restore, hệ thống tự làm mới các trang admin, public, RSS và sitemap.
