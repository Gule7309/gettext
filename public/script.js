// public/script.js (修正版)

// --- 元素選擇 ---
const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const uploadPrompt = document.getElementById('uploadPrompt');
const imagePreview = document.getElementById('imagePreview');
const submitButton = document.getElementById('submitButton');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('resultContainer');
const resultText = document.getElementById('resultText');

// --- 預覽與拖放功能 ---

// (!!!) 注意：我們已經移除了這裡的 uploadArea.addEventListener('click', ...)
// 我們將完全依賴 HTML 的 <label for="imageInput"> 來觸發點擊

// 監聽檔案選擇事件
imageInput.addEventListener('change', handleFileSelect);

// 處理拖放事件
uploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadArea.style.borderColor = '#3498db';
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#d0dbe2';
});
uploadArea.addEventListener('drop', (event) => {
    event.preventDefault();
    imageInput.files = event.dataTransfer.files; // 將拖放的檔案賦值給 input
    handleFileSelect({ target: imageInput }); // 手動觸發處理函式
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // 顯示圖片預覽
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            // 隱藏提示文字
            uploadPrompt.classList.add('hidden');
            // 為 uploadArea 新增 class，改變樣式
            uploadArea.classList.add('has-image');
            // 啟用提交按鈕
            submitButton.disabled = false;
        }
        reader.readAsDataURL(file);
    }
}

// --- 表單提交 ---
uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = imageInput.files[0];
    if (!file) {
        alert('Please select an image file first.');
        return;
    }

    loading.classList.remove('hidden');
    submitButton.disabled = true; // 處理中禁用按鈕
    resultContainer.classList.add('hidden'); // 隱藏舊結果

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/ocr', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Recognition failed');
        }

        const data = await response.json();
        resultText.textContent = data.text;
        resultContainer.classList.remove('hidden'); // 顯示新結果

    } catch (error) {
        console.error('Error:', error);
        alert(`An error occurred: ${error.message}`);
    } finally {
        loading.classList.add('hidden');
    }
});