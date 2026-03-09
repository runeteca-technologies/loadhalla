// agent.js
// Runeteca Lead Qualifier Agent — v1
// Teaches: tool use, agent loop, structured output

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import Anthropic from "@anthropic-ai/sdk";
import { IncomingWebhook } from '@slack/webhook'

const FOUNDER = {
  name: "Victor Christiansen",
  title: "Founder & CEO",
  company: "Runeteca Technologies LLC",
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL)

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================
// TOOLS — These are the "hands" of your agent
// Claude reads these definitions and decides when to call them
// ============================================================

const tools = [
  {
    name: "score_lead",
    description:
      "Scores a lead from 1-10 based on their message, company context, and fit for Runeteca's AI automation SaaS products. Returns a score and reasoning.",
    input_schema: {
      type: "object",
      properties: {
        lead_name: { type: "string", description: "Full name of the lead" },
        company: { type: "string", description: "Company name" },
        message: { type: "string", description: "Their inbound message" },
        reasoning: {
          type: "string",
          description: "Why you gave this score",
        },
        score: {
          type: "number",
          description: "Score from 1-10. 10 = perfect fit",
        },
      },
      required: ["lead_name", "company", "message", "reasoning", "score"],
    },
  },
  {
    name: "identify_use_case",
    description:
      "Identifies which Runeteca product(s) best fit this lead: Loadhalla (load board automation), Callhalla (AI calling), Leadhalla (lead gen), Flowhalla (workflow automation)",
    input_schema: {
      type: "object",
      properties: {
        recommended_products: {
          type: "array",
          items: { type: "string" },
          description: "List of recommended Halla products",
        },
        use_case_summary: {
          type: "string",
          description: "One sentence on why these products fit",
        },
        pain_points_identified: {
          type: "array",
          items: { type: "string" },
          description: "Pain points detected from their message",
        },
      },
      required: [
        "recommended_products",
        "use_case_summary",
        "pain_points_identified",
      ],
    },
  },
  {
    name: "draft_follow_up",
    description:
      "Drafts a personalized follow-up email from Victor at Runeteca Technologies to the lead",
    input_schema: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Email subject line" },
        body: {
          type: "string",
          description: "Full email body, personalized to their situation",
        },
        urgency: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "How quickly Victor should send this",
        },
      },
      required: ["subject", "body", "urgency"],
    },
  },
];

// ============================================================
// TOOL EXECUTION — What actually happens when Claude calls a tool
// In a real system, these would hit your DB, APIs, etc.
// For now, we simulate the execution and let Claude fill the data
// ============================================================

function executeTool(toolName, toolInput) {
  console.log(`\n🔧 Agent called tool: ${toolName}`);
  console.log(`   Input:`, JSON.stringify(toolInput, null, 2));

  // In this v1 agent, Claude itself generates the tool outputs
  // (this is valid — Claude uses tools to STRUCTURE its thinking)
  // In v2, these would call real external services
  return toolInput;
}

async function sendSlackApproval(lead, report) {
  await webhook.send({
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🎯 New Lead Qualified — ${report.score?.score}/10`,
        }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Name:*\n${lead.name}` },
          { type: "mrkdwn", text: `*Company:*\n${lead.company}` },
          { type: "mrkdwn", text: `*Industry:*\n${lead.industry}` },
          { type: "mrkdwn", text: `*Source:*\n${lead.source}` },
          { type: "mrkdwn", text: `*Score:*\n${report.score?.score}/10` },
          { type: "mrkdwn", text: `*Urgency:*\n${report.follow_up?.urgency}` },
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Reasoning:*\n${report.score?.reasoning}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Recommended Products:*\n${report.use_case?.recommended_products.join(', ')}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Pain Points:*\n${report.use_case?.pain_points_identified.map(p => `• ${p}`).join('\n')}`
        }
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Draft Email:*\n*Subject:* ${report.follow_up?.subject}\n\n${report.follow_up?.body}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Lead ID: ${lead.id} | Approve or skip this lead in your terminal`
          }
        ]
      }
    ]
  })
}

// ============================================================
// THE AGENT LOOP — This is the core pattern
// ============================================================

