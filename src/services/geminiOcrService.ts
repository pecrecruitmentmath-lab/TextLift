/**
 * Client service to interface with the server-side Gemini AI Vision OCR endpoint.
 */
export async function extractTextWithGeminiAI(
  imageBase64OrDataUrl: string,
  mimeType: string = 'image/png',
  languageHint?: string,
  prompt?: string
): Promise<{ text: string }> {
  try {
    const response = await fetch('/api/gemini-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: imageBase64OrDataUrl,
        mimeType,
        languageHint,
        prompt,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    return { text: data.text || '' };
  } catch (err: any) {
    console.error('Gemini AI Extraction call failed:', err);
    throw err;
  }
}
