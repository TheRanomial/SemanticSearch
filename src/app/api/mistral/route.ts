import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { queryString } = body;

    if (!queryString) {
      return NextResponse.json(
        { error: "No query string provided" },
        { status: 400 }
      );
    }

    const scriptPath = path.resolve("./scripts/mistral_client.py");
    const command = `python ${scriptPath} "${queryString}"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error(`Error: ${stderr}`);
      return NextResponse.json(
        { error: "Failed to execute script" },
        { status: 500 }
      );
    }

    try {
      const vector = JSON.parse(stdout);
      return NextResponse.json(vector);
    } catch (parseError) {
      return NextResponse.json(
        { error: "Failed to parse script output" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
