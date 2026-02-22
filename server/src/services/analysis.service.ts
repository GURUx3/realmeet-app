import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export interface ActionItem {
    task: string;
    assignee?: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate?: string;
}

export interface AnalysisResult {
    summary: string;
    actionItems: ActionItem[];
    keyDecisions: string[];
    keyTopics: string[];
    sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export class AnalysisService {

    /**
     * Analyzes a raw transcript file and generates insights.
     * Uses Google Gemini Pro via REST API.
     */
    public async detectLiveInteractions(content: string): Promise<{ tasks: string[], topics: string[] }> {
        const apiKey = env.geminiApiKey;
        if (!apiKey) return { tasks: [], topics: [] };

        const prompt = `
            Analyze the following short snippet of a live meeting transcript. 
            Identify if any specific ACTION ITEMS or KEY TOPICS have just been mentioned.
            
            SNIPPET:
            """
            ${content}
            """
            
            JSON OUTPUT:
            {
              "tasks": ["short actionable task if any, else empty array"],
              "topics": ["1-2 keywords if any, else empty array"]
            }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });

            if (!response.ok) return { tasks: [], topics: [] };
            const data = await response.json() as any;
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) return { tasks: [], topics: [] };

            return JSON.parse(text);
        } catch (e) {
            return { tasks: [], topics: [] };
        }
    }

    public async analyzeTranscript(content: string): Promise<AnalysisResult> {
        const apiKey = env.geminiApiKey;

        if (!apiKey) {
            console.warn("⚠️ GEMINI_API_KEY not found. Using high-quality executive mock data.");
            return this.getMockAnalysis();
        }

        try {
            const prompt = `
            You are a world-class Executive Strategy Consultant and Chief of Staff. 
            Analyze the following meeting transcript and produce a high-stakes, professional executive report.
            
            TRANSCRIPT:
            """
            ${content}
            """
            
            CRITICAL REQUIREMENTS:
            1. SUMMARY: Provide a concise, 2-3 sentence executive overview focusing on outcomes and strategic direction.
            2. ACTION ITEMS: Extract high-impact tasks. For each:
               - "task": Professional, clear actionable description.
               - "assignee": Specific person (e.g., "Guru", "Zem") or "The Team" if clear, otherwise null.
               - "priority": "High" | "Medium" | "Low" based on impact.
               - "dueDate": Exact date (e.g., "Feb 25") if mentioned, otherwise null.
            3. KEY DECISIONS: List all major strategic or technical decisions finalized during this talk.
            4. KEY TOPICS: List top 5 strategic keywords.
            5. SENTIMENT: "Positive" | "Neutral" | "Negative" based on team alignment.

            OUTPUT FORMAT (JSON):
            {
              "summary": "...",
              "actionItems": [{ "task": "...", "assignee": "...", "priority": "...", "dueDate": "..." }],
              "keyDecisions": ["..."],
              "keyTopics": ["..."],
              "sentiment": "..."
            }
            
            Ensure the JSON is strictly valid. Focus on clarity and professional tone.
        `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        response_mime_type: "application/json",
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(errData)}`);
            }

            const data = await response.json() as any;
            const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!resultText) {
                throw new Error("Empty response from Gemini");
            }

            const parsedResult = JSON.parse(resultText) as AnalysisResult;

            // Validate sentiment enum
            if (!['Positive', 'Neutral', 'Negative'].includes(parsedResult.sentiment)) {
                parsedResult.sentiment = 'Neutral';
            }

            return parsedResult;

        } catch (error) {
            console.error("Analysis failed:", error);
            return this.getMockAnalysis(transcriptPath);
        }
    }

    /**
     * Fallback mock analysis if API fails or is missing
     */
    private async getMockAnalysis(transcriptPath: string): Promise<AnalysisResult> {
        const content = fs.readFileSync(transcriptPath, 'utf-8');

        // basic heuristics
        const lines = content.split('\n');
        const participantCount = new Set(lines.filter(l => l.startsWith('[')).map(l => l.split('] ')[1]?.replace(':', '').trim())).size;

        let topic = "General Discussion";
        if (content.toLowerCase().includes("bug")) topic = "Bug Triage";
        if (content.toLowerCase().includes("design")) topic = "Design Review";
        if (content.toLowerCase().includes("timeline")) topic = "Project Planning";

        return {
            summary: `This was a ${topic} meeting with approx ${participantCount} active participants. The discussion covered various aspects of the project, focusing on recent updates and future planning. (Note: This is a fallback mock analysis)`,
            actionItems: [
                { task: "Review the discussed points by EOD.", priority: "Medium" },
                { task: "Schedule a follow-up meeting for next week.", priority: "Low" },
                { task: "Update the documentation with new decisions.", priority: "High" }
            ],
            keyDecisions: ["Confirmed project direction for the upcoming sprint."],
            keyTopics: [topic, "Next Steps", "Risk Mitigation"],
            sentiment: "Positive"
        };
    }

    /**
     * Saves the analysis to a markdown file next to the transcript
     */
    public saveAnalysis(transcriptPath: string, result: AnalysisResult): string {
        const dir = path.dirname(transcriptPath);
        const filename = path.basename(transcriptPath, '.txt') + '_analysis.md';
        const outputPath = path.join(dir, filename);

        const mdContent = `
# 🧠 AI Meeting Analysis
**Source:** ${path.basename(transcriptPath)}
**Date:** ${new Date().toLocaleDateString()}

## 📝 Executive Summary
${result.summary}

## ✅ Action Items
${result.actionItems.map(item => `- [ ] **${item.task}** ${item.assignee ? `(@${item.assignee})` : ''} - *Priority: ${item.priority}*${item.dueDate ? ` (Due: ${item.dueDate})` : ''}`).join('\n')}

## 🎯 Key Decisions
${result.keyDecisions.map(d => `- ${d}`).join('\n')}

## 🔑 Key Topics
${result.keyTopics.map(t => `- ${t}`).join('\n')}

## 🌡️ Sentiment
**${result.sentiment}**
`;

        fs.writeFileSync(outputPath, mdContent, 'utf-8');
        return outputPath;
    }
}

export const analysisService = new AnalysisService();
