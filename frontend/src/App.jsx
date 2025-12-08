import { useState } from "react";
import ParticlesBg from "particles-bg";

export default function App() {
  const [status, setStatus] = useState("idle");
  const [relatorio, setRelatorio] = useState("");
  const [erroMsg, setErroMsg] = useState("");

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setStatus("loading");
    setRelatorio("");
    setErroMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao conectar ao servidor");
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

  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      overflowX: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
    },

    title: {
      fontSize: "clamp(1.8rem, 4vw, 3rem)",
      marginBottom: "30px",
      fontFamily: "Times New Roman, serif",
    },

    box: {
      minHeight: "260px",
      border: "2px #000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "15px",
      cursor: status === "idle" ? "pointer" : "default",
    },

    img: {
      width: "90px",
      marginBottom: "15px",
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
    },

    errorText: {
      marginTop: "10px",
      color: "#900",
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
            <div style={styles.report}>
              {relatorio}
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <img src="/ImgIconUpload.png" style={styles.img} />
        <p>Selecione um arquivo PDF ou DOCX</p>
      </>
    );
  }

  return (
    <div style={styles.page}>
      {/* BACKGROUND COM PARTÍCULAS */}
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

      {/* CONTEÚDO */}
      <div style={styles.container}>
        <h1 style={styles.title}>Analisador de Contratos</h1>

        <label style={styles.box}>
          {renderContent()}
          {status === "idle" && (
            <input
              type="file"
              accept=".pdf,.docx"
              hidden
              onChange={handleUpload}
            />
          )}
        </label>
      </div>
    </div>
  );
}
