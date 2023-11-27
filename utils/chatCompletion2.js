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
const axios = require("axios");
const cheerio = require("cheerio");
const natural = require("natural");

// Initialize a memory
const memory = new BufferWindowMemory({ k: 2 });
const model = new ChatOpenAI({
  openAIApiKey: process.env.AI_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0,
});

class DuckDuckGoSearchRun {
  constructor() {
    this.name = "DuckDuckGoSearchRun";
    this.description = "A tool that performs a web search using DuckDuckGo.";
  }
 
  async run(query) {
    const encodedQuery = encodeURIComponent(`site:mayoclinic.org ${query}`);
    const url = `https://duckduckgo.com/html/?q=${encodedQuery}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const results = [];
 
    $(".result__body").each((i, element) => {
      const title = $(element).find(".result__title").text().trim();
      const snippet = $(element).find(".result__snippet").text().trim();
      const url = $(element).find(".result__url").attr("href");
 
      results.push({ title, snippet, url });
    });
 
    return results;
  }
 }
 
const tools = [
  new BingSerpAPI(process.env.SERP_API, {
    q: "medical advices",
    count: 10,
  }),
  new SerpAPI(process.env.SERP_API),
  new WikipediaQueryRun({
    topKResults: 3,
    maxDocContentLength: 4000,
  }),
  new WolframAlphaTool({
    appid: process.env.WOLFRAM_APP_ID,
  }),
  new DuckDuckGoSearchRun(),
];

const PREFIX = `Answer the following questions as best you can. You have access to the following tools:`;
const SUFFIX = `Begin!

Question: {input}
{agent_scratchpad}`;

class CustomPromptTemplate extends BaseChatPromptTemplate {
  constructor(args) {
    super({ inputVariables: args.inputVariables });
    this.tools = args.tools;
  }

  _getPromptType() {
    return "chat";
  }

  async formatMessages(values) {
    const toolStrings = this.tools
      .map((tool) => `${tool.name}: ${tool.description}`)
      .join("\n");

    const template = `${PREFIX}\n\n${toolStrings}\n\n${SUFFIX}`;

    const intermediateSteps = values.intermediate_steps;
    const agentScratchpad = intermediateSteps
      .map(
        ({ action, observation }) =>
          `${action.log}\nObservation: ${observation}\nThought:`
      )
      .join("\n");

    const formatted = renderTemplate(template, "f-string", {
      ...values,
      agent_scratchpad: agentScratchpad,
    });

    return [new HumanMessage(formatted)];
  }

  partial(_values) {
    throw new Error("Not implemented");
  }

  serialize() {
    throw new Error("Not implemented");
  }
}

class CustomOutputParser extends AgentActionOutputParser {
  constructor() {
    super();
    this.lc_namespace = ["langchain", "agents", "custom_llm_agent_chat"];
    this.tools = tools;
  }
 
  async parse(llm_output) {
    let finalAnswers;
 
    // Check if the output starts with "medical:"
    if (llm_output.startsWith("medical:")) {
      // Use the DuckDuckGoSearchRun tool to search for the result
      const duckDuckGoTool = this.tools.find((tool) => tool.name === "DuckDuckGoSearchRun");
      const searchResults = await duckDuckGoTool.run(llm_output.slice(8)); // Remove "medical:" from the output
 
      // Select the first search result as the result
      const result = searchResults[0];
 
      finalAnswers = { output: result };
    } else {
      finalAnswers = { output: llm_output };
    }
 
    return { log: llm_output, returnValues: finalAnswers };
  }
 
  getFormatInstructions() {
    throw new Error("Not implemented");
  }
 }
 



const run = async function (input) {
  try {
    const llmChain = new LLMChain({
      prompt: new CustomPromptTemplate({
        inputVariables: ["input", "intermediate_steps"],
        tools,
      }),
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
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

module.exports = run;