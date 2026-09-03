import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const [currentPath, outputPath] = process.argv.slice(2);
if (!currentPath || !outputPath) {
  throw new Error("Usage: node add-news-share-dispatch.mjs CURRENT_WORKFLOW_JSON OUTPUT_JSON");
}

const current = JSON.parse(await readFile(currentPath, "utf8"));
const nodeName = "Trigger News Share Sync";
const dispatchNode = {
  parameters: {
    method: "POST",
    url: "https://api.github.com/repos/Verkhovskiy-dev/ai-integrated-report/dispatches",
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: "Accept", value: "application/vnd.github+json" },
        { name: "User-Agent", value: "n8n-AIwatcher" },
      ],
    },
    sendBody: true,
    specifyBody: "json",
    jsonBody: "={{ JSON.stringify({ event_type: \"aiwatcher-report-published\", client_payload: { report_date: $('Merge with SHA').first().json.report.date } }) }}",
    options: {},
  },
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [1792, 768],
  id: "b5ed6185-7fa2-4895-b47a-8dca89d5b4ec",
  name: nodeName,
  retryOnFail: true,
  maxTries: 3,
  waitBetweenTries: 5000,
  credentials: {
    httpHeaderAuth: {
      id: "QfhQQwsU03HGrTFf",
      name: "GitHub API Token",
    },
  },
};

const nodes = current.nodes.some(node => node.name === nodeName)
  ? current.nodes.map(node => node.name === nodeName ? dispatchNode : node)
  : [...current.nodes, dispatchNode];
const connections = {
  ...current.connections,
  "Publish Report Pages": {
    main: [[{ node: nodeName, type: "main", index: 0 }]],
  },
};
const payload = {
  name: current.name,
  nodes,
  connections,
  settings: current.settings,
};

await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ workflowId: current.id, nodeName, outputPath }));
