# LearnJoy Ngrok Manager

Hướng dẫn sử dụng script tự động chạy Docker Compose + Ngrok với auto-restart mỗi 12 tiếng.

## 📋 Yêu cầu

### Windows
1. **Docker Desktop** - Đã cài đặt và đang chạy
2. **Ngrok** - [Download](https://ngrok.com/download) và đăng nhập
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### macOS (Apple Silicon M1/M2/M3)
1. **Homebrew** - Package manager
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Docker Desktop for Mac (Apple Silicon)**
   - Download từ: https://www.docker.com/products/docker-desktop
   - Chọn phiên bản **Apple Silicon**

3. **Ngrok**
   ```bash
   brew install ngrok/ngrok/ngrok
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **jq** (JSON processor)
   ```bash
   brew install jq
   ```

## 🚀 Cách sử dụng

### Windows

**Cách 1: Double-click**
```
Double-click vào file: ngrok-tools/start-learnjoy.bat
```

**Cách 2: PowerShell**
```powershell
cd learnjoy/ngrok-tools
powershell -ExecutionPolicy Bypass -File ngrok-manager.ps1
```

**Với tùy chọn:**
```powershell
# Port khác
powershell -ExecutionPolicy Bypass -File ngrok-manager.ps1 -NgrokPort 8080

# Thay đổi thời gian restart (6 tiếng thay vì 12)
powershell -ExecutionPolicy Bypass -File ngrok-manager.ps1 -RestartIntervalHours 6
```

---

### macOS (Apple Silicon M1/M2/M3) ⭐

**Cách 1: Double-click**
```
Double-click vào file: ngrok-tools/start-learnjoy-mac.command
```
> Nếu bị chặn, vào System Preferences → Security & Privacy → Allow

**Cách 2: Terminal**
```bash
cd learnjoy/ngrok-tools
chmod +x ngrok-manager-mac.sh start-learnjoy-mac.command
./ngrok-manager-mac.sh
```

**Với tùy chọn:**
```bash
# ./ngrok-manager-mac.sh [port] [region] [restart_hours]
./ngrok-manager-mac.sh 3000 ap 12

# Ví dụ: restart mỗi 6 tiếng
./ngrok-manager-mac.sh 3000 ap 6
```

**Xem URL hiện tại (copy vào clipboard):**
```bash
./get-current-url-mac.sh
```

---

### Linux

```bash
cd learnjoy/ngrok-tools
chmod +x ngrok-manager.sh
./ngrok-manager.sh
```

**Với tùy chọn:**
```bash
# ./ngrok-manager.sh [port] [region] [restart_hours]
./ngrok-manager.sh 3000 ap 12
```

## 📁 Files được tạo

Sau khi chạy, các file sau sẽ được tạo trong thư mục `ngrok-tools/`:

| File | Mô tả |
|------|-------|
| `current-ngrok-url.txt` | URL ngrok hiện tại |
| `ngrok-url-history.json` | Lịch sử các URL đã dùng |
| `redirect.html` | Trang redirect (có thể host ở đâu đó) |
| `ngrok-manager.log` | Log file |

## 🔄 Cách hoạt động

### Kiến trúc với Nginx Reverse Proxy

```
                                    ┌─────────────────────────────────┐
                                    │         Docker Network          │
                                    │                                 │
User → Ngrok URL → Port 8080 → Nginx ─┬→ /        → Frontend (3000)   │
                                      │                               │
                                      └→ /api/*   → Backend (3001)    │
                                    │                                 │
                                    │  Whisper (5000) ← Backend       │
                                    │  PostgreSQL (5432) ← Backend    │
                                    └─────────────────────────────────┘
```

**Tại sao cần Nginx?**
- Ngrok free chỉ cho **1 tunnel** (1 URL)
- App cần cả Frontend (UI) và Backend (API)
- Nginx làm reverse proxy: 
  - `/` → Frontend
  - `/api/*` → Backend
- User chỉ cần 1 URL để sử dụng toàn bộ app!

### Flow tự động
```
┌─────────────────────────────────────────────────────────────┐
│                    Ngrok Manager Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Start Docker Compose (với nginx trên port 8080)         │
│           ↓                                                  │
│  2. Stop ngrok cũ (nếu có)                                  │
│           ↓                                                  │
│  3. Start ngrok tunnel đến port 8080 → Lấy URL              │
│           ↓                                                  │
│  4. Lưu URL vào file + Cập nhật redirect.html               │
│           ↓                                                  │
│  5. Hiển thị URL cho user                                   │
│           ↓                                                  │
│  6. Đợi 12 tiếng                                            │
│           ↓                                                  │
│  7. Quay lại bước 2                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 Giải pháp Redirect cho User

### Option 1: Dùng URL trực tiếp
Mỗi khi URL thay đổi, bạn gửi URL mới cho user.

### Option 2: Host redirect.html
1. Upload file `redirect.html` lên một hosting miễn phí (GitHub Pages, Netlify, Vercel)
2. Script sẽ tự động update file này khi URL thay đổi
3. User luôn truy cập qua URL của hosting đó

### Option 3: Chạy Redirect Server (Recommended)
Chạy `redirect-server.js` trên một server luôn online:

```bash
# Trên server của bạn
node redirect-server.js

# Hoặc với custom port
PORT=8080 node redirect-server.js
```

**Cách update URL từ xa:**
```bash
# Gọi API để update URL
curl -X POST http://your-server:8080/api/update \
  -H "Content-Type: application/json" \
  -d '{"key": "learnjoy-secret", "url": "https://new-ngrok-url.ngrok.io"}'
```

### Option 4: Dùng GitHub Gist (Manual)
1. Tạo một GitHub Gist với nội dung là URL hiện tại
2. Share link raw của Gist cho user
3. User có thể dùng bookmark script để auto-redirect

## ⚙️ Tùy chỉnh

### Thay đổi port
```powershell
# Windows
-NgrokPort 8080

# Linux/Mac
./ngrok-manager.sh 8080
```

### Thay đổi region
```powershell
# Windows  
-NgrokRegion us  # us, eu, ap, au, sa, jp, in

# Linux/Mac
./ngrok-manager.sh 3000 us
```

### Thay đổi thời gian restart
```powershell
# Windows - 6 tiếng
-RestartIntervalHours 6

# Linux/Mac - 6 tiếng
./ngrok-manager.sh 3000 ap 6
```

## 🛠️ Troubleshooting

### Ngrok không start được
```bash
# Kiểm tra ngrok đã cài chưa
ngrok version

# Kiểm tra đã auth chưa
ngrok config check
```

### Docker không chạy
```bash
# Kiểm tra Docker Desktop đang chạy
docker info
```

### Lấy URL hiện tại
```bash
# Windows
ngrok-tools/get-current-url.bat

# Linux/Mac
cat ngrok-tools/current-ngrok-url.txt
```

### Xem log
```bash
cat ngrok-tools/ngrok-manager.log
```

## 📊 Monitoring

Ngrok có dashboard tại: http://localhost:4040

Bạn có thể xem:
- Requests đang đến
- Response time
- Errors

## 🔐 Security Notes

1. **Ngrok Free Tier**: URL thay đổi mỗi lần restart, nên cần auto-redirect
2. **Ngrok Paid**: Có thể dùng custom domain (không cần redirect)
3. **Chỉ expose** nginx port (8080) ra ngoài
4. Database và các service khác **không** được expose trực tiếp
5. Nginx tự động route traffic đến đúng service

## 💡 Tips

1. **Chạy trong background** (Windows):
   ```powershell
   Start-Process powershell -WindowStyle Hidden -ArgumentList "-File ngrok-manager.ps1"
   ```

2. **Chạy trong background** (macOS):
   ```bash
   nohup ./ngrok-manager-mac.sh > /dev/null 2>&1 &
   
   # Hoặc dùng screen
   brew install screen
   screen -S learnjoy ./ngrok-manager-mac.sh
   # Detach: Ctrl+A, D
   # Reattach: screen -r learnjoy
   ```

3. **Chạy trong background** (Linux):
   ```bash
   nohup ./ngrok-manager.sh > /dev/null 2>&1 &
   ```

4. **Tự động start khi boot** (Windows):
   - Tạo shortcut của `start-learnjoy.bat`
   - Đặt vào `shell:startup`

5. **Tự động start khi boot** (macOS):
   - System Preferences → Users & Groups → Login Items
   - Add `start-learnjoy-mac.command`

6. **Thông báo URL mới qua Slack/Discord**:
   - Thêm webhook call vào script sau khi có URL mới

## 🍎 Lưu ý đặc biệt cho macOS M1/M2/M3

### Whisper Dockerfile
Script sẽ tự động sử dụng `Dockerfile.apple-silicon` cho Whisper service để tối ưu cho chip Apple Silicon.

### Nếu gặp lỗi "permission denied"
```bash
chmod +x ngrok-manager-mac.sh start-learnjoy-mac.command get-current-url-mac.sh
```

### Nếu gặp lỗi "cannot be opened because it is from an unidentified developer"
1. Mở System Preferences → Security & Privacy
2. Click "Allow Anyway" cho file bị chặn
3. Hoặc chạy từ Terminal thay vì double-click

### Nếu Docker Desktop chậm
1. Mở Docker Desktop → Settings → Resources
2. Tăng Memory lên 4-6 GB
3. Tăng CPUs lên 4+

### Ngrok region cho tốc độ tốt nhất từ Việt Nam
```bash
./ngrok-manager-mac.sh 3000 ap 12  # Asia Pacific (recommended)
./ngrok-manager-mac.sh 3000 jp 12  # Japan (alternative)
```
