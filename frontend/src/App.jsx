import { useState, useRef } from "react";
import ParticlesBg from "particles-bg";

export default function App() {
  const [status, setStatus] = useState("idle"); 
  const [relatorio, setRelatorio] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  async function sendFile(file) {
    if (!file) return;
    console.log("Enviando arquivo:", file.name, file.type, file.size);
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
        const text = await response.text().catch(() => "");
        const msg = `Servidor respondeu com status ${response.status}. ${text}`;
        throw new Error(msg);
      }

      const data = await response.json();
      console.log("Resposta do backend:", data);

      setRelatorio(data.result || "Relatório não retornado.");

      if (data.result && data.result.includes("CONTRATO ÍNTEGRO")) {
        setStatus("ok");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Erro ao enviar/analisar:", err);
      setStatus("error");
      setErroMsg(err.message || "Falha ao analisar o contrato.");
    }
  }

  function handleInputChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    sendFile(file);
    e.target.value = null;
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStatus("dragging");
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setStatus("idle");
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dt = e.dataTransfer;
    const file = dt && dt.files && dt.files[0];
    if (!file) {
      setErroMsg("Nenhum arquivo detectado no drop.");
      setStatus("error");
      return;
    }
    sendFile(file);
  }

  function handleLabelClick() {
    if (status === "idle" && inputRef.current) {
      inputRef.current.click();
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      overflowX: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
    },

    container: {
      zIndex: 2,
      position: "relative",
      background: "rgba(240,240,235,0.96)",
      border: "2px solid #000",
      padding: "40px 30px",
      maxWidth: "900px",
      width: "100%",
      textAlign: "center",
      color: "#000",
      boxSizing: "border-box",
    },

    title: {
      fontSize: "clamp(1.8rem, 4vw, 3rem)",
      marginBottom: "20px",
      fontFamily: "Times New Roman, serif",
    },

    box: {
      minHeight: "260px",
      border: isDragging ? "2px dashed #007bff" : "2px dashed #000",
      background: isDragging ? "rgba(0,123,255,0.05)" : "transparent",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "15px",
      cursor: status === "idle" ? "pointer" : "default",
      transition: "background .15s, border-color .15s",
      userSelect: "none",
    },

    img: {
      width: "90px",
      marginBottom: "12px",
    },

    report: {
      whiteSpace: "pre-wrap",
      textAlign: "left",
      maxHeight: "300px",
      overflowY: "auto",
      marginTop: "15px",
      borderTop: "1px solid #000",
      paddingTop: "12px",
      fontSize: "0.95rem",
      textAlignLast: "left",
    },

    errorText: {
      marginTop: "10px",
      color: "#900",
      fontWeight: "bold",
    },

    hint: {
      fontSize: "0.9rem",
      color: "#333",
      marginTop: "8px",
    },
  };

  function renderContent() {
    if (status === "loading") {
      return (
        <>
          <img src="/GifIconAnalisando.gif" style={styles.img} alt="Analisando" />
          <p>Analisando contrato...</p>
        </>
      );
    }

    if (status === "ok" || status === "error") {
      return (
        <>
          <img
            src={status === "ok" ? "/ImgIconContratoIntegro.png" : "/ImgIconContratoNaoIntegro.png"}
            style={styles.img}
            alt={status === "ok" ? "Contrato íntegro" : "Contrato não íntegro"}
          />
          <p>
            <strong>{status === "ok" ? "Contrato Íntegro" : "Contrato Não Íntegro"}</strong>
          </p>

          {erroMsg && <p style={styles.errorText}>{erroMsg}</p>}

          {relatorio && (
            <div style={styles.report}>
              {relatorio}
            </div>
          )}

          <p style={styles.hint}>Para analisar outro arquivo, arraste e solte ou clique novamente.</p>
        </>
      );
    }

    return (
      <>
        <img src="/ImgIconUpload.png" style={styles.img} alt="Upload" />
        <p>Arraste e solte um arquivo PDF ou DOCX aqui</p>
        <p style={styles.hint}>ou clique para selecionar um arquivo</p>
      </>
    );
  }

  return (
    <div style={styles.page}>
      <ParticlesBg
        type="cobweb"
        color="#000"
        bg={{
          position: "absolute",
          zIndex: 0,
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      <div style={styles.container}>
        <h1 style={styles.title}>Analisador de Contratos de Estágio</h1>

        <label
          style={styles.box}
          onClick={handleLabelClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {renderContent()}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            hidden
            onChange={handleInputChange}
          />
        </label>
      </div>
    </div>
  );
}