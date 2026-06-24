import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Sends raw print commands (ESC/POS) to a system-installed printer.
 * Supports Windows (via PowerShell + Win32 spooler API) and macOS/Linux (via CUPS lp -o raw).
 */
export async function printToSystem(data: string | Buffer, printerName: string): Promise<void> {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `print_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.bin`);

  try {
    // Write raw data to temp file (using 'binary' encoding to preserve all byte ranges)
    const buffer = typeof data === 'string' ? Buffer.from(data, 'binary') : data;
    await fs.promises.writeFile(tempFilePath, buffer);

    const platform = process.platform;

    // Sanitize printer name to prevent command injection
    const sanitizedPrinterName = printerName.replace(/["'`\\]/g, '');

    if (platform === 'win32') {
      // Windows: use PowerShell with inline C# RawPrinterHelper
      const psScript = `
$printerName = "${sanitizedPrinterName}"
$filePath = "${tempFilePath.replace(/\\/g, '\\\\')}"

$code = @"
using System;
using System.Runtime.InteropServices;
using System.IO;

public class RawPrinter {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, IntPtr pBytes, Int32 dwCount) {
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        bool bSuccess = false;
        di.pDocName = "OrderMint POS Receipt";
        di.pDataType = "RAW";

        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    Int32 dwWritten = 0;
                    bSuccess = WritePrinter(hPrinter, pBytes, dwCount, out dwWritten);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return bSuccess;
    }

    public static bool SendFileToPrinter(string szPrinterName, string szFileName) {
        byte[] bytes = File.ReadAllBytes(szFileName);
        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
        Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
        bool bSuccess = SendBytesToPrinter(szPrinterName, pUnmanagedBytes, bytes.Length);
        Marshal.FreeCoTaskMem(pUnmanagedBytes);
        return bSuccess;
    }
}
"@

Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
[RawPrinter]::SendFileToPrinter($printerName, $filePath)
`;

      const psScriptPath = path.join(tempDir, `print_script_${Date.now()}.ps1`);
      await fs.promises.writeFile(psScriptPath, psScript, 'utf8');

      try {
        const { stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`);
        if (stderr && stderr.trim()) {
          console.warn('[Windows System Printer] PowerShell Warning/Error:', stderr);
        }
      } finally {
        await fs.promises.unlink(psScriptPath).catch(() => {});
      }

    } else if (platform === 'darwin' || platform === 'linux') {
      // macOS/Linux: send raw file directly to CUPS queue
      try {
        const { stderr } = await execAsync(`lp -d "${sanitizedPrinterName}" -o raw "${tempFilePath}"`);
        if (stderr && stderr.trim()) {
          console.warn('[CUPS System Printer] lp Warning/Error:', stderr);
        }
      } catch (e: any) {
        console.error('[CUPS System Printer] lp command failed:', e.message);
        throw new Error(`Failed to print to CUPS printer "${sanitizedPrinterName}": ${e.message}`);
      }
    } else {
      throw new Error(`Platform ${platform} is not supported for system printing.`);
    }
  } catch (err: any) {
    console.error('[System Printer] Printing failed:', err);
    throw err;
  } finally {
    // Clean up temporary binary data file
    await fs.promises.unlink(tempFilePath).catch(() => {});
  }
}
