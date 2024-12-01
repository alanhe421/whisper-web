import React, { useState } from 'react';

function Upload() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
        body: formData,
      });

      const data = await response.json();
      setTranscript(data.transcript);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const fileBlob = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = "transcript.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div>
      <input type="file" accept=".m4a" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={isLoading}>
        {isLoading ? '翻译中...' : '上传并翻译'}
      </button>
      {transcript && (
        <div>
          <h2>翻译结果：</h2>
          <p>{transcript}</p>
          <button onClick={handleDownload}>下载字幕</button>
        </div>
      )}
    </div>
  );
}

export default Upload; 