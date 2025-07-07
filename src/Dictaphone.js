import React from "react";
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
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
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
          disabled={listening}
          style={{
            padding: "10px 20px",
            margin: "0 10px",
            fontSize: "16px",
            backgroundColor: listening ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: listening ? "not-allowed" : "pointer",
          }}
        >
          녹음 시작
        </button>
        <button
          onClick={stopListening}
          disabled={!listening}
          style={{
            padding: "10px 20px",
            margin: "0 10px",
            fontSize: "16px",
            backgroundColor: !listening ? "#ccc" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !listening ? "not-allowed" : "pointer",
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
