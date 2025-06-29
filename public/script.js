// Wait for the entire HTML document to be fully loaded and parsed
document.addEventListener('DOMContentLoaded', function() {

    // All of our code now goes inside this function
    const ocrForm = document.getElementById('ocrForm');
    const imageInput = document.getElementById('imageInput');
    const uploadArea = document.getElementById('uploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const submitButton = document.getElementById('submitButton');
    const resultSection = document.getElementById('resultSection');
    const loading = document.getElementById('loading');
    const resultText = document.getElementById('resultText');

    // Defensive check to make sure the elements exist before adding listeners
    if (uploadArea && imageInput) {
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            uploadArea.classList.add('hover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('hover');
        });

        uploadArea.addEventListener('drop', (event) => {
            event.preventDefault();
            uploadArea.classList.remove('hover');
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                imageInput.files = files;
                const changeEvent = new Event('change');
                imageInput.dispatchEvent(changeEvent);
            }
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                    uploadPrompt.classList.add('hidden');
                    uploadArea.classList.add('has-image');
                    submitButton.disabled = false;
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    if (ocrForm) {
        ocrForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            if (!imageInput.files || imageInput.files.length === 0) {
                alert('Please select an image first.');
                return;
            }

            loading.classList.remove('hidden');
            resultSection.classList.add('hidden');
            resultText.textContent = '';
            submitButton.disabled = true;

            const formData = new FormData();
            formData.append('image', imageInput.files[0]);

            try {
                const response = await fetch('/api/ocr', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Server processing error');
                }

                const data = await response.json();
                resultText.textContent = data.text;

            } catch (error) {
                console.error('Error:', error);
                resultText.textContent = `An error occurred: ${error.message}`;
            } finally {
                loading.classList.add('hidden');
                resultSection.classList.remove('hidden');
                submitButton.disabled = false;
            }
        });
    }
});