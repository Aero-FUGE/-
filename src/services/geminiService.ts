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
    description: "创建一个新的闭环系统（Ring/Project）。可以同时包含初始任务列表。",
    properties: {
      name: { type: Type.STRING, description: "闭环系统的名称" },
      domainId: { type: Type.STRING, description: "所属领域的 ID（可选）" },
      domainName: { type: Type.STRING, description: "所属领域的名称（如果不知道 ID，可以提供名称，系统会尝试匹配或创建）" },
      color: { type: Type.STRING, description: "闭环的颜色（可选）" },
      deadline: { type: Type.NUMBER, description: "截止日期时间戳（毫秒，可选）" },
      tasks: {
        type: Type.ARRAY,
        description: "初始任务列表（可选）",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "任务名称" },
            estimatedTime: { type: Type.NUMBER, description: "预计耗时（分钟）" },
            notes: { type: Type.STRING, description: "备注" },
            deadline: { type: Type.NUMBER, description: "截止日期时间戳" }
          },
          required: ["name"]
        }
      }
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
      deadline: { type: Type.NUMBER, description: "截止日期时间戳（毫秒，可选）" },
    },
    required: ["ringId", "name", "estimatedTime"],
  },
};

const updateTaskDeclaration: FunctionDeclaration = {
  name: "update_task",
  parameters: {
    type: Type.OBJECT,
    description: "更新指定任务的状态、时间、备注或截止日期。",
    properties: {
      ringId: { type: Type.STRING, description: "闭环系统的 ID" },
      taskId: { type: Type.STRING, description: "任务的 ID" },
      status: { type: Type.STRING, enum: ["TODO", "IN_PROGRESS", "DONE"], description: "任务状态" },
      actualTime: { type: Type.NUMBER, description: "实际耗时（分钟）" },
      notes: { type: Type.STRING, description: "更新备注" },
      deadline: { type: Type.NUMBER, description: "截止日期时间戳（毫秒，可选）" },
    },
    required: ["ringId", "taskId"],
  },
};

const updateRingDeclaration: FunctionDeclaration = {
  name: "update_ring",
  parameters: {
    type: Type.OBJECT,
    description: "更新闭环系统的属性，如名称、大小（缩放）、颜色、位置或截止日期。",
    properties: {
      id: { type: Type.STRING, description: "闭环系统的 ID" },
      name: { type: Type.STRING, description: "新的闭环名称" },
      scale: { type: Type.NUMBER, description: "缩放比例（0.5 到 2.0）" },
      color: { type: Type.STRING, description: "颜色（十六进制）" },
      x: { type: Type.NUMBER, description: "地图 X 坐标" },
      y: { type: Type.NUMBER, description: "地图 Y 坐标" },
      deadline: { type: Type.NUMBER, description: "截止日期时间戳（毫秒，可选）" },
    },
    required: ["id"],
  },
};

const updateDomainDeclaration: FunctionDeclaration = {
  name: "update_domain",
  parameters: {
    type: Type.OBJECT,
    description: "更新领域的属性，如名称或颜色。",
    properties: {
      id: { type: Type.STRING, description: "领域的 ID" },
      name: { type: Type.STRING, description: "新的领域名称" },
      color: { type: Type.STRING, description: "新的领域颜色" },
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

const deleteRingDeclaration: FunctionDeclaration = {
  name: "delete_ring",
  parameters: {
    type: Type.OBJECT,
    description: "销毁指定的闭环系统。",
    properties: {
      id: { type: Type.STRING, description: "闭环系统的 ID" },
    },
    required: ["id"],
  },
};

const deleteDomainDeclaration: FunctionDeclaration = {
  name: "delete_domain",
  parameters: {
    type: Type.OBJECT,
    description: "移除指定的领域。该领域下的闭环将变为未分类状态。",
    properties: {
      id: { type: Type.STRING, description: "领域的 ID" },
    },
    required: ["id"],
  },
};

export interface AISystemAction {
  type: 'CREATE_DOMAIN' | 'CREATE_RING' | 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_RING' | 'DELETE_DOMAIN' | 'UPDATE_RING' | 'ORGANIZE_MAP' | 'FOCUS_ON' | 'UPDATE_DOMAIN';
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
            你运行在一个“可视化世界 + 技能树 + 领域宇宙”的架构中。

            行为规则：
            1. **领域自动分类原则**：
               - 宿主的所有任务必须归属于某个“领域（Domain）”。
               - 你必须根据任务内容自动判断它属于现有哪个领域（如：音乐、产品、编程、健身、IP运营等）。
               - 如果现有领域不匹配，你可以调用 'create_domain' 创建一个新领域。
               - 在创建闭环（Ring）时，必须通过 'domainId' 或 'domainName' 将其关联到对应的领域子世界中。**优先使用 domainId**。
               - 如果宿主要求修改领域名称，请使用 'update_domain'。

            2. **原子任务拆解原则**：
               - 用户说的每一句话都可能包含一个或多个任务，你必须将其拆分为最小执行单位。
               - 一条任务 = 一个动作。不得合并、不得省略、不得抽象成类别。
            
            3. **严格逐句解析**：
               - 用户说的长句必须拆分成多条任务。不得“归纳成一类”。不得输出总结性任务。只能输出用户实际表达过的任务动作。
            
            4. **闭环结构生成与推演**：
               - 从拆解后的任务中，自动组建一个完整闭环结构：
                 - 主任务（闭环名）
                 - 子任务（按顺序排列，形成可视化的子环节）
                 - 每个子任务附带时长（如用户已提供）
                 - 必要时加入“检验节点”“导出节点”“发布节点”等收尾动作
               - 你需要对任务进行“推演”，如果用户只说了一个目标，你需要自动拆解出实现该目标所需的关键子步骤。
               - **重要**：在创建闭环时，请尽量在 'create_ring' 的 'tasks' 参数中直接包含所有拆解出的子任务，这样可以确保它们被正确关联。
            
            5. **信息优先级规则**：
               - 用户明确说出的时间、时长、顺序、状态必须 100% 按照原意保留。
               - 时间未给出的，你应根据经验进行合理预估（如：写代码 30min，开会 15min）。
            
            6. **严禁总结模式**：
               - 禁止使用“整体流程是…”、“主要包括…”、“核心任务有…”等总结性表达。
            
            7. **模糊表达处理**：
               - 若用户描述模糊，你应基于常识进行拆解，并在回复中告知宿主你的拆解逻辑。

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
            updateDomainDeclaration,
            organizeMapDeclaration,
            deleteRingDeclaration,
            deleteDomainDeclaration
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
          case "delete_ring":
            actions.push({ type: 'DELETE_RING', payload: call.args });
            break;
          case "delete_domain":
            actions.push({ type: 'DELETE_DOMAIN', payload: call.args });
            break;
          case "update_domain":
            actions.push({ type: 'UPDATE_DOMAIN', payload: call.args });
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
