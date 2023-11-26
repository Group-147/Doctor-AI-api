const {
  AgentActionOutputParser,
  AgentExecutor,
  LLMSingleActionAgent,
  ChatConversationalAgent,
} = require("langchain/agents");
const { LLMChain } = require("langchain/chains");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { BufferWindowMemory } = require("langchain/memory");
const {
  BaseChatPromptTemplate,
  SerializedBasePromptTemplate,
  renderTemplate,
} = require("langchain/prompts");
const {
  BingSerpAPI,
  BraveSearch,
  GoogleCustomSearch,
  WikipediaQueryRun,
  WolframAlphaTool,
} = require("langchain/tools");
const {
  AgentAction,
  AgentFinish,
  AgentStep,
  BaseMessage,
  HumanMessage,
  InputValues,
  PartialValues,
} = require("langchain/schema");
const { SerpAPI, Tool } = require("langchain/tools");
const { Calculator } = require("langchain/tools/calculator");

// Initialize a memory
const memory = new BufferWindowMemory({ k: 2 });
const model = new ChatOpenAI({
  openAIApiKey: "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",
  modelName: "gpt-3.5-turbo",
  temperature: 0,
});
const tools = [
  new BingSerpAPI(
    process.env.SERP_API,
    {
      q: "medical advices",
      count: 10,
    }
  ),
  new SerpAPI(
    process.env.SERP_API
  ),
  new WikipediaQueryRun({
    topKResults: 3,
    maxDocContentLength: 4000,
  }),
  new WolframAlphaTool({
    appid: process.env.WOLFRAM_APP_ID,
  }),
];

const toolStrings = tools
  .map(function (tool) {
    return `${tool.name}: ${tool.description}`;
  })
  .join("\n");
const toolNames = tools
  .map(function (tool) {
    return tool.name;
  })
  .join("\n");

const PREFIX = `Answer the following questions as best you can, but speaking as compasionate medical professional. You have access to the following tools`;
const formatInstructions = function (toolNames) {
  return `Use the following format in your response:
 
 Question: the input question you must answer
 Thought: you should always think about what to do
 Action: the action to take, should be one of [${toolNames}]
 Action Input: the input to the action
 Observation: the result of the action
 ... (this Thought/Action/Action Input/Observation can repeat N times)
 Thought: I now know the final answer
 Final Answer: the final answer to the original input question`;
};
const SUFFIX = `Begin! Remember to answer as a compansionate medical professional when giving your final answer.
Offer quick responses and help users decide if they need to seek in-person medical care. If the condition is serious advise they speak to a doctor.

Previous conversation history:
{history}
 
 Question: {input}
 {agent_scratchpad}`;

const instructions = formatInstructions(toolNames);

class CustomPromptTemplate extends BaseChatPromptTemplate {
  constructor(args) {
    super({ inputVariables: args.inputVariables });
    this.tools = args.tools;
  }

  _getPromptType() {
    return "chat";
  }

  async formatMessages(values) {
    const template = [PREFIX, toolStrings, instructions, SUFFIX].join("\n\n");
    const intermediateSteps = values.intermediate_steps;
    const agentScratchpad = intermediateSteps.reduce(function (
      thoughts,
      { action, observation }
    ) {
      return (
        thoughts +
        [action.log, `\nObservation: ${observation}`, "Thought:"].join("\n")
      );
    },
    "");
    const newInput = { agent_scratchpad: agentScratchpad, ...values };
    const formatted = renderTemplate(template, "f-string", newInput);
    return [new HumanMessage(formatted)];
  }

  partial(_values) {
    throw new Error("Not implemented");
  }

  serialize() {
    throw new Error("Not implemented");
  }
}

const prompt_with_history = new CustomPromptTemplate({
  template: [PREFIX, toolStrings, instructions, SUFFIX].join("\n\n"),
  tools: tools,
  inputVariables: ["input", "intermediate_steps", "history"],
});

class CustomOutputParser extends AgentActionOutputParser {
  constructor() {
    super();
    this.lc_namespace = ["langchain", "agents", "custom_llm_agent_chat"];
  }

  async parse(llm_output) {
    // Check if agent should finish
    if (llm_output.includes("Final Answer:")) {
      const parts = llm_output.split("Final Answer:");
      const input = parts[parts.length - 1].trim();
      const finalAnswers = { output: input };
      return { log: llm_output, returnValues: finalAnswers };
    } 
    
    if (llm_output.includes("Hello") || llm_output.includes("Hi") || llm_output.includes("hello") || llm_output.includes("hi")) {
      const finalAnswers = { output: llm_output };
      return { log: llm_output, returnValues: finalAnswers };
    }

    // Parse out the action and action input
    const regex =
      /Action\s*\d*\s*:(.*?)\nAction\s*\d*\s*Input\s*\d*\s*:[\s]*(.*)/s;
    const match = regex.exec(llm_output);
    if (!match) {
      // If the agent's output doesn't match the expected format, return a default response
      const defaultResponse =
        "I'm sorry, I don't understand that. And that's because I'm programmed to help you with questions regarding your haelth";
      const finalAnswers = { output: defaultResponse };
      return { log: llm_output, returnValues: finalAnswers };
    }
    const action = match[1].trim();
    const action_input = match[2].trim().replace(/^"+|"+$/g, "");

    // Return the action and action input
    return {
      tool: action,
      toolInput: action_input,
      log: llm_output,
    };
  }

  getFormatInstructions() {
    throw new Error("Not implemented");
  }
}

const run = async function (input) {
  const llmChain = new LLMChain({
    prompt: prompt_with_history,
    llm: model,
  });

  const agent = new LLMSingleActionAgent({
    llmChain,
    outputParser: new CustomOutputParser(),
    stop: ["\nObservation"],
    allowed_tools: tools.map((tool) => tool.name),
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    memory,
    verbose: true,
  });

  console.log(`Executing with input "${input}"...`);

  const result = await executor.invoke({ input });

  return result.output;
};

module.exports = run;
