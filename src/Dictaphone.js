import React, { useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const Dictaphone = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
  });

  const [audioUrl, setAudioUrl] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]); // 여러 파일 저장
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <span style={{ color: "#333" }}>
        Browser doesn't support speech recognition.
      </span>
    );
  }

  if (!isMicrophoneAvailable) {
    return (
      <span style={{ color: "#333" }}>
        마이크에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.
      </span>
    );
  }

  const startListening = () => {
    SpeechRecognition.startListening({
      continuous: true,
      language: "ko-KR",
    });
    // Start MediaRecorder
    if (navigator.mediaDevices && window.MediaRecorder) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mediaRecorder = new window.MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          // 파일명: 녹음 시각 기준
          const filename = `recording_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.webm`;
          setAudioFiles((prev) => [
            ...prev,
            { blob: audioBlob, url, filename },
          ]);
        };
        mediaRecorder.start();
        setRecording(true);
      });
    }
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // 파일 삭제
  const handleDelete = (idx) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // 모두 서버로 전송
  const handleUploadAll = async () => {
    if (audioFiles.length === 0) return;
    const formData = new FormData();
    audioFiles.forEach((file, idx) => {
      formData.append("audios", file.blob, file.filename);
    });
    // 실제 서버 주소로 변경 필요
    await fetch("http://localhost:3000/upload/audios", {
      method: "POST",
      body: formData,
    });
    alert("모든 파일을 서버로 전송했습니다 (가상)");
    // 전송 후 파일 목록 초기화 (원하지 않으면 주석처리)
    setAudioFiles([]);
  };

  return (
    <div style={{ padding: "20px", textAlign: "center", color: "#333" }}>
      <h2 style={{ color: "#333" }}>음성 인식</h2>
      <div style={{ margin: "20px 0" }}>
        <p style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
          마이크 상태: {listening ? "🟢 녹음 중" : "🔴 정지"}
        </p>
      </div>

      <div style={{ margin: "20px 0" }}>
        <button
          onClick={startListening}
          disabled={listening || recording}
          style={{
            padding: "10px 20px",
            margin: "0 10px",
            fontSize: "16px",
            backgroundColor: listening || recording ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: listening || recording ? "not-allowed" : "pointer",
          }}
        >
          녹음 시작
        </button>
        <button
          onClick={stopListening}
          disabled={!listening && !recording}
          style={{
            padding: "10px 20px",
            margin: "0 10px",
            fontSize: "16px",
            backgroundColor: !listening && !recording ? "#ccc" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !listening && !recording ? "not-allowed" : "pointer",
          }}
        >
          녹음 정지
        </button>
        <button
          onClick={resetTranscript}
          style={{
            padding: "10px 20px",
            margin: "0 10px",
            fontSize: "16px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          텍스트 초기화
        </button>
      </div>

      {/* 여러 녹음 파일 목록 */}
      {audioFiles.length > 0 && (
        <div
          style={{
            margin: "20px 0",
            textAlign: "left",
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <h3>녹음 파일 목록</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {audioFiles.map((file, idx) => (
              <li
                key={file.url}
                style={{
                  marginBottom: 10,
                  border: "1px solid #ddd",
                  borderRadius: 5,
                  padding: 10,
                  background: "#fafafa",
                }}
              >
                <span style={{ fontWeight: "bold" }}>{file.filename}</span>
                <audio
                  src={file.url}
                  controls
                  style={{ margin: "0 10px", verticalAlign: "middle" }}
                />
                <a
                  href={file.url}
                  download={file.filename}
                  style={{ marginRight: 10 }}
                >
                  다운로드
                </a>
                <button
                  onClick={() => handleDelete(idx)}
                  style={{
                    color: "#fff",
                    background: "#f44336",
                    border: "none",
                    borderRadius: 3,
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleUploadAll}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: "#673ab7",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            모두 서버로 전송
          </button>
        </div>
      )}

      <div
        style={{
          margin: "20px 0",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          minHeight: "100px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h3 style={{ color: "#333" }}>인식된 텍스트:</h3>
        <p style={{ fontSize: "16px", lineHeight: "1.5", color: "#333" }}>
          {transcript || "음성을 말씀해주세요..."}
        </p>
      </div>

      {listening && (
        <div
          style={{
            margin: "20px 0",
            padding: "10px",
            backgroundColor: "#e8f5e8",
            borderRadius: "5px",
            border: "1px solid #4CAF50",
          }}
        >
          <p style={{ color: "#333" }}>
            🎤 녹음 중입니다. 말씀을 계속하세요...
          </p>
        </div>
      )}
    </div>
  );
};

export default Dictaphone;
