const express = require('express');
const vision = require('@google-cloud/vision');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- 安全的金鑰設定 (與之前相同) ---
let visionClient;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        visionClient = new vision.ImageAnnotatorClient({ credentials });
    } catch (e) {
        console.error('Failed to parse GOOGLE_CREDENTIALS_JSON:', e);
        process.exit(1);
    }
} else {
    visionClient = new vision.ImageAnnotatorClient();
}

// --- Multer 設定 (與之前相同) ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- 提供靜態檔案 (public 資料夾) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- [新增] 語言自動偵測與重導向 ---
app.get('/', (req, res) => {
    const lang = req.headers['accept-language'];
    // 如果瀏覽器偏好語言包含 'zh-TW' 或 'zh-Hant', 導向繁中版
    if (lang && (lang.includes('zh-TW') || lang.includes('zh-Hant'))) {
        res.redirect('/zh-tw/');
    } else {
        // 其他所有情況，預設導向英文版
        res.redirect('/en/');
    }
});

// --- OCR API 端點 (與之前相同) ---
app.post('/api/ocr', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }
    try {
        const imageContent = req.file.buffer;
        const [result] = await visionClient.textDetection({
            image: { content: imageContent },
        });
        const detections = result.textAnnotations;
        if (detections && detections.length > 0) {
            res.json({ text: detections[0].description });
        } else {
            res.json({ text: 'No text found in the image.' });
        }
    } catch (err) {
        console.error('OCR PROCESSING ERROR:', err);
        res.status(500).json({ error: 'Error processing the image with Google Vision API.', details: err.message });
    }
});

// 為了讓 Vercel 能處理 Express App，匯出 app
module.exports = app;