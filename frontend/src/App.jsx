import { useState, useRef } from "react";
import ParticlesBg from "particles-bg";

export default function App() {
  const [status, setStatus] = useState("idle"); 
  const [relatorio, setRelatorio] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  function resetApp() {
    setStatus("idle");
    setRelatorio("");
    setErroMsg("");
    setIsDragging(false);
  }

  async function sendFile(file) {
    if (!file) return;

    setStatus("loading");
    setRelatorio("");
    setErroMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao conectar ao servidor`);
      }

      const data = await response.json();
      setRelatorio(data.result || "Relatório não retornado.");

      if (data.result && data.result.includes("CONTRATO ÍNTEGRO")) {
        setStatus("ok");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErroMsg("Falha ao analisar o contrato.");
    }
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    sendFile(file);
    e.target.value = null;
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) sendFile(file);
  }

  function handleDragOver(e) {
    if (status !== "idle") return;
    e.preventDefault();
  }

  function handleDragEnter(e) {
    if (status !== "idle") return;
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },

    container: {
      zIndex: 2,
      background: "rgba(240,240,235,0.96)",
      border: "2px solid #000",
      padding: "40px",
      maxWidth: "900px",
      width: "100%",
      textAlign: "center",
    },

    title: {
      fontFamily: "Times New Roman, serif",
      fontSize: "clamp(1.8rem, 4vw, 3rem)",
      marginBottom: "25px",
    },

    box: {
      minHeight: "260px",
      border: "2px dashed #000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      cursor: status === "idle" ? "pointer" : "default",
      background: isDragging ? "rgba(0,0,0,0.05)" : "transparent",
      userSelect: status === "idle" ? "none" : "text",
    },

    img: {
      width: "90px",
      marginBottom: "12px",
    },

    report: {
      textAlign: "left",
      whiteSpace: "pre-wrap",
      maxHeight: "300px",
      overflowY: "auto",
      borderTop: "1px solid #000",
      paddingTop: "12px",
      marginTop: "12px",
      userSelect: "text",
    },

    button: {
      marginTop: "20px",
      padding: "10px 18px",
      border: "1px solid #000",
      background: "#fff",
      cursor: "pointer",
      fontWeight: "bold",
    },

    errorText: {
      color: "#900",
      marginTop: "10px",
      fontWeight: "bold",
    },
  };

  function renderContent() {
    if (status === "loading") {
      return (
        <>
          <img src="/GifIconAnalisando.gif" style={styles.img} />
          <p>Analisando contrato...</p>
        </>
      );
    }

    if (status === "ok" || status === "error") {
      return (
        <>
          <img
            src={
              status === "ok"
                ? "/ImgIconContratoIntegro.png"
                : "/ImgIconContratoNaoIntegro.png"
            }
            style={styles.img}
          />

          <p>
            <strong>
              {status === "ok"
                ? "Contrato Íntegro"
                : "Contrato Não Íntegro"}
            </strong>
          </p>

          {erroMsg && <p style={styles.errorText}>{erroMsg}</p>}

          {relatorio && (
            <div style={styles.report}>{relatorio}</div>
          )}

          <button style={styles.button} onClick={resetApp}>
            🔄 Analisar outro arquivo
          </button>
        </>
      );
    }

    return (
      <>
        <img src="/ImgIconUpload.png" style={styles.img} />
        <p>Arraste ou selecione um arquivo PDF ou DOCX</p>
      </>
    );
  }

  return (
    <div style={styles.page}>
      <ParticlesBg type="cobweb" color="#000" bg />

      <div style={styles.container}>
        <h1 style={styles.title}>Analisador de Contratos de Estágio</h1>

        <div
          style={styles.box}
          onClick={() => status === "idle" && inputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {renderContent()}

          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".pdf,.docx"
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
}