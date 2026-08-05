import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  const transport = new SSEClientTransport(new URL("https://app.keeperhub.com/mcp"), {
    headers: {
      "Authorization": "Bearer kh_NsMDskhgdRMJFxwkAQI5EjcEywCM7dLQ"
    }
  });
  const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
  try {
    await client.connect(transport);
    console.log("Connected!");
    const resources = await client.listResources();
    console.log("Resources:", resources);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
