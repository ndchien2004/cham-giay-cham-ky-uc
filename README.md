# Chạm giấy – Chạm ký ức · Mega Story

Trang longform cuộn dọc về cộng đồng người đọc báo giấy giữa dòng chảy truyền thông số,
dựa trên hai cuộc khảo sát của nhóm nghiên cứu tại Hà Nội năm 2026 (288 người).

Ý tưởng thiết kế: **trang nhất bằng giấy**. Bài mở bằng một trang nhất với xấp ảnh in đặt chéo
và dải số liệu chạy ngang. Bảng màu: be (giấy), xanh lá (màu nhấn) và xanh rêu (nền các chương).

## Công nghệ

- **Vite**: dev server và build tĩnh (`base: "./"`, chạy được ở thư mục con / GitHub Pages)
- **GSAP + ScrollTrigger**: animation theo cuộn, ghim, cuộn ngang
- **Lenis**: cuộn mượt
- **Fontsource** (tự host, có bộ tiếng Việt): Newsreader (văn bản, tiêu đề), Archivo có trục
  độ rộng `wdth` (chữ tít co giãn), JetBrains Mono (nhãn, số liệu)

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # xuất ra dist/
npm run preview  # xem bản build
```

## Cấu trúc

```
index.html        Toàn bộ nội dung bài (sửa chữ trực tiếp ở đây)
src/styles.css    Hệ giao diện: màu/chữ ở :root, token theo tông (.tone-paper / .tone-warm / .tone-moss / .tone-forest)
src/main.js       Cuộn mượt, header, mục lục, video, biểu đồ, toàn bộ animation
public/images/    Ảnh (.webp, 2 cỡ cho srcset)
```

## Các khối tương tác

| Vị trí | Khối | Ghi chú |
|---|---|---|
| Hero | Trang nhất + xấp ảnh in | Tít và ảnh hiện dần; khi cuộn, hai dòng tít trượt ngược chiều, ảnh trôi lệch nhau; dải số liệu chạy ngang |
| Mở đầu | Thẻ khảo sát 288 = 156 + 132 | Số đếm |
| Đầu mỗi chương | Lật trang | Tờ báo của phần trước lùi ra trên mặt bàn, trang phải lật qua gáy giữa (3D, theo cuộn); mặt sau là nửa trái trang mở chương; khối `.turn` |
| Phần 01 | Chồng báo (1 tờ = 10 triệu bản) | Scrollytelling 3 bước: 1,1 tỷ → 250 triệu (−77%) |
| Phần 02 | 156 ô, mỗi ô một người | 3 bước; có bảng số liệu và tooltip |
| Phần 02 | Kéo so sánh Giấy ↔ Màn hình | Dùng được bằng bàn phím (thanh trượt) |
| Phần 03 | Hành trình một tờ báo | Cuộn ngang có ghim |
| Phần 04 | 132 ô người trẻ | 4 bước: từng đọc → tần suất → 7 người |
| Phần 05 | Ba trụ cột | Thẻ có ánh sáng theo con trỏ |
| Kết | Tờ báo gập lại | Theo cuộn |

Số liệu biểu đồ nằm trong `WAFFLE` và `stackStates` ở `src/main.js`; bảng số liệu tương ứng trong `index.html`.
Bảng màu biểu đồ là dải đỏ đơn sắc theo thứ bậc, đã kiểm tra độ tương phản trên nền giấy và nền tối.

## Gắn video

Mỗi khối `<figure class="video-slot" data-video="">`: dán link vào `data-video`.
Khi để trống, khối hiện "Video sẽ sớm được cập nhật".

| Nguồn | Ví dụ |
|---|---|
| YouTube | `https://youtu.be/XXXXXXXXXXX` |
| Google Drive | `https://drive.google.com/file/d/ID/view` (file phải để "Bất kỳ ai có đường liên kết") |
| Vimeo / Facebook | link video công khai |
| File riêng | `./videos/ten-file.mp4` (đặt vào `public/videos/`) |

Video quay dọc: thêm `data-ratio="9 / 16"`. Ảnh bìa: `data-poster="./images/..."`.

Trang có một video duy nhất: phóng sự "Văn hóa đọc báo giấy" (`#phong-su`, Phần 03), phát từ YouTube (chế độ không công khai).

## Khả năng truy cập

- Bật *giảm chuyển động* → tắt mọi animation, cuộn ngang thành vuốt ngang thường, biểu đồ vẫn đổi theo bước.
- JavaScript lỗi → sau 3,5 giây nội dung vẫn hiện.
- Biểu đồ có bảng số liệu; mục lục giữ tiêu điểm bàn phím, đóng bằng Esc.

## Việc còn lại

- Giữ video YouTube ở chế độ "Không công khai" (không để "Riêng tư") và bật "Cho phép nhúng".
- Mọi ảnh đang ghi "Ảnh: Sưu tầm".