async function runLeadQualifierAgent(lead) {
  console.log("\n" + "=".repeat(60));
  console.log("🤖 RUNETECA LEAD QUALIFIER AGENT STARTING");
  console.log("=".repeat(60));
  console.log(`📥 Processing lead: ${lead.name} from ${lead.company}`);

  const systemPrompt = `You are a lead qualification specialist for ${FOUNDER.company}, 
an AI automation SaaS company. ${FOUNDER.name} is the ${FOUNDER.title}.

Runeteca's products:
- Loadhalla: AI automation for freight brokers and trucking companies (load board ops)
- Callhalla: AI-powered calling and voice automation
- Leadhalla: Automated lead generation and outreach  
- Flowhalla: General workflow automation for SMBs

Your job: Analyze inbound leads and qualify them completely using your available tools.
You MUST use all three tools before finishing:
1. score_lead — assess fit and quality
2. identify_use_case — match to Runeteca products
3. draft_follow_up — write personalized outreach

Be direct, specific, and actionable. Victor is busy — give him everything he needs to act fast.`;

  // This is the agent's "memory" — it grows as the conversation progresses
  const messages = [
    {
      role: "user",
      content: `Please qualify this inbound lead completely:

Name: ${lead.name}
Company: ${lead.company}  
Industry: ${lead.industry}
Message: "${lead.message}"
Source: ${lead.source}`,
    },
  ];

  const qualificationReport = {
    lead: lead,
    score: null,
    use_case: null,
    follow_up: null,
    tool_calls_made: [],
  };

  // ============================================================
  // THE LOOP — Keep running until Claude says it's done (no more tool calls)
  // ============================================================

  let iteration = 0;
  const maxIterations = 10; // Safety limit — always have one

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n🔄 Agent loop iteration ${iteration}`);

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      tools: tools,
      messages: messages,
    });

    console.log(`   Stop reason: ${response.stop_reason}`);

    // Add Claude's response to message history (maintains context)
    messages.push({
      role: "assistant",
      content: response.content,
    });

    // If Claude is done — no more tools to call
    if (response.stop_reason === "end_turn") {
      console.log("\n✅ Agent finished — no more tool calls needed");
      break;
    }

    // If Claude wants to use tools
    if (response.stop_reason === "tool_use") {
      const toolResults = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          // Execute the tool
          const result = executeTool(block.name, block.input);

          // Store results in our report
          qualificationReport.tool_calls_made.push(block.name);
          if (block.name === "score_lead") qualificationReport.score = result;
          if (block.name === "identify_use_case")
            qualificationReport.use_case = result;
          if (block.name === "draft_follow_up")
            qualificationReport.follow_up = result;

          // Package result to send back to Claude
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }

      // Send tool results back — Claude will continue from here
      messages.push({
        role: "user",
        content: toolResults,
      });
    }
  }

  return qualificationReport;
}

// ============================================================
// TEST IT — Simulate a real inbound lead for Runeteca
// ============================================================

import readline from 'readline'

function askForApproval(leadName) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(`\n👋 Approve email for ${leadName}? (y/n): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y')
    })
  })
}

async function main() {
  // Pull all unqualified leads from Supabase
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'new')

  if (error) {
    console.error('Failed to fetch leads:', error)
    return
  }

  if (!leads || leads.length === 0) {
    console.log('No new leads to process')
    return
  }

  console.log(`\nFound ${leads.length} new leads to qualify`)

  for (const lead of leads) {
    const report = await runLeadQualifierAgent(lead)

    // Send to Slack
    await sendSlackApproval(lead, report)
    console.log(`\n📨 Sent to Slack for approval`)

    // Terminal approval for now — will swap to Slack buttons next
    const approved = await askForApproval(lead.name)

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: approved ? 'qualified' : 'disqualified',
        ai_score: report.score?.score,
        ai_reasoning: report.score?.reasoning,
        ai_recommended_products: report.use_case?.recommended_products,
        ai_pain_points: report.use_case?.pain_points_identified,
        ai_follow_up_subject: report.follow_up?.subject,
        ai_follow_up_body: report.follow_up?.body,
        ai_follow_up_urgency: report.follow_up?.urgency,
        ai_qualified_at: new Date().toISOString(),
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error(`Failed to update lead ${lead.name}:`, updateError)
    } else {
      console.log(`✅ Lead ${lead.name} marked as ${approved ? 'qualified' : 'disqualified'}`)
    }
  }
}

main().catch(console.error)