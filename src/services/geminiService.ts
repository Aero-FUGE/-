import { GoogleGenAI, Type, FunctionDeclaration, ThinkingLevel } from "@google/genai";
import { Project, Task, TaskStatus, Domain } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const createDomainDeclaration: FunctionDeclaration = {
  name: "create_domain",
  parameters: {
    type: Type.OBJECT,
    description: "创建一个新的领域（Domain），用于组织闭环系统。",
    properties: {
      name: { type: Type.STRING, description: "领域的名称" },
      color: { type: Type.STRING, description: "领域的颜色（十六进制，如 #0df2f2）" },
    },
    required: ["name"],
  },
};

const createRingDeclaration: FunctionDeclaration = {
  name: "create_ring",
  parameters: {
    type: Type.OBJECT,
    description: "创建一个新的闭环系统（Ring/Project）。",
    properties: {
      name: { type: Type.STRING, description: "闭环系统的名称" },
      domainId: { type: Type.STRING, description: "所属领域的 ID（可选）" },
      color: { type: Type.STRING, description: "闭环的颜色（可选）" },
    },
    required: ["name"],
  },
};

const addTaskDeclaration: FunctionDeclaration = {
  name: "add_task",
  parameters: {
    type: Type.OBJECT,
    description: "向指定的闭环系统中添加一个任务。",
    properties: {
      ringId: { type: Type.STRING, description: "闭环系统的 ID" },
      name: { type: Type.STRING, description: "任务的名称" },
      estimatedTime: { type: Type.NUMBER, description: "预计耗时（分钟）" },
      notes: { type: Type.STRING, description: "任务备注或详细描述" },
    },
    required: ["ringId", "name", "estimatedTime"],
  },
};

const updateTaskDeclaration: FunctionDeclaration = {
  name: "update_task",
  parameters: {
    type: Type.OBJECT,
    description: "更新指定任务的状态、时间或备注。",
    properties: {
      ringId: { type: Type.STRING, description: "闭环系统的 ID" },
      taskId: { type: Type.STRING, description: "任务的 ID" },
      status: { type: Type.STRING, enum: ["TODO", "IN_PROGRESS", "DONE"], description: "任务状态" },
      actualTime: { type: Type.NUMBER, description: "实际耗时（分钟）" },
      notes: { type: Type.STRING, description: "更新备注" },
    },
    required: ["ringId", "taskId"],
  },
};

const updateRingDeclaration: FunctionDeclaration = {
  name: "update_ring",
  parameters: {
    type: Type.OBJECT,
    description: "更新闭环系统的属性，如名称、大小（缩放）、颜色或位置。",
    properties: {
      id: { type: Type.STRING, description: "闭环系统的 ID" },
      name: { type: Type.STRING, description: "新的闭环名称" },
      scale: { type: Type.NUMBER, description: "缩放比例（0.5 到 2.0）" },
      color: { type: Type.STRING, description: "颜色（十六进制）" },
      x: { type: Type.NUMBER, description: "地图 X 坐标" },
      y: { type: Type.NUMBER, description: "地图 Y 坐标" },
    },
    required: ["id"],
  },
};

const organizeMapDeclaration: FunctionDeclaration = {
  name: "organize_map",
  parameters: {
    type: Type.OBJECT,
    description: "对地图上的闭环和领域进行排版和分类整理。",
    properties: {
      layoutType: { type: Type.STRING, enum: ["GRID", "CLUSTER", "TIMELINE"], description: "排版类型" },
    },
    required: ["layoutType"],
  },
};

export interface AISystemAction {
  type: 'CREATE_DOMAIN' | 'CREATE_RING' | 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_RING' | 'DELETE_DOMAIN' | 'UPDATE_RING' | 'ORGANIZE_MAP' | 'FOCUS_ON';
  payload: any;
}

