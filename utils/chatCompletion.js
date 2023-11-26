const {
  initializeAgentExecutorWithOptions,
  LLMSingleActionAgent,
  AgentExecutor,
} = require("langchain/agents");
const { BufferWindowMemory } = require("langchain/memory");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const {
  BingSerpAPI,
  BraveSearch,
  GoogleCustomSearch,
  SerpAPI,
  WikipediaQueryRun,
  WolframAlphaTool,
} = require("langchain/tools");
const { PromptTemplate } = require("langchain/prompts");
const { JsonOutputFunctionsParser } = require("langchain/output_parsers");
const { LLMChain } = require("langchain/chains");

require("dotenv").config({ path: "./.env" });

// Initialize the OpenAI instance with API key
const llm = new ChatOpenAI({
  openAIApiKey: "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",
  modelName: "gpt-3.5-turbo",
  temperature: 0,
});

// Initialize a memory
const memory = new BufferWindowMemory({ k: 2 });

const tools = [
  // new BraveSearch("BSAfk-9zA7iMBfvOtpoJbLW1jsvx7yG"),
  new BingSerpAPI(
    "6bda49fb90cb9408cfcb753e833de25f1199a7a0199cfc81a7f78ff17840c10a",
    {
      q: "medical advices",
      count: 10,
    }
  ),
  // new GoogleCustomSearch("AIzaSyCQbaJLl-A3xj8C90TS7w_cYYQNdZA9fgA", "66bfaf9490f3e474e"),
  new SerpAPI(
    "6bda49fb90cb9408cfcb753e833de25f1199a7a0199cfc81a7f78ff17840c10a"
  ),
  new WikipediaQueryRun({
    topKResults: 3,
    maxDocContentLength: 4000,
  }),
  new WolframAlphaTool({
    appid: "8A2W6A-6YEQVV2K7H",
  }),
];

// Define the prompt template
var prompt = PromptTemplate.fromTemplate(
  `Based on the context "{context}", use the following tools {tools} to generate a response.`
);

var formattedPrompt = prompt.format({
  context:
    "By searching the Internet, find how many albums has Boldy James dropped since 2010 and how many albums has Nas dropped since 2010? Find who dropped more albums and show the difference in percent.",
  tools,
  inputVariables: ["input", "agent_scratchpad"]
});

// Instantiate the parser
const parser = new JsonOutputFunctionsParser();

// Initialize the LLM chain
const llmChain = new LLMChain({
  llm: llm,
  prompt: formattedPrompt,
});

// Initialize the agent
const agent = new LLMSingleActionAgent({
  llmChain: llmChain,
  outputParser: parser,
  stop: ["\nObservation:"],
  allowed_tools: tools.map((tool) => tool.name),
});

// Initialize the agent executor
const agentExecutor = new AgentExecutor({
  agent: agent,
  tools: tools,
  verbose: true,
  memory: memory,
  // inputs: /* Inputs for the agent */,
  // callbacks: /* Optional callbacks */,
});

// Run the agentExecutor with an input
// Define the input
const input = {
  input: "What is the capital of France?"
};

// Run the agentExecutor with the input
const output = agentExecutor.invoke(input);

// Access the output
console.log(output);