import React, { useRef, useState } from 'react';
import logo from '../logo.png';

function Upload() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // 添加一个状态来存储音频时长
  const [audioDuration, setAudioDuration] = useState(null);

  // 获取音频时长的函数
  const getAudioDuration = (file) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
      URL.revokeObjectURL(audio.src); // 清理创建的 URL
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
      getAudioDuration(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      getAudioDuration(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const apiToken = localStorage.getItem('openai_api_token');
    if (!apiToken) {
      alert('请先设置 OpenAI API Token');
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    // formData.append('timestamp_granularities[]', 'word');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
        body: formData,
      });
      const data = await response.json();
      setTranscript(data.text);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const fileBlob = new Blob([transcript], {type: 'text/plain'});
    element.href = URL.createObjectURL(fileBlob);
    element.download = "transcript.txt";
    document.body.appendChild(element);
    element.click();
  };


  const generateSummary = async () => {
    if (!transcript) return;
    const apiToken = localStorage.getItem('openai_api_token');
    if (!apiToken) {
      alert('请先设置 OpenAI API Token');
      return;
    }
    setIsSummarizing(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文本总结助手，请对提供的文本进行简洁的总结。'
            },
            {
              role: 'user',
              content: transcript
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      setSummary(data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsSummarizing(false);
    }
  };


  // 格式化时间的辅助��数
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}min:${remainingSeconds.toString().padStart(2, '0')}s`;
  };

  const calculatePrice = (durationInSeconds) => {
    const minutes = Math.ceil(durationInSeconds / 60);
    const priceInUSD = minutes * 0.006;
    const currency = localStorage.getItem('currency') || 'USD';
    const rate = window.exchangeRates[currency];
    const symbol = currency;
    return `${symbol}${(priceInUSD * rate).toFixed(3)}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Whisper Web</h1>
        <p className="text-gray-600">上传音频文件，获取翻译结果</p>
        <div className="mt-2 text-sm text-gray-500">
          支持的格式：mp3, mp4, mpeg, mpga, m4a, wav, webm · 最大文件大小：25 MB
          <a
            href="https://platform.openai.com/docs/guides/speech-to-text?lang=curl"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-500 hover:text-blue-600 hover:underline"
          >
            了解更多 ↗
          </a>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            hover:bg-gray-50`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="audio/*"
          onChange={handleFileChange}
        />

        <div className="space-y-4">
          <div className="flex justify-center items-center mb-6">
            <img src={logo} alt={''} className="w-32 h-32 object-contain opacity-90"/>
          </div>
          {file ? (
            <>
              <p className="text-lg font-medium">{file.name}</p>
              <p className="text-gray-500 mb-2">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
                {audioDuration && ` • ${formatDuration(audioDuration)}`}
                {audioDuration && ` • 预计费用: ${calculatePrice(audioDuration)}`}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={isLoading}
                className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                    disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
              >
                {isLoading ? '翻译中...' : '开始翻译'}
              </button>
            </>
          ) : (
            <>
              <p className="text-lg">拖拽音频文件到这里</p>
              <p className="text-gray-500">或点击选择文件</p>
            </>
          )}
        </div>
      </div>

      {transcript && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">翻译结果</h2>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              下载字幕
            </button>
            <button
              onClick={generateSummary}
              disabled={isSummarizing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {isSummarizing ? '生成中...' : 'AI 总结'}
            </button>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
        </div>
      )}

      {summary && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">AI 总结</h3>
          <p className="text-gray-700">{summary}</p>
        </div>
      )}
    </div>
  );
}

export default Upload;