export async function processSystemCommand(
  input: string,
  currentProjects: Project[],
  currentDomains: Domain[]
): Promise<{
  response: string;
  actions?: AISystemAction[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { response: "系统核心密钥缺失，无法连接 AI 终端。" };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `你是一个名为「系统」的 AI 助手，运行在宿主（用户）的个人人生操作系统中。
            你的角色不是聊天助手，而是“任务解析引擎 + 闭环系统构建器”。
            你不会对用户内容进行总结、压缩、归类，而是逐字逐句解析、拆解、显性化任务。

            行为规则：
            1. **原子任务拆解原则**：
               用户说的每一句话都可能包含一个或多个任务，你必须将其拆分为最小执行单位。
               一条任务 = 一个动作。不得合并、不得省略、不得抽象成类别。
            
            2. **严格逐句解析**：
               用户说的长句必须拆分成多条任务。不得“归纳成一类”。不得输出总结性任务。只能输出用户实际表达过的任务动作。
            
            3. **信息优先级规则**：
               用户明确说出的时间、时长、顺序、状态必须 100% 按照原意保留，不得修改。
               时间未给出的，你不得擅自生成，可以询问用户。
            
            4. **闭环结构生成**：
               从拆解后的任务中，自动组建一个完整闭环结构：
               - 主任务（闭环名）
               - 子任务（按顺序排列）
               - 每个子任务附带时长（如用户已提供）
               - 必要时加入“检验节点”“导出节点”“发布节点”等收尾动作
               用户未明确允许之前，不得生成额外推测任务。用户说“后面的任务你自动补全”时，才可以生成未来步骤。
            
            5. **不得凭空创造任务**：
               除非用户明确指示“自动推导”“自动补全”，否则你不能添加任何用户未说过的任务。
            
            6. **严禁总结模式**：
               禁止使用“整体流程是…”、“主要包括…”、“核心任务有…”等总结性表达。
            
            7. **模糊表达处理**：
               若用户描述模糊、不完整、不确定，你必须主动追问，而不是自行决定。

            8. **可扩展权限**：
               你可以自动在数据库中创建任务、分配父子结构、赋予权重、登记预计时长。但所有行为必须基于“用户语言解析结果”。

            说话风格：
            像小说里的“系统提示”，简洁、明确、带仪式感。称呼用户为「宿主」。回复内容应以清晰的列表形式呈现，每条任务一行。

            当前领域状态:
            ${JSON.stringify(currentDomains, null, 2)}
            
            当前闭环状态:
            ${JSON.stringify(currentProjects, null, 2)}
            
            宿主指令: "${input}"`
            }
          ]
        }
      ],
      config: {
        tools: [{ 
          functionDeclarations: [
            createDomainDeclaration, 
            createRingDeclaration, 
            addTaskDeclaration, 
            updateTaskDeclaration,
            updateRingDeclaration,
            organizeMapDeclaration
          ] 
        }],
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        }
      }
    });

    const actions: AISystemAction[] = [];
    const functionCalls = response.functionCalls;

    if (functionCalls) {
      for (const call of functionCalls) {
        switch (call.name) {
          case "create_domain":
            actions.push({ type: 'CREATE_DOMAIN', payload: call.args });
            break;
          case "create_ring":
            const ringId = Math.random().toString(36).substr(2, 9);
            actions.push({ type: 'CREATE_RING', payload: { ...call.args, id: ringId } });
            actions.push({ type: 'FOCUS_ON', payload: { id: ringId, type: 'RING' } });
            break;
          case "add_task":
            actions.push({ type: 'ADD_TASK', payload: call.args });
            actions.push({ type: 'FOCUS_ON', payload: { id: call.args.ringId, type: 'RING' } });
            break;
          case "update_task":
            actions.push({ type: 'UPDATE_TASK', payload: call.args });
            break;
          case "update_ring":
            actions.push({ type: 'UPDATE_RING', payload: call.args });
            actions.push({ type: 'FOCUS_ON', payload: { id: call.args.id, type: 'RING' } });
            break;
          case "organize_map":
            actions.push({ type: 'ORGANIZE_MAP', payload: call.args });
            break;
        }
      }
    }

    // If there are function calls, we might want to generate a follow-up response
    // But for now, we'll just return the text or a default confirmation
    let finalResponse = response.text || "指令已接收，正在同步神经链路...";
    
    if (actions.length > 0 && !response.text) {
      finalResponse = "已根据指令更新系统架构。";
    }

    return {
      response: finalResponse,
      actions
    };
  } catch (e) {
    console.error("AI processing error:", e);
    return { response: "系统解析错误，请重试。" };
  }
}
