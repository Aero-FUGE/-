import { GoogleGenAI, Type } from "@google/genai";
import { Project, Task, TaskStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function processSystemCommand(
  input: string,
  currentProjects: Project[]
): Promise<{
  response: string;
  updatedProjects?: Project[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return { response: "系统核心密钥缺失，无法连接 AI 终端。请检查环境变量配置。" };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are the "System AI" for a gamified task management system called "My System".
            The system uses "Rings" (Projects) which contain "Tasks".
            
            Current System State:
            ${JSON.stringify(currentProjects, null, 2)}
            
            User Input: "${input}"
            
            Your goals:
            1. Understand if the user wants to:
               - Create a new project (Ring)
               - Add a task to an existing project
               - Update a task's progress or status (e.g., "I finished the first part of arrangement")
               - Split a task into smaller ones (e.g., "Split the recording task into Verse and Chorus")
               - Log time spent on a task
            2. Provide a helpful, tech-themed response (Cyberpunk style).
            3. If the user's request is ambiguous or missing details (like estimated time for a new task), ASK for them in the "message" field.
            4. If you make changes, return the ENTIRE updated projects array in the JSON response.
            5. When a task is marked as DONE, ensure its actualTime is updated if the user mentioned it, or set it equal to estimatedTime if not specified.
            
            Return a JSON object with:
            - "message": Your response to the user (in Chinese).
            - "projects": The updated projects array (optional, only if changed).
            `
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  scale: { type: Type.NUMBER },
                  color: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        estimatedTime: { type: Type.NUMBER },
                        actualTime: { type: Type.NUMBER },
                        status: { type: Type.STRING },
                        notes: { type: Type.STRING },
                        order: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              }
            }
          },
          required: ["message"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      response: result.message,
      updatedProjects: result.projects
    };
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { response: "系统解析错误，请重试。" };
  }
}
