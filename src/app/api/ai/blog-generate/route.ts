import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { withGeminiRetry, getGeminiErrorMessage } from '@/lib/gemini-retry';

export async function POST(req: NextRequest) {
  try {
    const { topic, type } = await req.json();
    let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      const settings = await prisma.websiteSettings.findFirst();
      apiKey = settings?.geminiApiKey || undefined;
    }

    if (!apiKey) {
      return apiError('AI API Key not configured. Please add GEMINI_API_KEY to your .env file or update it in the Blog Studio settings.', 400);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    let prompt = '';
    if (type === 'blog') {
      prompt = `Generate a professional, SEO-optimized blog post for a restaurant POS system website called GuestFlow.
      Topic: ${topic}
      
      Return the response in JSON format with the following fields:
      - title: A catchy, SEO-friendly title
      - excerpt: A brief 2-line summary
      - content: Full blog content in HTML format (using h2, p, ul, li tags)
      - metaTitle: SEO Meta Title (max 60 chars)
      - metaDescription: SEO Meta Description (max 160 chars)
      - keywords: 5-10 comma-separated keywords
      
      Make the content helpful, professional, and authoritative.`;
    } else if (type === 'seo') {
      prompt = `For a blog post with the title "${topic}", generate SEO metadata.
      Return the response in JSON format with:
      - metaTitle: SEO Meta Title
      - metaDescription: SEO Meta Description
      - keywords: 5-10 comma-separated keywords`;
    }

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    const response = await result.response;
    const text = response.text();

    // Clean JSON from potential markdown markers
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return apiResponse(data);
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    const message = getGeminiErrorMessage(error);
    return apiError(message, error?.status === 503 || error?.status === 429 ? 503 : 500);
  }
}
