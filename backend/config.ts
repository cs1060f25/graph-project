class Config {
  GOOGLE_CLOUD_PROJECT?: string;
  GEMINI_API_KEY?: string;
  GOOGLE_CLOUD_LOCATION?: string;
  GOOGLE_GENAI_USE_VERTEXAI?: string;
  PORT?: string;

  constructor() {
    this.GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
    this.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    this.GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
    this.GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;
    this.PORT = process.env.PORT;
  }
}

const config = new Config();
export default config;

