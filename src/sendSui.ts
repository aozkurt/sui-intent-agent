import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import fs from "fs";
import OpenAI from "openai";
import { z } from "zod";
import "dotenv/config";
import readline from "readline";


const keyData = JSON.parse(fs.readFileSync("./key.json", "utf8"));
const { secretKey } = decodeSuiPrivateKey(keyData.exportedPrivateKey);
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

const client = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

const TransferIntentSchema = z.object({
  type: z.literal("transfer"),
  to: z.string().startsWith("0x"),
  amount: z.string(),
});

type TransferIntent = z.infer<typeof TransferIntentSchema>;


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function parseIntent(text: string): Promise<TransferIntent> {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
        You are an intent parser.
        Convert user text into JSON.

        You MUST follow this exact schema:

        {
          "type": "transfer",
          "to": "0xADDRESS",
          "amount": "SUI_AMOUNT"
        }

        Rules:
        - Use EXACT property names: type, to, amount
        - "type" MUST be exactly "transfer"
        - "to" MUST be the recipient address
        - "amount" MUST be a string in SUI (example: "0.1")
        - Output ONLY valid JSON
        - No explanations
        - No markdown

        If missing data, output:
        { "error": "MISSING_FIELD" }
        `.trim(),
      },
      { role: "user", content: text },
    ],
  });

  const raw = response.choices[0].message.content;

  console.log("Raw AI output:", raw);

  if (!raw) {
    throw new Error("AI returned empty response");
  }

  const parsed = JSON.parse(raw);

  return TransferIntentSchema.parse(parsed);
}


async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("What do you want to do?\n> ", async (userText) => {
    try {
      console.log("User input:", userText);

      const intent = await parseIntent(userText);
      console.log("Parsed intent:", intent);

      if (intent.type === "transfer") {
        const tx = new Transaction();

        const amountMist = BigInt(
          Math.floor(Number(intent.amount) * 1_000_000_000)
        );

        const [coin] = tx.splitCoins(tx.gas, [amountMist]);
        tx.transferObjects([coin], intent.to);

        const result = await client.signAndExecuteTransaction({
          signer: keypair,
          transaction: tx,
        });

        console.log("TX result:", result);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      rl.close();
    }
  });
}

main().catch(console.error);
