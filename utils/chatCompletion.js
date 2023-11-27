// const {
//   initializeAgentExecutorWithOptions,
//   LLMSingleActionAgent,
//   AgentExecutor,
// } = require("langchain/agents");
// const { BufferWindowMemory } = require("langchain/memory");
// const { ChatOpenAI } = require("langchain/chat_models/openai");
// const {
//   BingSerpAPI,
//   BraveSearch,
//   GoogleCustomSearch,
//   SerpAPI,
//   WikipediaQueryRun,
//   WolframAlphaTool,
// } = require("langchain/tools");
// const { PromptTemplate } = require("langchain/prompts");
// const { JsonOutputFunctionsParser } = require("langchain/output_parsers");
// const { LLMChain } = require("langchain/chains");

// require("dotenv").config({ path: "./.env" });

// // Initialize the OpenAI instance with API key
// const llm = new ChatOpenAI({
//   openAIApiKey: "",
//   modelName: "gpt-3.5-turbo",
//   temperature: 0,
// });

// // Initialize a memory
// const memory = new BufferWindowMemory({ k: 2 });

// const tools = [
//   new BingSerpAPI(
//     "",
//     {
//       q: "medical advices",
//       count: 10,
//     }
//   ),
//   new SerpAPI(
//     ""
//   ),
//   new WikipediaQueryRun({
//     topKResults: 3,
//     maxDocContentLength: 4000,
//   }),
//   new WolframAlphaTool({
//     appid: "",
//   }),
// ];

// // Define the prompt template
// var prompt = PromptTemplate.fromTemplate(
//   `Based on the context "{context}", use the following tools {tools} to generate a response.`
// );

// var formattedPrompt = prompt.format({
//   context:
//     "By searching the Internet, find how many albums has Boldy James dropped since 2010 and how many albums has Nas dropped since 2010? Find who dropped more albums and show the difference in percent.",
//   tools,
//   inputVariables: ["input", "agent_scratchpad"]
// });

// // Instantiate the parser
// const parser = new JsonOutputFunctionsParser();

// // Initialize the LLM chain
// const llmChain = new LLMChain({
//   llm: llm,
//   prompt: formattedPrompt,
// });

// // Initialize the agent
// const agent = new LLMSingleActionAgent({
//   llmChain: llmChain,
//   outputParser: parser,
//   stop: ["\nObservation:"],
//   allowed_tools: tools.map((tool) => tool.name),
// });

// // Initialize the agent executor
// const agentExecutor = new AgentExecutor({
//   agent: agent,
//   tools: tools,
//   verbose: true,
//   memory: memory,
//   // inputs: /* Inputs for the agent */,
//   // callbacks: /* Optional callbacks */,
// });

// // Run the agentExecutor with an input
// // Define the input
// const input = {
//   input: "What is the capital of France?"
// };

// // Run the agentExecutor with the input
// const output = agentExecutor.invoke(input);

// // Access the output
// console.log(output);

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
    const encodedQuery = encodeURIComponent(query);
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
  // new BingSerpAPI(process.env.SERP_API, {
  //   q: "medical advices",
  //   count: 10,
  // }),
  // new SerpAPI(process.env.SERP_API),
  // new WikipediaQueryRun({
  //   topKResults: 3,
  //   maxDocContentLength: 4000,
  // }),
  // new WolframAlphaTool({
  //   appid: process.env.WOLFRAM_APP_ID,
  // }),
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
    const finalAnswers = { output: llm_output };
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