import React from "react";
import "./App.css";
import Dictaphone from "./Dictaphone";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>음성 인식 앱</h1>
        <Dictaphone />
      </header>
    </div>
  );
}

export default App;
