const express = require('express');
const vision = require('@google-cloud/vision');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- 安全的金鑰設定 ---
let visionClient;

// 檢查是否在 Vercel 等生產環境中
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        visionClient = new vision.ImageAnnotatorClient({ credentials });
        console.log('Vision Client initialized from environment variable.');
    } catch (e) {
        console.error('Failed to parse GOOGLE_CREDENTIALS_JSON:', e);
        process.exit(1); // Exit if credentials are bad
    }
} else {
    // 在本機開發時，會繼續使用您先前設定的檔案路徑
    visionClient = new vision.ImageAnnotatorClient();
    console.log('Vision Client initialized from local ADC.');
}
// --- 金鑰設定結束 ---

// Multer 設定，用於處理圖片上傳
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 提供靜態檔案 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// OCR API 端點
app.post('/api/ocr', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }
    
    console.log('Received image for OCR processing.');

    try {
        const imageContent = req.file.buffer;

        const [result] = await visionClient.textDetection({
            image: { content: imageContent },
        });

        const detections = result.textAnnotations;
        if (detections && detections.length > 0) {
            console.log('OCR successful.');
            // 回傳第一個偵測結果，通常是整張圖片的完整文字
            res.json({ text: detections[0].description });
        } else {
            console.log('OCR successful, but no text found.');
            res.json({ text: 'No text found in the image.' });
        }
    } catch (err) {
        console.error('OCR PROCESSING ERROR:', err);
        res.status(500).json({ error: 'Error processing the image with Google Vision API.', details: err.message });
    }
});

// 如果在本機環境，才啟動伺服器監聽
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}

// 為了讓 Vercel 能處理 Express App，匯出 app
module.exports = app;