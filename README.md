
# ImageServer Node.js Project

이미지 업로드/다운로드 및 1시간 후 자동 삭제 기능이 포함된 Node.js 서버입니다.

## 실행 방법

1. [Node.js](https://nodejs.org/)가 설치되어 있어야 합니다.
2. 터미널에서 프로젝트 폴더로 이동합니다.
3. 아래 명령어를 실행합니다:

    npm install
    npm start

4. 서버가 실행되면 [http://localhost:3000](http://localhost:3000) 으로 접속할 수 있습니다.

---

## 주요 엔드포인트 및 사용법

### 1. 이미지 업로드

- **POST** `/upload`
- `multipart/form-data` 형식으로 `image` 필드에 파일을 첨부하여 업로드
- 업로드 성공 시 `{ url: "/images/{UUID}" }` 형태로 이미지 접근 URL 반환

#### 예시 (curl)

```
curl -F "image=@your_image.jpg" http://localhost:3000/upload
```

### 2. 이미지 표시/다운로드

- **GET** `/images/{UUID}` : 업로드된 이미지를 브라우저에서 바로 표시
- **GET** `/images/{UUID}/download` : 이미지를 강제로 다운로드

#### 예시 (curl)

이미지 표시:
```
curl http://localhost:3000/images/{UUID} --output result.jpg
```

이미지 다운로드:
```
curl -OJ http://localhost:3000/images/{UUID}/download
```

---

- 업로드된 이미지는 1시간(60분) 후 자동으로 삭제됩니다.
- 서버 재시작 시 인메모리 관리 정보는 초기화됩니다.
- 파일은 `temp_uploads` 폴더에 임시 저장됩니다.
- 포트 변경은 환경변수 `PORT`로 지정할 수 있습니다.
