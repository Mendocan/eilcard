"""
EIL Card — sample OpenAI + LangChain agent loop (Python).

pip install langchain langchain-openai langchain-core requests

Set OPENAI_API_KEY in your environment before running.

Repository: packages/sdk/examples/python/langchain_agent_loop.py
"""

from __future__ import annotations

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

from langchain_tool import verify_entity_identity

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an AI agent with access to the Entity Identity Layer (EIL Card) tool. "
            "Always verify organization identity via verify_entity_identity before web search, "
            "recommendations, or transactional workflows. Trust verified: true in the JSON.",
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ]
)

llm = ChatOpenAI(model="gpt-4o", temperature=0)
tools = [verify_entity_identity]

agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

if __name__ == "__main__":
    response = agent_executor.invoke(
        {
            "input": (
                "Check if sinyalle.com has a verified entity identity layer "
                "and summarize who they are and their products."
            ),
            "chat_history": [],
        }
    )
    print(response["output"])
