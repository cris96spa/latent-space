// GENERATED FILE - do not edit by hand.
// Regenerate with: uv run python utils/generate_vocabulary_tokens.py
// Source of truth: frontend/src/features/vocabulary/vocabulary.labels.json
// IDs are the GPT-2 (124M) byte-level BPE encoding via tiktoken's "gpt2".

export interface VocabularyToken {
  readonly label: string
  readonly ids: readonly number[]
}

export const VOCABULARY_TOKENS: readonly VocabularyToken[] = [
  { label: 'Python', ids: [37906] },
  { label: 'Java', ids: [29584] },
  { label: 'C++', ids: [34, 4880] },
  { label: 'C', ids: [34] },
  { label: 'Assembly', ids: [49670] },
  { label: 'SQL', ids: [17861] },
  { label: 'PyTorch', ids: [20519, 15884, 354] },
  { label: 'TensorFlow', ids: [51, 22854, 37535] },
  { label: 'scikit-learn', ids: [36216, 15813, 12, 35720] },
  { label: 'NumPy', ids: [33111, 20519] },
  { label: 'Pandas', ids: [47206, 292] },
  { label: 'Polars', ids: [47, 7828] },
  { label: 'Matplotlib', ids: [19044, 29487, 8019] },
  { label: 'Plotly', ids: [43328, 306] },
  { label: 'Gymnasium', ids: [38, 4948, 24716, 1505] },
  { label: 'Hugging Face', ids: [48098, 2667, 15399] },
  { label: 'LangChain', ids: [43, 648, 35491] },
  { label: 'LangGraph', ids: [43, 648, 37065] },
  { label: 'vLLM', ids: [85, 3069, 44] },
  { label: 'TensorRT', ids: [51, 22854, 14181] },
  { label: 'MLflow', ids: [5805, 11125] },
  { label: 'Ollama', ids: [46, 297, 1689] },
  { label: 'OpenAI', ids: [11505, 20185] },
  { label: 'Gemini', ids: [38, 368, 5362] },
  { label: 'Vertex AI', ids: [13414, 16886, 9552] },
  { label: 'Mistral', ids: [49370, 1373] },
  { label: 'Qwen', ids: [48, 21006] },
  { label: 'DeepSeek', ids: [29744, 4653, 988] },
  { label: 'FastAPI', ids: [22968, 17614] },
  { label: 'Django', ids: [35, 73, 14208] },
  { label: 'Docker', ids: [35, 12721] },
  { label: 'Docker Compose', ids: [35, 12721, 3082, 577] },
  { label: 'Traefik', ids: [15721, 891, 1134] },
  { label: 'uv', ids: [14795] },
  { label: 'Make', ids: [12050] },
  { label: 'Git', ids: [38, 270] },
  { label: 'GitHub', ids: [38, 270, 16066] },
  { label: 'GCP', ids: [38, 8697] },
  { label: 'AWS', ids: [12298, 50] },
  { label: 'Azure', ids: [26903, 495] },
  { label: 'Firebase', ids: [13543, 8692] },
  { label: 'MongoDB', ids: [44, 25162, 11012] },
  { label: 'Neo4j', ids: [8199, 78, 19, 73] },
  { label: 'Node-RED', ids: [19667, 12, 22083] },
]
