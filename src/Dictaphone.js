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
  const [serverAudioFiles, setServerAudioFiles] = useState([]); // 서버에서 받은 파일들
  const [uploading, setUploading] = useState(false); // 업로드 상태
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
    setUploading(true);

    try {
      const formData = new FormData();
      audioFiles.forEach((file, idx) => {
        formData.append("audios", file.blob, file.filename);
      });

      console.log("📤 서버로 전송 시작:", {
        파일개수: audioFiles.length,
        파일명들: audioFiles.map((f) => f.filename),
      });

      const response = await fetch("http://localhost:3000/upload/audios", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(" 서버 응답 받음:", result);

      // 서버 응답 처리
      if (result.success && result.urls && Array.isArray(result.urls)) {
        console.log("✅ 업로드 성공, URL 개수:", result.urls.length);

        // 받은 URL들을 서버 파일 목록에 추가
        const newServerFiles = result.urls.map((url, index) => ({
          url: url,
          filename: `server_${Date.now()}_${index}.webm`,
          uploadedAt: new Date().toLocaleString(),
        }));

        setServerAudioFiles((prev) => [...prev, ...newServerFiles]);
        console.log("📝 서버 파일 목록에 추가됨:", newServerFiles);
      } else {
        console.warn("⚠️ 서버 응답 형식이 예상과 다름:", result);
      }

      alert(
        result.message ||
          `성공적으로 ${audioFiles.length}개 파일을 서버로 전송했습니다!`
      );
      setAudioFiles([]);
      console.log(" 업로드 완료, 로컬 파일 목록 초기화됨");
    } catch (error) {
      console.error("❌ 업로드 중 오류 발생:", error);
      alert(`업로드 실패: ${error.message}`);
    } finally {
      setUploading(false);
      console.log("🏁 업로드 프로세스 종료");
    }
  };

  // 서버 파일 삭제
  const handleDeleteServerFile = (idx) => {
    setServerAudioFiles((prev) => prev.filter((_, i) => i !== idx));
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
            disabled={uploading}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: uploading ? "#ccc" : "#673ab7",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              fontWeight: "bold",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "전송 중..." : "모두 서버로 전송"}
          </button>
        </div>
      )}

      {/* 서버에서 받은 파일 목록 */}
      {serverAudioFiles.length > 0 && (
        <div
          style={{
            margin: "20px 0",
            textAlign: "left",
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <h3>서버에 저장된 파일들</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {serverAudioFiles.map((file, idx) => (
              <li
                key={file.url}
                style={{
                  marginBottom: 10,
                  border: "1px solid #ddd",
                  borderRadius: 5,
                  padding: 10,
                  background: "#f0f8ff",
                }}
              >
                <div style={{ marginBottom: 5 }}>
                  <span style={{ fontWeight: "bold" }}>{file.filename}</span>
                  <span
                    style={{ fontSize: "12px", color: "#666", marginLeft: 10 }}
                  >
                    {file.uploadedAt}
                  </span>
                </div>
                <audio
                  src={file.url}
                  controls
                  style={{ margin: "0 10px", verticalAlign: "middle" }}
                />
                <button
                  onClick={() => handleDeleteServerFile(idx)}
                  style={{
                    color: "#fff",
                    background: "#f44336",
                    border: "none",
                    borderRadius: 3,
                    padding: "5px 10px",
                    cursor: "pointer",
                    marginLeft: 10,
                  }}
                >
                  목록에서 삭제
                </button>
              </li>
            ))}
          </ul>
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
