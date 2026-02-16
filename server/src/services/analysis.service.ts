import fs from 'fs';
import path from 'path';

export interface AnalysisResult {
    summary: string;
    actionItems: string[];
    keyTopics: string[];
    sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export class AnalysisService {

    /**
     * Analyzes a raw transcript file and generates insights.
     * In a real production app, this would call OpenAI/Anthropic API.
     * Here we simulate it with heuristics and templates for demonstration.
     */
    public async analyzeTranscript(transcriptPath: string): Promise<AnalysisResult> {
        console.log(`🧠 AI Analysis started for: ${transcriptPath}`);

        try {
            const content = fs.readFileSync(transcriptPath, 'utf-8');

            // Mock Analysis - Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1500));

            // basic heuristics
            const lines = content.split('\n');
            const participantCount = new Set(lines.filter(l => l.startsWith('[')).map(l => l.split('] ')[1]?.replace(':', '').trim())).size;
            const textLength = content.length;

            // Generate a plausible summary based on content keywords (simple simulation)
            let topic = "General Discussion";
            if (content.toLowerCase().includes("bug")) topic = "Bug Triage";
            if (content.toLowerCase().includes("design")) topic = "Design Review";
            if (content.toLowerCase().includes("timeline")) topic = "Project Planning";

            return {
                summary: `This was a ${topic} meeting with approx ${participantCount} active participants. The discussion covered various aspects of the project, focusing on recent updates and future planning.`,
                actionItems: [
                    "Review the discussed points by EOD.",
                    "Schedule a follow-up meeting for next week.",
                    "Update the documentation with new decisions."
                ],
                keyTopics: [topic, "Next Steps", "Risk Mitigation"],
                sentiment: "Positive"
            };

        } catch (error) {
            console.error("Analysis failed:", error);
            return {
                summary: "Analysis failed due to an error.",
                actionItems: [],
                keyTopics: [],
                sentiment: "Neutral"
            };
        }
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
${result.actionItems.map(item => `- [ ] ${item}`).join('\n')}

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
