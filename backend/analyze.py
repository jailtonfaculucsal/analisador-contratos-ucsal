import os
import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from docx import Document
from pypdf import PdfReader

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

app = FastAPI()

# libera acesso do React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def read_pdf(path):
    reader = PdfReader(path)
    return "\n\n".join(
        page.extract_text() or "" for page in reader.pages
    )

def read_docx(path):
    doc = Document(path)
    return "\n\n".join(p.text for p in doc.paragraphs if p.text)

def analyze_contract(text):
    prompt = f"""
    Você é uma ferramenta de análise de contratos de estágio. Verifique se o contrato está ÍNTEGRO ou NÃO ÍNTEGRO com base nos requisitos abaixo.

    Requisitos OBRIGATÓRIOS:

    - Existe um Termo de Compromisso formalizado entre o estudante, a empresa e a instituição de ensino?
    - O contrato atesta a matrícula e frequência regular do estudante?
    - A carga horária descrita no contrato é compatível com o nível de ensino do estudante, respeitando os limites legais específicos (ex: 4h/dia e 20h/semana para educação especial; 6h/dia e 30h/semana para ensino superior; ou até 40h/semana para cursos que alternam teoria e prática)?
    - O período entre a data de início e a de término do contrato não excede o limite de 2 anos? (exceto caso esteja tratando de estagiário portador de deficiência)?
    - Em caso de estágio do tipo não obrigatório, as cláusulas compulsórias de Bolsa, Auxílio-Transporte estão inclusas e há presença de previsão do Recesso Remunerado?
    - Existe a cláusula que assegura o direito ao recesso de 30 dias (ou proporcional), benefício obrigatório para todos os tipos de estágio?

    Requisitos DESEJÁVEIS:

    - A cláusula que estabelece a contratação de seguro contra acidentes pessoais para o estagiário foi identificada?
    - Os nomes do supervisor da parte concedente e do professor orientador da instituição de ensino estão designados no termo?
    - Há uma seção ou anexo denominado ”Plano de Atividades” com a descrição das tarefas que serão realizadas pelo estagiário?
    - Existe a cláusula que menciona a obrigação do estagiário de entregar relatórios de atividades em um período não superior a 6 meses?

    Regras:
    - Se todos os requisitos obrigatórios estiverem conformes, o contrato é ÍNTEGRO.
    - Se algum requisito obrigatório falhar, o contrato é NÃO ÍNTEGRO.
    - Requisitos desejáveis não conformes geram apenas observações.

    Instruções de saída:
    - Use apenas texto simples.
    - Comece com o título: Relatório de Análise de Contrato de Estágio.
    - Em seguida, informe o resultado como: "Resultado: CONTRATO ÍNTEGRO" ou "Resultado: CONTRATO NÃO ÍNTEGRO" de acordo com a sua análise.
    - Crie três seções chamadas ⚠️ Pontos Críticos, ℹ️ Observações e ✅ Requisitos Atendidos.
    - Em Pontos Críticos, você colocará apenas os requisitos obrigatórios não atendidos.
    - Em Observações, você colocará apenas os requisitos desejáveis não atendidos.
    - Em Requisitos Atendidos, você colocará apenas os requisitos obrigatórios/desejáveis que foram atendidos.

    Contrato: {text}
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    if suffix == ".pdf":
        text = read_pdf(tmp_path)
    elif suffix == ".docx":
        text = read_docx(tmp_path)
    else:
        return {"error": "Formato não suportado"}

    result = analyze_contract(text)
    return {"result": result}
