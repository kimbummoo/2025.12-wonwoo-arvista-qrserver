const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// 💡 클라이언트가 "http://localhost:3000"으로 접근하므로 BASE_URL을 설정합니다.
const BASE_URL = `http://localhost:${PORT}`; 

const UPLOAD_DIR = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}
// 서버 시작 시 temp_uploads 폴더 비우기
fs.readdirSync(UPLOAD_DIR).forEach(file => {
  const filePath = path.join(UPLOAD_DIR, file);
  if (fs.lstatSync(filePath).isFile()) {
    try {
      fs.unlinkSync(filePath);
      // console.log(`[Startup] Deleted old file: ${file}`);
    } catch (err) {
      console.error(`[Startup] Failed to delete file ${file}: ${err.message}`);
    }
  }
});

// 인메모리 맵: uuid -> { filePath, timer }
const fileMap = new Map();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = uuidv4();
    cb(null, id + ext);
  }
});

const upload = multer({ storage });

// 이미지 업로드
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    // 💡 HTTP 400 Bad Request
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const ext = path.extname(req.file.filename);
  const id = path.basename(req.file.filename, ext);
  const filePath = req.file.path;

  // 5분 후 파일 삭제 타이머 (5분 * 60초 * 1000ms = 300,000ms)
  const timer = setTimeout(() => {
    fs.unlink(filePath, err => {
      if (!err) {
          console.log(`[Cleaner] Deleted expired file: ${id}`);
          fileMap.delete(id);
      } else {
          console.error(`[Cleaner] Failed to delete file ${id}: ${err.message}`);
      }
    });
  }, 5 * 60 * 1000);

  fileMap.set(id, { filePath, timer });

  // 🚀 수정된 부분: BASE_URL을 추가하여 클라이언트가 파싱 즉시 사용할 수 있는 절대 URL을 반환
  res.json({ url: `${BASE_URL}/images/${id}` });
});

// 이미지 다운로드/표시
app.get('/images/:uuid', (req, res) => {
  const { uuid } = req.params;
  const entry = fileMap.get(uuid);
  
  // 파일이 맵에 없거나, 파일 시스템에 실제 파일이 존재하지 않는 경우
  if (!entry || !fs.existsSync(entry.filePath)) {
    return res.status(404).send('Image not found or expired');
  }
  
  // 파일의 MIME 타입을 자동으로 설정하여 이미지를 브라우저/Unity에서 표시
  res.sendFile(path.resolve(entry.filePath));
});

// 강제 다운로드 지원 (선택)
app.get('/images/:uuid/download', (req, res) => {
  const { uuid } = req.params;
  const entry = fileMap.get(uuid);
  if (!entry || !fs.existsSync(entry.filePath)) {
    return res.status(404).send('Image not found');
  }
  res.download(path.resolve(entry.filePath));
});

app.listen(PORT, () => {
  console.log(`Server running at ${BASE_URL}/`);
});